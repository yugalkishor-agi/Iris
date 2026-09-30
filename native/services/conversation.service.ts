import { collection, onSnapshot, orderBy, query, where, QuerySnapshot, DocumentData, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { messageService } from './message.service';

class ConversationService {
  /**
   * Listen to conversations for a specific user
   */
  listenToConversations(
    userId: string, 
    callback: (snapshot: QuerySnapshot<DocumentData>) => void
  ) {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );
    
    return onSnapshot(q, callback);
  }

  async getConversations(userId: string) {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );
    return getDocs(q);
  }

  pinConversation(conversationId: string, userId: string) {
    return messageService.pinConversation(conversationId, userId);
  }
  
  unpinConversation(conversationId: string, userId: string) {
    return messageService.unpinConversation(conversationId, userId);
  }
  
  muteConversation(conversationId: string, userId: string) {
    return messageService.muteConversation(conversationId, userId);
  }
  
  unmuteConversation(conversationId: string, userId: string) {
    return messageService.unmuteConversation(conversationId, userId);
  }
  
  archiveConversation(conversationId: string, userId: string) {
    return messageService.archiveConversation(conversationId, userId);
  }
  
  unarchiveConversation(conversationId: string, userId: string) {
    return messageService.unarchiveConversation(conversationId, userId);
  }
  
  deleteConversation(conversationId: string, userId: string) {
    return messageService.deleteConversation(conversationId, userId);
  }
}

export const conversationService = new ConversationService();
