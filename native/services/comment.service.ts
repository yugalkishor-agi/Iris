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
  serverTimestamp,
  writeBatch,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Comment } from '../components/comments/ThreadedComment';

export interface CommentData {
  postId: string;
  authorId: string;
  text: string;
  parentCommentId?: string;
}

class CommentService {
  /**
   * Add a new comment
   */
  async addComment(commentData: CommentData): Promise<string> {
    try {
      const commentRef = doc(collection(db, 'comments'));
      const commentId = commentRef.id;

      // Get parent comment depth if replying
      let depth = 0;
      let parentComment = null;
      
      if (commentData.parentCommentId) {
        const parentRef = doc(db, 'comments', commentData.parentCommentId);
        const parentSnap = await getDoc(parentRef);
        
        if (parentSnap.exists()) {
          parentComment = parentSnap.data();
          depth = (parentComment.depth || 0) + 1;
        }
      }

      // Get user data for denormalization
      const userRef = doc(db, 'users', commentData.authorId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const comment = {
        commentId,
        postId: commentData.postId,
        authorId: commentData.authorId,
        authorUsername: userData?.username || 'Unknown',
        authorDisplayName: userData?.displayName,
        authorAvatarURL: userData?.avatarURL,
        authorVerified: userData?.verified || false,
        text: commentData.text,
        parentCommentId: commentData.parentCommentId,
        depth,
        likesCount: 0,
        repliesCount: 0,
        isLiked: false,
        isPinned: false,
        likedByCreator: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const batch = writeBatch(db);

      // Add comment
      batch.set(commentRef, comment);

      // Update parent comment replies count
      if (parentComment) {
        const parentRef = doc(db, 'comments', commentData.parentCommentId!);
        batch.update(parentRef, {
          repliesCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      }

      // Update post comments count
      const postRef = doc(db, 'posts', commentData.postId);
      batch.update(postRef, {
        'stats.commentsCount': increment(1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      return commentId;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get threaded comments for a post
   */
  async getThreadedComments(
    postId: string,
    sortBy: 'newest' | 'oldest' | 'top' | 'pinned' = 'pinned'
  ): Promise<Comment[]> {
    try {
      // Get all comments for the post
      const commentsRef = collection(db, 'comments');
      let q = query(
        commentsRef,
        where('postId', '==', postId)
      );

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'oldest':
          q = query(q, orderBy('createdAt', 'asc'));
          break;
        case 'top':
          q = query(q, orderBy('likesCount', 'desc'), orderBy('createdAt', 'desc'));
          break;
        case 'pinned':
          q = query(q, orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc'));
          break;
      }

      const snapshot = await getDocs(q);
      const allComments = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Comment[];

      // Build threaded structure
      return this.buildCommentTree(allComments);
    } catch (error) {
      console.error('Error getting threaded comments:', error);
      return [];
    }
  }

  /**
   * Build comment tree structure
   */
  private buildCommentTree(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map and identify root comments
    comments.forEach(comment => {
      commentMap.set(comment.commentId, { ...comment, replies: [] });
      
      if (!comment.parentCommentId) {
        rootComments.push(commentMap.get(comment.commentId)!);
      }
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      if (comment.parentCommentId && commentMap.has(comment.parentCommentId)) {
        const parent = commentMap.get(comment.parentCommentId)!;
        const child = commentMap.get(comment.commentId)!;
        parent.replies!.push(child);
      }
    });

    return rootComments;
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Add like document
      const likeRef = doc(db, 'comments', commentId, 'likes', userId);
      batch.set(likeRef, {
        userId,
        likedAt: serverTimestamp(),
      });

      // Update comment likes count
      const commentRef = doc(db, 'comments', commentId);
      batch.update(commentRef, {
        likesCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Remove like document
      const likeRef = doc(db, 'comments', commentId, 'likes', userId);
      batch.delete(likeRef);

      // Update comment likes count
      const commentRef = doc(db, 'comments', commentId);
      batch.update(commentRef, {
        likesCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error unliking comment:', error);
      throw error;
    }
  }

  /**
   * Check if user liked a comment
   */
  async isCommentLiked(commentId: string, userId: string): Promise<boolean> {
    try {
      const likeRef = doc(db, 'comments', commentId, 'likes', userId);
      const likeSnap = await getDoc(likeRef);
      return likeSnap.exists();
    } catch (error) {
      console.error('Error checking comment like status:', error);
      return false;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data();
      
      // Check if user owns the comment
      if (comment.authorId !== userId) {
        throw new Error('Not authorized to delete this comment');
      }

      const batch = writeBatch(db);

      // Soft delete the comment
      batch.update(commentRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        text: '[Comment deleted]',
      });

      // Update parent comment replies count if it's a reply
      if (comment.parentCommentId) {
        const parentRef = doc(db, 'comments', comment.parentCommentId);
        batch.update(parentRef, {
          repliesCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }

      // Update post comments count
      const postRef = doc(db, 'posts', comment.postId);
      batch.update(postRef, {
        'stats.commentsCount': increment(-1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Pin/unpin a comment (post author only)
   */
  async togglePinComment(commentId: string, postAuthorId: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data();
      
      // Verify post ownership
      const postRef = doc(db, 'posts', comment.postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists() || postSnap.data()?.authorId !== postAuthorId) {
        throw new Error('Not authorized to pin comments on this post');
      }

      // Toggle pin status
      await updateDoc(commentRef, {
        isPinned: !comment.isPinned,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error toggling comment pin:', error);
      throw error;
    }
  }

  /**
   * Report a comment
   */
  async reportComment(commentId: string, reporterId: string): Promise<void> {
    try {
      const reportRef = doc(collection(db, 'reports'));
      
      await setDoc(reportRef, {
        reportId: reportRef.id,
        type: 'comment',
        contentId: commentId,
        reporterId,
        reason: 'inappropriate_content',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw error;
    }
  }

  /**
   * Get comment replies
   */
  async getCommentReplies(
    commentId: string,
    limitCount: number = 10,
    offset: number = 0
  ): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('parentCommentId', '==', commentId),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Comment[];
    } catch (error) {
      console.error('Error getting comment replies:', error);
      return [];
    }
  }

  /**
   * Get comment by ID
   */
  async getComment(commentId: string): Promise<Comment | null> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (commentSnap.exists()) {
        const data = commentSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Comment;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting comment:', error);
      return null;
    }
  }

  /**
   * Update comment text
   */
  async updateComment(commentId: string, userId: string, newText: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data();
      
      // Check if user owns the comment
      if (comment.authorId !== userId) {
        throw new Error('Not authorized to edit this comment');
      }

      await updateDoc(commentRef, {
        text: newText,
        isEdited: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Get comment statistics
   */
  async getCommentStats(postId: string): Promise<{
    totalComments: number;
    topLevelComments: number;
    replies: number;
  }> {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('postId', '==', postId),
        where('isDeleted', '!=', true)
      );

      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map(doc => doc.data());
      
      const topLevelComments = comments.filter(c => !c.parentCommentId).length;
      const replies = comments.filter(c => c.parentCommentId).length;

      return {
        totalComments: comments.length,
        topLevelComments,
        replies,
      };
    } catch (error) {
      console.error('Error getting comment stats:', error);
      return {
        totalComments: 0,
        topLevelComments: 0,
        replies: 0,
      };
    }
  }
}

export const commentService = new CommentService();
