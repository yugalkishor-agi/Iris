import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { messageService } from './message.service';

export class ShareService {
  async sharePostInDM(
    postId: string,
    postData: {
      authorId: string;
      authorUsername: string;
      authorAvatarURL: string;
      authorVerified?: boolean;
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
    const conversationId = await messageService.getOrCreateDirectConversation(fromUserId, toUserId);
    const conversationRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(conversationRef);

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
        contentId: postId,
        authorId: postData.authorId,
        authorUsername: postData.authorUsername,
        authorAvatarURL: postData.authorAvatarURL,
        verified: !!postData.authorVerified,
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

    await updateDoc(conversationRef, {
      lastMessage: {
        text: 'Shared a post',
        senderId: fromUserId,
        timestamp: serverTimestamp(),
      },
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCounts.${toUserId}`]: (convSnap.data()?.unreadCounts?.[toUserId] || 0) + 1,
    });

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        'stats.sharesCount': increment(1),
        engagement: increment(1),
        lastEngagementAt: serverTimestamp(),
      });
    } catch {}
  }

  async shareGlimpseInDM(
    glimpseId: string,
    glimpseData: {
      authorId: string;
      authorUsername: string;
      authorAvatarURL: string;
      authorVerified?: boolean;
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
    const conversationId = await messageService.getOrCreateDirectConversation(fromUserId, toUserId);
    const conversationRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(conversationRef);

    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    await setDoc(messageRef, {
      messageId: messageRef.id,
      senderId: fromUserId,
      senderUsername: fromUsername,
      senderAvatarURL: fromAvatarURL,
      text: message || '',
      type: 'shared_glimpse',
      sharedContent: {
        type: 'glimpse',
        id: glimpseId,
        contentId: glimpseId,
        authorId: glimpseData.authorId,
        authorUsername: glimpseData.authorUsername,
        authorAvatarURL: glimpseData.authorAvatarURL,
        coverImageURL: glimpseData.mediaURL,
        mediaType: glimpseData.mediaType || 'video',
        caption: glimpseData.caption,
      },
      createdAt: serverTimestamp(),
      status: 'sent',
      readBy: [fromUserId],
      isForwarded: false,
      isEdited: false,
      isDeleted: false,
    });

    await updateDoc(conversationRef, {
      lastMessage: {
        text: 'Shared a glimpse',
        senderId: fromUserId,
        timestamp: serverTimestamp(),
      },
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCounts.${toUserId}`]: (convSnap.data()?.unreadCounts?.[toUserId] || 0) + 1,
    });

    try {
      const glimpseRef = doc(db, 'glimpses', glimpseId);
      await updateDoc(glimpseRef, {
        'stats.sharesCount': increment(1),
      });
    } catch {}
  }

  async shareStoryInDM(
    storyId: string,
    storyData: {
      authorId: string;
      authorUsername: string;
      authorAvatarURL: string;
      authorVerified?: boolean;
      mediaURL: string;
      mediaType: 'image' | 'video';
    },
    fromUserId: string,
    fromUsername: string,
    fromAvatarURL: string,
    toUserId: string,
    message?: string
  ): Promise<void> {
    const conversationId = await messageService.getOrCreateDirectConversation(fromUserId, toUserId);
    const conversationRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(conversationRef);

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
        contentId: storyId,
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

    await updateDoc(conversationRef, {
      lastMessage: {
        text: 'Shared a story',
        senderId: fromUserId,
        timestamp: serverTimestamp(),
      },
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCounts.${toUserId}`]: (convSnap.data()?.unreadCounts?.[toUserId] || 0) + 1,
    });
  }
}

export const shareService = new ShareService();

