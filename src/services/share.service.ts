import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class ShareService {
  /**
   * Share post in DM with rich preview
   */
  async sharePostInDM(
    postId: string,
    postData: {
      authorId: string;
      authorUsername: string;
      authorAvatarURL: string;
      mediaURL: string;
      caption?: string;
      mediaType: 'image' | 'video';
    },
    fromUserId: string,
    fromUsername: string,
    fromAvatarURL: string,
    toUserId: string,
    message?: string
  ): Promise<void> {
    // Create or get conversation
    const conversationId = [fromUserId, toUserId].sort().join('_');
    const conversationRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(conversationRef);

    // Create conversation if doesn't exist
    if (!convSnap.exists()) {
      await setDoc(conversationRef, {
        conversationId,
        type: 'direct',
        participantIds: [fromUserId, toUserId],
        participantCount: 2,
        lastMessage: {
          text: 'Shared a post',
          senderId: fromUserId,
          timestamp: serverTimestamp(),
        },
        unreadCounts: { [toUserId]: 1, [fromUserId]: 0 },
        mutedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });
      console.log('✅ Conversation created successfully');
    }

    // Ensure conversation exists before creating message
    console.log('💬 Creating message in conversation:', conversationId);
    
    // Send the shared post message
    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    await setDoc(messageRef, {
      messageId: messageRef.id,
      senderId: fromUserId,
      senderUsername: fromUsername,
      senderAvatarURL: fromAvatarURL,
      type: 'shared_post',
      text: message || '',
      sharedContent: {
        type: 'post',
        id: postId,
        authorId: postData.authorId,
        authorUsername: postData.authorUsername,
        authorAvatarURL: postData.authorAvatarURL,
        coverImageURL: postData.mediaURL,
        caption: postData.caption,
        mediaType: postData.mediaType,
      },
      status: 'sent',
      readBy: [fromUserId],
      isForwarded: false,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
    });

    // Update conversation
    if (convSnap.exists()) {
      await updateDoc(conversationRef, {
        lastMessage: {
          text: 'Shared a post',
          senderId: fromUserId,
          timestamp: serverTimestamp(),
        },
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCounts.${toUserId}`]: (convSnap.data().unreadCounts?.[toUserId] || 0) + 1,
      });
    }

    console.log('✅ Post shared in DM:', { postId, from: fromUsername, to: toUserId });
  }

  /**
   * Share glimpse in DM with rich preview
   */
  async shareGlimpseInDM(
    glimpseId: string,
    glimpseData: {
      authorId: string;
      authorUsername: string;
      authorAvatarURL: string;
      mediaURL: string;
      caption?: string;
      mediaType: 'image' | 'video';
    },
    fromUserId: string,
    fromUsername: string,
    fromAvatarURL: string,
    toUserId: string,
    message?: string
  ): Promise<void> {
    // Create or get conversation
    const conversationId = [fromUserId, toUserId].sort().join('_');
    const conversationRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(conversationRef);

    // Create conversation if doesn't exist
    if (!convSnap.exists()) {
      await setDoc(conversationRef, {
        conversationId,
        type: 'direct',
        participantIds: [fromUserId, toUserId],
        participantCount: 2,
        lastMessage: {
          text: 'Shared a glimpse',
          senderId: fromUserId,
          timestamp: serverTimestamp(),
        },
        unreadCounts: { [toUserId]: 1, [fromUserId]: 0 },
        mutedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });
    }

    // Send the shared glimpse message
    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    const messageData: any = {
      messageId: messageRef.id,
      senderId: fromUserId,
      senderUsername: fromUsername,
      senderAvatarURL: fromAvatarURL,
      text: message || '',
      type: 'shared_glimpse',
      sharedContent: {
        type: 'glimpse',
        id: glimpseId,
        authorId: glimpseData.authorId,
        authorUsername: glimpseData.authorUsername,
        authorAvatarURL: glimpseData.authorAvatarURL,
        coverImageURL: glimpseData.mediaURL,
        mediaType: 'video',
        caption: glimpseData.caption,
      },
      createdAt: serverTimestamp(),
      status: 'sent',
      readBy: [fromUserId],
    };

    console.log('📦 Saving message to Firestore:', {
      conversationId,
      messageId: messageRef.id,
      type: messageData.type,
      hasSharedContent: !!messageData.sharedContent,
      sharedContentType: messageData.sharedContent?.type
    });

    await setDoc(messageRef, messageData);

    // Update conversation
    if (convSnap.exists()) {
      await updateDoc(conversationRef, {
        lastMessage: {
          text: 'Shared a glimpse',
          senderId: fromUserId,
          timestamp: serverTimestamp(),
        },
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCounts.${toUserId}`]: (convSnap.data().unreadCounts?.[toUserId] || 0) + 1,
      });
    }

    console.log('✅ Glimpse shared in DM:', { glimpseId, conversationId, from: fromUsername, to: toUserId });
  }

  /**
   * Share story in DM with rich preview
   */
  async shareStoryInDM(
    storyId: string,
    storyData: {
      authorId: string;
      authorUsername: string;
      authorAvatarURL: string;
      mediaURL: string;
      mediaType: 'image' | 'video';
    },
    fromUserId: string,
    fromUsername: string,
    fromAvatarURL: string,
    toUserId: string,
    message?: string
  ): Promise<void> {
    console.log('📤 shareStoryInDM called:', { storyId, fromUserId, toUserId });
    
    // Create or get conversation
    const conversationId = [fromUserId, toUserId].sort().join('_');
    const conversationRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(conversationRef);

    // Create conversation if doesn't exist
    if (!convSnap.exists()) {
      console.log('📝 Creating new conversation:', conversationId);
      await setDoc(conversationRef, {
        conversationId,
        type: 'direct',
        participantIds: [fromUserId, toUserId],
        participantCount: 2,
        lastMessage: {
          text: 'Shared a story',
          senderId: fromUserId,
          timestamp: serverTimestamp(),
        },
        unreadCounts: { [toUserId]: 1, [fromUserId]: 0 },
        mutedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });
    }

    // Send the shared story message
    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    await setDoc(messageRef, {
      messageId: messageRef.id,
      senderId: fromUserId,
      senderUsername: fromUsername,
      senderAvatarURL: fromAvatarURL,
      type: 'shared_story',
      text: message || '',
      sharedContent: {
        type: 'story',
        id: storyId,
        authorId: storyData.authorId,
        authorUsername: storyData.authorUsername,
        authorAvatarURL: storyData.authorAvatarURL,
        coverImageURL: storyData.mediaURL,
        mediaType: storyData.mediaType,
      },
      status: 'sent',
      readBy: [fromUserId],
      isForwarded: false,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
    });

    // Update conversation
    if (convSnap.exists()) {
      await updateDoc(conversationRef, {
        lastMessage: {
          text: 'Shared a story',
          senderId: fromUserId,
          timestamp: serverTimestamp(),
        },
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCounts.${toUserId}`]: (convSnap.data().unreadCounts?.[toUserId] || 0) + 1,
      });
    }

    console.log('✅ Story shared in DM:', { storyId, from: fromUsername, to: toUserId });
  }
}

export const shareService = new ShareService();
