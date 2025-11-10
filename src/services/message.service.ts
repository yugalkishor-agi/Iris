import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  writeBatch,
  deleteField,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Conversation, Message, CreateMessageData } from '../types/database';
import { userService } from './user.service';

export class MessageService {
  // ==========================================
  // CONVERSATION OPERATIONS
  // ==========================================

  /**
   * Check if two users can message directly (must follow each other)
   * Returns true if they follow each other, false otherwise
   */
  async canMessageDirectly(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Import userService dynamically to avoid circular dependency
      const { userService } = await import('./user.service');
      
      // Check if userId1 follows userId2
      const user1Following = await userService.getFollowing(userId1);
      const user1FollowsUser2 = user1Following.includes(userId2);
      
      // Check if userId2 follows userId1
      const user2Following = await userService.getFollowing(userId2);
      const user2FollowsUser1 = user2Following.includes(userId1);
      
      // Both must follow each other for direct messaging
      return user1FollowsUser2 && user2FollowsUser1;
    } catch (error) {
      console.error('Error checking if users can message:', error);
      return false; // Default to not allowing if error
    }
  }

  /**
   * Create or get existing direct conversation
   */
  async getOrCreateDirectConversation(
    userId1: string,
    userId2: string
  ): Promise<string> {
    // Sort user IDs to ensure consistent ordering
    const sortedIds = [userId1, userId2].sort();
    
    // Check if conversation exists - search for both users
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('type', '==', 'direct'),
      where('participantIds', 'array-contains', userId1)
    );

    const snapshot = await getDocs(q);
    
    // Find existing conversation with both users
    const existing = snapshot.docs.find((doc) => {
      const data = doc.data();
      const participants = data.participantIds.sort();
      return participants.length === 2 && 
             participants[0] === sortedIds[0] && 
             participants[1] === sortedIds[1];
    });

    if (existing) {
      console.log('Found existing conversation:', existing.id);
      return existing.id;
    }

    // Create new conversation with sorted participant IDs
    const conversationRef = doc(collection(db, 'conversations'));
    const conversationId = conversationRef.id;

    // Note: Caller is responsible for checking mutual following
    // We initialize with empty restrictedBy - caller can update if needed
    const restrictedBy: string[] = [];

    await setDoc(conversationRef, {
      conversationId: conversationRef.id,
      type: 'direct',
      participantIds: sortedIds,
      participantCount: 2,
      createdBy: userId1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      unreadCounts: {
        [userId1]: 0,
        [userId2]: 0,
      },
      lastMessage: null,
      pinnedBy: [],
      mutedBy: [],
      deletedBy: [],
      restrictedBy, // Auto-restrict if not mutual followers
    });

    console.log('Created new conversation:', conversationId);
    return conversationId;
  }

  /**
   * Create group conversation
   */
  async createGroupConversation(
    creatorId: string,
    participantIds: string[],
    groupName: string,
    groupAvatarURL?: string
  ): Promise<string> {
    const conversationRef = doc(collection(db, 'conversations'));
    const conversationId = conversationRef.id;

    const allParticipants = [...new Set([creatorId, ...participantIds])];
    const unreadCounts: { [key: string]: number } = {};
    allParticipants.forEach((id) => {
      unreadCounts[id] = 0;
    });

    await setDoc(conversationRef, {
      conversationId,
      type: 'group',
      groupName,
      groupAvatarURL,
      groupAdmins: [creatorId],
      participantIds: allParticipants,
      participantCount: allParticipants.length,
      unreadCounts,
      mutedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    });

    return conversationId;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      return null;
    }

    return { conversationId: conversationSnap.id, ...conversationSnap.data() } as Conversation;
  }

  /**
   * Check if conversation is in request mode for a user
   * Returns true if user has restricted this conversation
   */
  async isConversationRestricted(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) return false;
    
    const restrictedBy = conversation.restrictedBy || [];
    return restrictedBy.includes(userId);
  }

  /**
   * Check if user should see active status for a conversation
   * Active status is hidden if conversation is in request mode
   */
  async shouldShowActiveStatus(conversationId: string, userId: string): Promise<boolean> {
    const isRestricted = await this.isConversationRestricted(conversationId, userId);
    return !isRestricted; // Hide active status if restricted
  }

  /**
   * Mute a conversation for a user (will be replaced by toggle version below)
   */
  private async _legacyMuteConversation(conversationId: string, userId: string): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      throw new Error('Conversation not found');
    }

    const data = conversationSnap.data();
    const mutedBy = data.mutedBy || {};
    
    mutedBy[userId] = {
      mutedAt: serverTimestamp(),
      isMuted: true,
    };

    await updateDoc(conversationRef, {
      mutedBy,
    });
  }

  /**
   * Unmute a conversation for a user
   */
  async unmuteConversation(conversationId: string, userId: string): Promise<void> {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`mutedBy.${userId}`]: deleteField()
    });
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(
    userId: string,
    limitCount = 50
  ): Promise<Conversation[]> {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    // Filter out conversations that user has deleted
    return snapshot.docs
      .map((doc) => doc.data() as Conversation)
      .filter((conv) => {
        const deletedBy = conv.deletedBy || [];
        return !deletedBy.includes(userId);
      });
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  // ==========================================
  // MESSAGE OPERATIONS
  // ==========================================

  /**
   * Share content (post/glimpse) to a user
   */
  async shareContent(
    fromUserId: string,
    toUserId: string,
    contentType: 'post' | 'glimpse',
    contentId: string,
    sharedContent: any,
    message?: string
  ): Promise<string> {
    // Get or create conversation
    const conversationId = await this.getOrCreateDirectConversation(fromUserId, toUserId);
    
    // Send message with shared content
    const messageData: CreateMessageData = {
      senderId: fromUserId,
      senderUsername: sharedContent.username || 'User',
      text: message || '',
      type: contentType === 'post' ? 'shared_post' : 'shared_glimpse',
      sharedContent: {
        contentId,
        type: contentType,
        ...sharedContent,
      },
    };
    
    return await this.sendMessage(conversationId, messageData);
  }

  /**
   * Share story to a user
   */
  async shareStory(
    conversationId: string,
    fromUserId: string,
    storyId: string,
    storyAuthor: string,
    storyCover: string,
    authorVerified: boolean = false
  ): Promise<string> {
    const messageData: CreateMessageData = {
      senderId: fromUserId,
      senderUsername: storyAuthor,
      text: '',
      type: 'shared_story',
      sharedContent: {
        contentId: storyId,
        type: 'story',
        username: storyAuthor,
        coverImage: storyCover,
        verified: authorVerified,
      },
    };
    
    return await this.sendMessage(conversationId, messageData);
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    messageData: CreateMessageData
  ): Promise<string> {
    const batch = writeBatch(db);

    // Create message
    const messageRef = doc(collection(db, `conversations/${conversationId}/messages`));
    const messageId = messageRef.id;

    const messageDoc: any = {
      messageId,
      conversationId,
      ...messageData,
      status: 'sent',
      readBy: [messageData.senderId],
      isForwarded: false,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Include replyTo if it exists in messageData
    if ((messageData as any).replyTo) {
      messageDoc.replyTo = (messageData as any).replyTo;
    }
    
    batch.set(messageRef, messageDoc as Message);

    // Update conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    
    // Get current conversation to update unread counts
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      throw new Error('Conversation not found. Please create a conversation first.');
    }
    
    const conversation = conversationSnap.data() as Conversation;
    
    // Auto-restrict for recipient on FIRST message if not mutual followers
    const isFirstMessage = !conversation.lastMessage || conversation.lastMessage === null;
    let updatedRestrictedBy = conversation.restrictedBy || [];
    
    console.log('📨 Message flow:', {
      conversationId,
      isFirstMessage,
      senderId: messageData.senderId,
      participantIds: conversation.participantIds,
      existingRestrictedBy: conversation.restrictedBy
    });
    
    if (isFirstMessage && conversation.type === 'direct') {
      // Get the recipient (other user)
      const recipientId = conversation.participantIds.find(id => id !== messageData.senderId);
      
      console.log('🎯 Checking restriction:', {
        senderId: messageData.senderId,
        recipientId,
        participantIds: conversation.participantIds
      });
      
      if (recipientId) {
        // Check if they can message directly (mutual followers)
        const canMessage = await this.canMessageDirectly(messageData.senderId, recipientId);
        
        console.log('✅ Can message check:', {
          senderId: messageData.senderId,
          recipientId,
          canMessage,
          alreadyRestricted: updatedRestrictedBy.includes(recipientId)
        });
        
        // If not mutual followers, restrict for recipient ONLY
        if (!canMessage && !updatedRestrictedBy.includes(recipientId)) {
          // CRITICAL: Only add recipientId, NOT senderId!
          if (recipientId === messageData.senderId) {
            console.error('🚨 ERROR: Trying to restrict sender! This should NEVER happen!');
            console.error('   → senderId:', messageData.senderId);
            console.error('   → recipientId:', recipientId);
            console.error('   → participantIds:', conversation.participantIds);
          } else {
            updatedRestrictedBy = [...updatedRestrictedBy, recipientId];
            console.log(`🔒 Auto-restricting conversation ${conversationId}`);
            console.log(`   → Sender: ${messageData.senderId} (NOT restricted)`);
            console.log(`   → Recipient: ${recipientId} (RESTRICTED)`);
            console.log(`   → restrictedBy: [${updatedRestrictedBy.join(', ')}]`);
            console.log(`   ✅ VERIFIED: Sender NOT in restrictedBy`);
          }
        } else if (canMessage) {
          console.log('✅ Mutual followers - No restriction needed');
        }
      }
    }
    
    // Reactivate conversation for any deleted participants (REMOVE sender from deletedBy)
    const deletedBy = conversation.deletedBy || [];
    const updatedDeletedBy = deletedBy.filter((id: string) => id !== messageData.senderId);
    
    const newUnreadCounts: { [key: string]: number } = {};
    conversation.participantIds.forEach((participantId) => {
      if (participantId === messageData.senderId) {
        newUnreadCounts[participantId] = 0;
      } else {
        newUnreadCounts[participantId] = (conversation.unreadCounts?.[participantId] || 0) + 1;
      }
    });

    const lastMessageUpdate: any = {
      text: messageData.text || '',
      senderId: messageData.senderId,
      senderUsername: messageData.senderUsername,
      timestamp: serverTimestamp(),
    };
    
    // Only add mediaType if it exists
    if (messageData.mediaType) {
      lastMessageUpdate.mediaType = messageData.mediaType;
    }
    
    const conversationUpdate: any = {
      lastMessage: lastMessageUpdate,
      unreadCounts: newUnreadCounts,
      deletedBy: updatedDeletedBy,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Add restrictedBy if it changed
    if (updatedRestrictedBy.length !== (conversation.restrictedBy || []).length) {
      conversationUpdate.restrictedBy = updatedRestrictedBy;
    }
    
    batch.update(conversationRef, conversationUpdate);

    await batch.commit();
    
    // Send DM notification to recipients (fire and forget)
    this.notifyMessageRecipients(conversationId, messageData, conversation);
    
    return messageId;
  }

  /**
   * Send DM notifications to recipients (async, non-blocking)
   */
  private async notifyMessageRecipients(
    conversationId: string,
    messageData: CreateMessageData,
    conversation: Conversation
  ): Promise<void> {
    try {
      const { userService } = await import('./user.service');
      const sender = await userService.getUser(messageData.senderId);
      if (!sender) return;

      const { notificationService } = await import('./notification.service');
      
      // Notify all participants except sender
      const recipients = conversation.participantIds.filter(id => id !== messageData.senderId);
      
      for (const recipientId of recipients) {
        await notificationService.notifyDM(
          recipientId,
          messageData.senderId,
          sender.username,
          sender.avatarURL || '',
          conversationId,
          messageData.text || 'Sent a photo'
        );
      }
    } catch (error) {
      console.error('DM notification failed:', error);
    }
  }

  /**
   * Get messages (paginated)
   */
  async getMessages(
    conversationId: string,
    limitCount = 50,
    lastDoc?: DocumentSnapshot
  ): Promise<{ messages: Message[]; lastDoc: DocumentSnapshot | null }> {
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    let q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    return {
      messages: snapshot.docs.map((doc) => doc.data() as Message),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  /**
   * Mark message as read
   * Note: Does NOT mark as read if conversation is in request mode for this user
   */
  async markMessageAsRead(
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    // Check if conversation is in request mode for this user
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (conversationSnap.exists()) {
      const restrictedBy = conversationSnap.data().restrictedBy || [];
      
      // If user has restricted this conversation (moved to requests),
      // don't mark messages as read (sender won't see "seen")
      if (restrictedBy.includes(userId)) {
        return; // Skip marking as read
      }
    }
    
    const messageRef = doc(db, `conversations/${conversationId}/messages/${messageId}`);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const currentReadBy = messageDoc.data().readBy || [];
      await updateDoc(messageRef, {
        readBy: [...new Set([...currentReadBy, userId])], // Add userId to existing readBy array
        status: 'read',
        readAt: serverTimestamp(),
      });
    }
  }

  /**
   * Mark all conversation messages as read
   * Note: Does NOT mark as read if conversation is in request mode for this user
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    
    // Get current conversation
    const conversationSnap = await getDoc(conversationRef);
    const conversation = conversationSnap.data() as Conversation;
    
    // Check if conversation is in request mode for this user
    const restrictedBy = conversation.restrictedBy || [];
    if (restrictedBy.includes(userId)) {
      // User has restricted this conversation (moved to requests)
      // Don't mark messages as read (sender won't see "seen")
      // But still clear unread count for user's UI
      const newUnreadCounts = { ...conversation.unreadCounts };
      newUnreadCounts[userId] = 0;
      
      await updateDoc(conversationRef, {
        unreadCounts: newUnreadCounts,
      });
      return; // Skip marking messages as read
    }
    
    // Update unread count for this user
    const newUnreadCounts = { ...conversation.unreadCounts };
    newUnreadCounts[userId] = 0;
    
    await updateDoc(conversationRef, {
      unreadCounts: newUnreadCounts,
    });

    // Mark all unread messages as read
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const q = query(messagesRef, where('senderId', '!=', userId));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      const message = doc.data() as Message;
      const currentReadBy = message.readBy || [];
      
      // Only update if user hasn't read it yet
      if (!currentReadBy.includes(userId)) {
        batch.update(doc.ref, {
          readBy: [...new Set([...currentReadBy, userId])],
          status: 'read',
          readAt: serverTimestamp(),
        });
      }
    });
    
    await batch.commit();
  }

  /**
   * Delete message (soft delete for current user)
   */
  async deleteMessage(
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    const messageRef = doc(db, `conversations/${conversationId}/messages/${messageId}`);
    const msgSnap = await getDoc(messageRef);
    
    if (!msgSnap.exists()) return;
    
    await updateDoc(messageRef, {
      isDeleted: true,
      text: 'This message was deleted',
      deletedBy: userId,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Unsend message (hard delete for ALL users - removes message completely)
   */
  async unsendMessage(
    conversationId: string,
    messageId: string,
    senderId: string
  ): Promise<void> {
    const messageRef = doc(db, `conversations/${conversationId}/messages/${messageId}`);
    const msgSnap = await getDoc(messageRef);
    
    if (!msgSnap.exists()) return;
    
    const message = msgSnap.data() as Message;
    
    // Only sender can unsend their own message
    if (message.senderId !== senderId) {
      throw new Error('You can only unsend your own messages');
    }
    
    // Permanently delete message
    await deleteDoc(messageRef);
  }

  /**
   * Set typing indicator for user in conversation
   */
  async setTyping(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const typingField = `typing.${userId}`;
    
    await updateDoc(conversationRef, {
      [typingField]: isTyping ? serverTimestamp() : null,
    });
  }

  /**
   * Add reaction to message
   */
  async addReaction(
    conversationId: string,
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const messageRef = doc(db, `conversations/${conversationId}/messages/${messageId}`);
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: emoji,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    const messageRef = doc(db, `conversations/${conversationId}/messages/${messageId}`);
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: deleteField(),
    });
  }

  /**
   * Forward single message to another user
   */
  async forwardMessage(
    conversationId: string,
    messageId: string,
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (!messageSnap.exists()) {
      throw new Error('Message not found');
    }

    const originalMessage = messageSnap.data() as Message;
    const newConversationId = await this.getOrCreateDirectConversation(fromUserId, toUserId);

    // Map message type, converting 'media' to 'text' for CreateMessageData
    const messageType = originalMessage.type === 'media' ? 'text' : (originalMessage.type || 'text');

    const forwardedMessageData: CreateMessageData = {
      senderId: fromUserId,
      senderUsername: originalMessage.senderUsername,
      text: originalMessage.text,
      type: messageType as 'text' | 'shared_post' | 'shared_glimpse' | 'shared_story' | 'glimpse_collab_request',
      sharedContent: originalMessage.sharedContent,
      mediaURL: originalMessage.mediaURL,
      mediaType: originalMessage.mediaType,
    };

    await this.sendMessage(newConversationId, forwardedMessageData);
  }

  /**
   * Pin/Unpin conversation (toggle)
   */
  async pinConversation(conversationId: string, userId: string): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) throw new Error('Conversation not found');
    
    const pinnedBy = conversationSnap.data().pinnedBy || [];
    const isPinned = pinnedBy.includes(userId);
    
    await updateDoc(conversationRef, {
      pinnedBy: isPinned 
        ? pinnedBy.filter((id: string) => id !== userId)
        : [...pinnedBy, userId],
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Mute/Unmute conversation (toggle)
   */
  async muteConversation(conversationId: string, userId: string): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) throw new Error('Conversation not found');
    
    const mutedBy = conversationSnap.data().mutedBy || [];
    const isMuted = mutedBy.includes(userId);
    
    await updateDoc(conversationRef, {
      mutedBy: isMuted 
        ? mutedBy.filter((id: string) => id !== userId)
        : [...mutedBy, userId],
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Archive/Unarchive conversation (toggle)
   */
  async archiveConversation(conversationId: string, userId: string): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) throw new Error('Conversation not found');
    
    const archivedBy = conversationSnap.data().archivedBy || [];
    const isArchived = archivedBy.includes(userId);
    
    await updateDoc(conversationRef, {
      archivedBy: isArchived 
        ? archivedBy.filter((id: string) => id !== userId) 
        : [...archivedBy, userId],
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Forward messages to multiple users
   */
  async forwardMessages(fromUserId: string, toUserIds: string[], messages: Message[]): Promise<void> {
    const currentUser = await userService.getUser(fromUserId);

    for (const toUserId of toUserIds) {
      const conversationId = await this.getOrCreateDirectConversation(fromUserId, toUserId);

      for (const originalMsg of messages) {
        const messageRef = doc(collection(db, `conversations/${conversationId}/messages`));
        await setDoc(messageRef, {
          messageId: messageRef.id,
          conversationId,
          senderId: fromUserId,
          senderUsername: currentUser.username,
          senderAvatarURL: currentUser.avatarURL || '',
          text: originalMsg.text || '',
          mediaURL: originalMsg.mediaURL,
          mediaType: originalMsg.mediaType,
          type: originalMsg.type,
          sharedContent: originalMsg.sharedContent,
          readBy: [fromUserId],
          deletedBy: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessageAt: serverTimestamp(),
        lastMessageText: messages.length > 1 ? `${messages.length} forwarded messages` : messages[0].text || 'Media',
        [`unreadCounts.${toUserId}`]: increment(messages.length),
      });
    }
  }

  /**
   * Delete conversation for user (soft delete)
   * Marks conversation as deleted and saves deletion timestamp for message filtering
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) throw new Error('Conversation not found');
    
    const deletedBy = conversationSnap.data().deletedBy || [];
    const deletionTimestamps = conversationSnap.data().deletionTimestamps || {};
    
    // Save deletion timestamp for this user to filter old messages
    deletionTimestamps[userId] = serverTimestamp();
    
    // Mark conversation as deleted for this user
    await updateDoc(conversationRef, {
      deletedBy: [...new Set([...deletedBy, userId])],
      deletionTimestamps,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Move conversation to requests (restrict sender)
   * User can move unwanted chats to request mode
   */
  async moveConversationToRequests(conversationId: string, userId: string): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) throw new Error('Conversation not found');
    
    const data = conversationSnap.data();
    const restrictedBy = data.restrictedBy || [];
    
    // Add userId to restrictedBy array
    // This will make messages from other participant appear as requests
    await updateDoc(conversationRef, {
      restrictedBy: [...new Set([...restrictedBy, userId])],
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Unrestrict conversation (accept from requests)
   * Removes userId from restrictedBy array, moving chat back to main list
   */
  async unrestrictConversation(conversationId: string, userId: string): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) throw new Error('Conversation not found');
    
    const data = conversationSnap.data();
    const restrictedBy = data.restrictedBy || [];
    
    console.log('🔓 Unrestricting conversation:', {
      conversationId,
      userId,
      oldRestrictedBy: restrictedBy,
      wasRestricted: restrictedBy.includes(userId)
    });
    
    // Remove userId from restrictedBy array
    const updatedRestrictedBy = restrictedBy.filter((id: string) => id !== userId);
    
    console.log('✅ Updated restrictedBy:', {
      before: restrictedBy,
      after: updatedRestrictedBy,
      removed: userId,
      isEmpty: updatedRestrictedBy.length === 0
    });
    
    await updateDoc(conversationRef, {
      restrictedBy: updatedRestrictedBy,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Conversation unrestricted successfully!');
    console.log('   → User removed from restrictedBy');
    console.log('   → Chat should now appear in Chats section');
    console.log('   → Real-time listener will update UI automatically');
  }

  /**
   * Permanently delete conversation (admin only)
   */
  async permanentlyDeleteConversation(conversationId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Delete all messages
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const messagesSnapshot = await getDocs(messagesRef);
    
    messagesSnapshot.docs.forEach((messageDoc) => {
      batch.delete(messageDoc.ref);
    });
    
    // Delete conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    batch.delete(conversationRef);
    
    await batch.commit();
  }

  /**
   * Edit message
   */
  async editMessage(
    conversationId: string,
    messageId: string,
    newText: string
  ): Promise<void> {
    const messageRef = doc(db, `conversations/${conversationId}/messages/${messageId}`);
    
    await updateDoc(messageRef, {
      text: newText,
      isEdited: true,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * React to message
   */
  async reactToMessage(
    conversationId: string,
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const reactionRef = doc(
      db,
      `conversations/${conversationId}/messages/${messageId}/reactions/${userId}`
    );
    
    await setDoc(reactionRef, {
      userId,
      emoji,
      reactedAt: serverTimestamp(),
    });
  }


  // ==========================================
  // CONVERSATION SETTINGS
  // ==========================================

  /**
   * Leave group conversation
   */
  async leaveGroupConversation(conversationId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);
    
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    const conversation = conversationSnap.data() as Conversation;
    
    // Remove user from participants
    const participantIds = conversation.participantIds.filter((id) => id !== userId);
    const groupAdmins = conversation.groupAdmins?.filter((id) => id !== userId);
    
    // Update unread counts
    const unreadCounts = { ...conversation.unreadCounts };
    delete unreadCounts[userId];
    
    batch.update(conversationRef, {
      participantIds,
      groupAdmins,
      participantCount: participantIds.length,
      unreadCounts,
    });
    
    await batch.commit();
  }

  // ==========================================
  // MESSAGE REQUESTS
  // ==========================================

  /**
   * Get message requests for a user
   */
  async getMessageRequests(userId: string): Promise<any[]> {
    const requestsRef = collection(db, `users/${userId}/messageRequests`);
    const q = query(
      requestsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      requestId: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Accept a message request
   */
  async acceptMessageRequest(userId: string, requestId: string): Promise<void> {
    const requestRef = doc(db, `users/${userId}/messageRequests/${requestId}`);
    
    await updateDoc(requestRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });
  }

  /**
   * Decline a message request
   */
  async declineMessageRequest(userId: string, requestId: string): Promise<void> {
    const requestRef = doc(db, `users/${userId}/messageRequests/${requestId}`);
    
    // Delete the request
    await updateDoc(requestRef, {
      status: 'declined',
      declinedAt: serverTimestamp(),
    });
  }

  /**
   * Send a message request to a user
   */
  async sendMessageRequest(
    fromUserId: string,
    toUserId: string,
    message: string
  ): Promise<void> {
    const requestRef = doc(collection(db, `users/${toUserId}/messageRequests`));
    
    // Fetch minimal sender info for display
    let fromUsername = '';
    let fromAvatarURL = '';
    try {
      const { userService } = await import('./user.service');
      const sender = await userService.getUser(fromUserId);
      if (sender) {
        fromUsername = sender.username;
        fromAvatarURL = sender.avatarURL || '';
      }
    } catch (e) {
      // ignore, fallback to IDs only
    }

    await setDoc(requestRef, {
      requestId: requestRef.id,
      fromUserId,
      toUserId,
      fromUsername,
      fromAvatarURL,
      message,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }

}

export const messageService = new MessageService();
