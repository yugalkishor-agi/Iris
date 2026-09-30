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
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PhotoTag } from '../components/media/PhotoTagging';

export interface TagNotification {
  id: string;
  postId: string;
  taggedUserId: string;
  taggerUserId: string;
  taggerUsername: string;
  postImageURL: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}

class PhotoTagService {
  /**
   * Save tags for a post
   */
  async savePostTags(postId: string, tags: PhotoTag[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Update post document with tags
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, {
        tags: tags.map(tag => ({
          userId: tag.userId,
          username: tag.username,
          displayName: tag.displayName,
          x: tag.x,
          y: tag.y,
          approved: tag.approved,
        })),
        taggedUsers: tags.map(tag => tag.userId),
        updatedAt: serverTimestamp(),
      });

      // Create tag notifications for users who need approval
      const pendingTags = tags.filter(tag => !tag.approved);
      
      for (const tag of pendingTags) {
        const notificationRef = doc(collection(db, 'tagNotifications'));
        const notification: Omit<TagNotification, 'id'> = {
          postId,
          taggedUserId: tag.userId,
          taggerUserId: '', // Will be set by caller
          taggerUsername: '', // Will be set by caller
          postImageURL: '', // Will be set by caller
          status: 'pending',
          createdAt: serverTimestamp() as Timestamp,
        };
        
        batch.set(notificationRef, notification);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error saving post tags:', error);
      throw error;
    }
  }

  /**
   * Get tags for a post
   */
  async getPostTags(postId: string): Promise<PhotoTag[]> {
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const data = postSnap.data();
        return data.tags || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting post tags:', error);
      return [];
    }
  }

  /**
   * Approve a tag
   */
  async approveTag(postId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Update post tags
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const data = postSnap.data();
        const tags = data.tags || [];
        
        const updatedTags = tags.map((tag: any) => 
          tag.userId === userId ? { ...tag, approved: true } : tag
        );
        
        batch.update(postRef, {
          tags: updatedTags,
          updatedAt: serverTimestamp(),
        });
      }

      // Update notification status
      const notificationsRef = collection(db, 'tagNotifications');
      const q = query(
        notificationsRef,
        where('postId', '==', postId),
        where('taggedUserId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'approved',
          respondedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error approving tag:', error);
      throw error;
    }
  }

  /**
   * Reject a tag
   */
  async rejectTag(postId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Remove tag from post
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const data = postSnap.data();
        const tags = data.tags || [];
        
        const updatedTags = tags.filter((tag: any) => tag.userId !== userId);
        const updatedTaggedUsers = updatedTags.map((tag: any) => tag.userId);
        
        batch.update(postRef, {
          tags: updatedTags,
          taggedUsers: updatedTaggedUsers,
          updatedAt: serverTimestamp(),
        });
      }

      // Update notification status
      const notificationsRef = collection(db, 'tagNotifications');
      const q = query(
        notificationsRef,
        where('postId', '==', postId),
        where('taggedUserId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'rejected',
          respondedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error rejecting tag:', error);
      throw error;
    }
  }

  /**
   * Get pending tag notifications for a user
   */
  async getPendingTagNotifications(userId: string): Promise<TagNotification[]> {
    try {
      const notificationsRef = collection(db, 'tagNotifications');
      const q = query(
        notificationsRef,
        where('taggedUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TagNotification[];
    } catch (error) {
      console.error('Error getting pending tag notifications:', error);
      return [];
    }
  }

  /**
   * Get posts where user is tagged
   */
  async getTaggedPosts(userId: string, limit: number = 20): Promise<string[]> {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('taggedUsers', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error getting tagged posts:', error);
      return [];
    }
  }

  /**
   * Remove tag from post
   */
  async removeTag(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const data = postSnap.data();
        const tags = data.tags || [];
        
        const updatedTags = tags.filter((tag: any) => tag.userId !== userId);
        const updatedTaggedUsers = updatedTags.map((tag: any) => tag.userId);
        
        await updateDoc(postRef, {
          tags: updatedTags,
          taggedUsers: updatedTaggedUsers,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      throw error;
    }
  }

  /**
   * Get tag statistics for a user
   */
  async getTagStats(userId: string): Promise<{
    totalTags: number;
    pendingTags: number;
    approvedTags: number;
  }> {
    try {
      const [taggedPosts, pendingNotifications] = await Promise.all([
        this.getTaggedPosts(userId),
        this.getPendingTagNotifications(userId),
      ]);

      return {
        totalTags: taggedPosts.length,
        pendingTags: pendingNotifications.length,
        approvedTags: taggedPosts.length - pendingNotifications.length,
      };
    } catch (error) {
      console.error('Error getting tag stats:', error);
      return {
        totalTags: 0,
        pendingTags: 0,
        approvedTags: 0,
      };
    }
  }

  /**
   * Batch approve multiple tags
   */
  async batchApproveTag(approvals: { postId: string; userId: string }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const approval of approvals) {
        // Update post tags
        const postRef = doc(db, 'posts', approval.postId);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          const data = postSnap.data();
          const tags = data.tags || [];
          
          const updatedTags = tags.map((tag: any) => 
            tag.userId === approval.userId ? { ...tag, approved: true } : tag
          );
          
          batch.update(postRef, {
            tags: updatedTags,
            updatedAt: serverTimestamp(),
          });
        }

        // Update notification status
        const notificationsRef = collection(db, 'tagNotifications');
        const q = query(
          notificationsRef,
          where('postId', '==', approval.postId),
          where('taggedUserId', '==', approval.userId),
          where('status', '==', 'pending')
        );
        
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'approved',
            respondedAt: serverTimestamp(),
          });
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error batch approving tags:', error);
      throw error;
    }
  }
}

export const photoTagService = new PhotoTagService();
