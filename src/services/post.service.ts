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
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Post, CreatePostData, Comment, Like } from '../types/database';
import { storageService, STORAGE_KEYS } from './storage.service';

export class PostService {
  // ==========================================
  // POST CRUD OPERATIONS
  // ==========================================

  /**
   * Create a new post
   */
  async createPost(postData: CreatePostData): Promise<string> {
    const postRef = doc(collection(db, 'posts'));
    const postId = postRef.id;

    await setDoc(postRef, {
      postId,
      ...postData,
      tags: postData.tags || [],
      mentions: postData.mentions || [],
      taggedUsers: postData.taggedUsers || [],
      altText: postData.altText || '',
      stats: {
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        sharesCount: 0,
        viewsCount: 0,
      },
      commentsEnabled: true,
      hideLikesCount: false,
      engagement: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastEngagementAt: serverTimestamp(),
    });

    // Update user's post count
    const userRef = doc(db, 'users', postData.authorId);
    await updateDoc(userRef, {
      'stats.postsCount': increment(1),
    });

    return postId;
  }

  /**
   * Get post by ID
   */
  async getPost(postId: string): Promise<Post | null> {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return null;
    }

    const postData = postSnap.data() as Post;
    
    // Enrich with author verified status
    if (postData.authorVerified === undefined) {
      try {
        const authorRef = doc(db, 'users', postData.authorId);
        const authorSnap = await getDoc(authorRef);
        if (authorSnap.exists()) {
          postData.authorVerified = authorSnap.data().verified || false;
        }
      } catch (error) {
        postData.authorVerified = false;
      }
    }

    return postData;
  }

  /**
   * Update post
   */
  async updatePost(postId: string, updates: Partial<Post>): Promise<void> {
    const postRef = doc(db, 'posts', postId);

    await updateDoc(postRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete post
   */
  async deletePost(postId: string, authorId: string): Promise<void> {
    // Get post data first to access media URLs
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }

    const postData = postSnap.data() as Post;

    // Delete media from Supabase if exists
    if (postData.mediaURLs && postData.mediaURLs.length > 0) {
      const { supabase } = await import('../config/supabase');
      
      for (const mediaURL of postData.mediaURLs) {
        try {
          // Extract file path from URL
          const urlParts = mediaURL.split('/storage/v1/object/public/posts/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage.from('posts').remove([filePath]);
          }
        } catch (error) {
          console.error('Failed to delete media from Supabase:', error);
          // Continue with Firestore deletion even if storage deletion fails
        }
      }
    }

    const batch = writeBatch(db);

    // Delete post document
    batch.delete(postRef);

    // Update user's post count
    const userRef = doc(db, 'users', authorId);
    batch.update(userRef, {
      'stats.postsCount': increment(-1),
    });

    await batch.commit();
  }

  /**
   * Get user's posts (paginated)
   */
  async getUserPosts(
    userId: string,
    limitCount = 12,
    lastDoc?: DocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
    const postsRef = collection(db, 'posts');
    let q = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    // Enrich posts with author verified status
    const posts = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const postData = docSnap.data() as Post;
        
        if (postData.authorVerified === undefined) {
          try {
            const authorRef = doc(db, 'users', postData.authorId);
            const authorSnap = await getDoc(authorRef);
            if (authorSnap.exists()) {
              postData.authorVerified = authorSnap.data().verified || false;
            }
          } catch (error) {
            postData.authorVerified = false;
          }
        }
        
        return postData;
      })
    );

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  /**
   * Get posts by hashtag
   */
  async getPostsByHashtag(
    tag: string,
    limitCount = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
    const postsRef = collection(db, 'posts');
    const cleanHashtag = tag.replace(/^#/, '');

    let q = query(
      postsRef,
      where('tags', 'array-contains', cleanHashtag),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    // Enrich posts with author verified status
    const posts = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const postData = docSnap.data() as Post;
        
        if (postData.authorVerified === undefined) {
          try {
            const authorRef = doc(db, 'users', postData.authorId);
            const authorSnap = await getDoc(authorRef);
            if (authorSnap.exists()) {
              postData.authorVerified = authorSnap.data().verified || false;
            }
          } catch (error) {
            postData.authorVerified = false;
          }
        }
        
        return postData;
      })
    );

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  /**
   * Get feed posts (from following list, excluding current user)
   * With smart caching for fast load
   */
  async getFeedPosts(
    followingIds: string[],
    currentUserId: string,
    limitCount = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
    // Only cache first page (no lastDoc)
    const shouldCache = !lastDoc;
    
    // Try cache first (only for first page)
    if (shouldCache) {
      const cached = storageService.getCachedData<Post[]>(
        STORAGE_KEYS.USER_SPECIFIC.CACHED_FEED,
        currentUserId
      );
      
      if (cached && cached.length > 0) {
        console.log('⚡ Feed loaded from cache:', cached.length, 'posts');
        
        // Return cached immediately
        const result = { posts: cached, lastDoc: null };
        
        // Background refresh
        this.refreshFeedInBackground(followingIds, currentUserId, limitCount);
        
        return result;
      }
    }
    
    // Filter out current user from following list
    const followingOnly = followingIds.filter(id => id !== currentUserId);
    
    // Firestore 'in' operator supports max 10 values
    const chunk = followingOnly.slice(0, 10);

    if (chunk.length === 0) {
      return { posts: [], lastDoc: null };
    }

    const postsRef = collection(db, 'posts');
    let q = query(
      postsRef,
      where('authorId', 'in', chunk),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    // Enrich posts with author verified status
    const posts = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const postData = docSnap.data() as Post;
        
        // Fetch author's verified status if not already in post
        if (postData.authorVerified === undefined) {
          try {
            const authorRef = doc(db, 'users', postData.authorId);
            const authorSnap = await getDoc(authorRef);
            if (authorSnap.exists()) {
              postData.authorVerified = authorSnap.data().verified || false;
            }
          } catch (error) {
            console.error('Failed to fetch author verified status:', error);
            postData.authorVerified = false;
          }
        }
        
        return postData;
      })
    );

    // Save to cache (only first page, 30 min TTL)
    if (shouldCache && posts.length > 0) {
      storageService.setCachedData(
        STORAGE_KEYS.USER_SPECIFIC.CACHED_FEED,
        currentUserId,
        posts,
        30 // 30 minutes
      );
      console.log('💾 Feed cached:', posts.length, 'posts');
    }

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  /**
   * Background refresh feed (don't wait for it)
   */
  private async refreshFeedInBackground(
    followingIds: string[],
    currentUserId: string,
    limitCount: number
  ): Promise<void> {
    try {
      console.log('🔄 Background refresh started...');
      
      // Fetch fresh data (without using cache)
      const followingOnly = followingIds.filter(id => id !== currentUserId);
      const chunk = followingOnly.slice(0, 10);

      if (chunk.length === 0) return;

      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('authorId', 'in', chunk),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      
      const posts = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const postData = docSnap.data() as Post;
          
          if (postData.authorVerified === undefined) {
            try {
              const authorRef = doc(db, 'users', postData.authorId);
              const authorSnap = await getDoc(authorRef);
              if (authorSnap.exists()) {
                postData.authorVerified = authorSnap.data().verified || false;
              }
            } catch (error) {
              postData.authorVerified = false;
            }
          }
          
          return postData;
        })
      );

      // Update cache with fresh data
      if (posts.length > 0) {
        storageService.setCachedData(
          STORAGE_KEYS.USER_SPECIFIC.CACHED_FEED,
          currentUserId,
          posts,
          30
        );
        console.log('✅ Background refresh complete:', posts.length, 'posts');
      }
    } catch (error) {
      console.error('⚠️ Background refresh failed:', error);
    }
  }

  /**
   * Get posts where user is mentioned/tagged
   */
  async getPostsByMention(
    username: string,
    limitCount = 12,
    lastDoc?: DocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
    if (!username) {
      return { posts: [], lastDoc: null };
    }

    const postsRef = collection(db, 'posts');
    let q = query(
      postsRef,
      where('mentions', 'array-contains', username),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    return {
      posts: snapshot.docs.map((doc) => doc.data() as Post),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  /**
   * Increment post view count
   */
  async incrementViewCount(postId: string): Promise<void> {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      'stats.viewsCount': increment(1),
      engagement: increment(1),
      lastEngagementAt: serverTimestamp(),
    });
  }

  // ==========================================
  // LIKE OPERATIONS
  // ==========================================

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);

    // Add like
    const likeRef = doc(db, `posts/${postId}/likes/${userId}`);
    batch.set(likeRef, {
      userId,
      likedAt: serverTimestamp(),
    } as Like);

    // Update post stats
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      'stats.likesCount': increment(1),
      engagement: increment(1),
      lastEngagementAt: serverTimestamp(),
    });

    await batch.commit();

    // Send notification to post owner (fire and forget)
    this.notifyPostLike(postId, userId);
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
    // Check current count before decrementing
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) return;
    
    const currentLikes = postSnap.data()?.stats?.likesCount || 0;
    
    // Only unlike if count > 0
    if (currentLikes > 0) {
      const batch = writeBatch(db);

      // Remove from likes
      const likeRef = doc(db, `posts/${postId}/likes/${userId}`);
      batch.delete(likeRef);

      // Update post stats
      batch.update(postRef, {
        'stats.likesCount': increment(-1),
        engagement: increment(-1),
        lastEngagementAt: serverTimestamp(),
      });

      await batch.commit();
    }
  }

  /**
   * Check if user liked post
   */
  async hasLiked(postId: string, userId: string): Promise<boolean> {
    const likeRef = doc(db, `posts/${postId}/likes/${userId}`);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
  }

  /**
   * Get list of post IDs that user has liked from given array
   */
  async getUserLikedPosts(userId: string, postIds: string[]): Promise<string[]> {
    if (!postIds.length) return [];
    
    const likedPostIds: string[] = [];
    
    // Check each post in batches to avoid too many requests
    const batchSize = 10;
    for (let i = 0; i < postIds.length; i += batchSize) {
      const batch = postIds.slice(i, i + batchSize);
      const checks = await Promise.all(
        batch.map(async (postId) => {
          const likeRef = doc(db, `posts/${postId}/likes/${userId}`);
          const likeSnap = await getDoc(likeRef);
          return likeSnap.exists() ? postId : null;
        })
      );
      
      likedPostIds.push(...checks.filter((id): id is string => id !== null));
    }
    
    return likedPostIds;
  }

  // ==========================================
  // SAVE OPERATIONS
  // ==========================================

  /**
   * Save a post
   */
  async savePost(postId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);

    // Add to saves subcollection
    const saveRef = doc(db, `posts/${postId}/saves/${userId}`);
    batch.set(saveRef, {
      userId,
      savedAt: serverTimestamp(),
    });

    // Update post stats
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      'stats.savesCount': increment(1),
    });

    await batch.commit();
  }

  /**
   * Unsave a post
   */
  async unsavePost(postId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);

    // Remove from saves
    const saveRef = doc(db, `posts/${postId}/saves/${userId}`);
    batch.delete(saveRef);

    // Update post stats
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      'stats.savesCount': increment(-1),
    });

    await batch.commit();
  }

  /**
   * Check if user saved post
   */
  async hasSaved(postId: string, userId: string): Promise<boolean> {
    const saveRef = doc(db, `posts/${postId}/saves/${userId}`);
    const saveSnap = await getDoc(saveRef);
    return saveSnap.exists();
  }

  // ==========================================
  // COMMENT OPERATIONS
  // ==========================================

  /**
   * Add comment to post
   */
  async addComment(
    postId: string,
    authorId: string,
    authorUsername: string,
    authorAvatarURL: string,
    text: string,
    parentCommentId?: string,
    mentions: string[] = []
  ): Promise<string> {
    const batch = writeBatch(db);

    // Create comment
    const commentRef = doc(collection(db, `posts/${postId}/comments`));
    const commentId = commentRef.id;

    batch.set(commentRef, {
      commentId,
      postId,
      authorId,
      authorUsername,
      authorAvatarURL,
      text,
      parentCommentId: parentCommentId || null,
      mentions,
      likesCount: 0,
      repliesCount: 0,
      isPinned: false,
      isEdited: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Comment);

    // If this is a reply, increment parent comment's repliesCount
    if (parentCommentId) {
      const parentCommentRef = doc(db, `posts/${postId}/comments/${parentCommentId}`);
      batch.update(parentCommentRef, {
        repliesCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    // Update post stats
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      'stats.commentsCount': increment(1),
      engagement: increment(1),
      lastEngagementAt: serverTimestamp(),
    });

    await batch.commit();

    // Send notification to post owner (fire and forget)
    this.notifyPostComment(postId, authorId, authorUsername, authorAvatarURL, text);

    return commentId;
  }

  /**
   * Get post comments (paginated)
   */
  async getComments(
    postId: string,
    limitCount = 50,
    lastDoc?: DocumentSnapshot
  ): Promise<{ comments: Comment[]; lastDoc: DocumentSnapshot | null }> {
    const commentsRef = collection(db, `posts/${postId}/comments`);
    let q = query(
      commentsRef,
      where('parentCommentId', '==', null),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map((doc) => doc.data() as Comment);

    // Sort by creation date
    const sortedComments = comments.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime; // Most recent first
    });

    return {
      comments: sortedComments,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  /**
   * Delete comment
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    const batch = writeBatch(db);

    // Delete comment
    const commentRef = doc(db, `posts/${postId}/comments/${commentId}`);
    batch.delete(commentRef);

    // Update post stats
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      'stats.commentsCount': increment(-1),
      engagement: increment(-1),
    });

    await batch.commit();
  }

  /**
   * Like a comment
   */
  async likeComment(postId: string, commentId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);

    // Add like
    const likeRef = doc(db, `posts/${postId}/comments/${commentId}/likes/${userId}`);
    batch.set(likeRef, {
      userId,
      likedAt: serverTimestamp(),
    });

    // Update comment likes count
    const commentRef = doc(db, `posts/${postId}/comments/${commentId}`);
    batch.update(commentRef, {
      likesCount: increment(1),
    });

    await batch.commit();
  }

  /**
   * Unlike a comment
   */
  async unlikeComment(postId: string, commentId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);

    // Remove like
    const likeRef = doc(db, `posts/${postId}/comments/${commentId}/likes/${userId}`);
    batch.delete(likeRef);

    // Update comment likes count
    const commentRef = doc(db, `posts/${postId}/comments/${commentId}`);
    batch.update(commentRef, {
      likesCount: increment(-1),
    });

    await batch.commit();
  }

  // ==========================================
  // SEARCH & DISCOVER
  // ==========================================

  /**
   * Search posts by hashtag
   */
  async searchByHashtag(
    tag: string,
    limitCount = 20
  ): Promise<Post[]> {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('tags', 'array-contains', tag),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Post);
  }

  // ==========================================
  // NOTIFICATION HELPERS (Private)
  // ==========================================

  /**
   * Send like notification (async, non-blocking)
   */
  private async notifyPostLike(postId: string, userId: string): Promise<void> {
    try {
      const post = await this.getPost(postId);
      if (!post || post.authorId === userId) return;

      const { userService } = await import('./user.service');
      const liker = await userService.getUser(userId);
      if (!liker) return;

      const { notificationService } = await import('./notification.service');
      await notificationService.notifyLike(
        post.authorId,
        userId,
        liker.username,
        liker.avatarURL || '',
        postId,
        post.mediaURLs[0]
      );
    } catch (error) {
      console.error('Like notification failed:', error);
    }
  }

  /**
   * Send comment notification (async, non-blocking)
   */
  private async notifyPostComment(
    postId: string,
    authorId: string,
    authorUsername: string,
    authorAvatarURL: string,
    text: string
  ): Promise<void> {
    try {
      const post = await this.getPost(postId);
      if (!post || post.authorId === authorId) return;

      const { notificationService } = await import('./notification.service');
      await notificationService.notifyComment(
        post.authorId,
        authorId,
        authorUsername,
        authorAvatarURL,
        postId,
        text,
        post.mediaURLs[0]
      );
    } catch (error) {
      console.error('Comment notification failed:', error);
    }
  }

  /**
   * Get trending posts (by engagement)
   */
  async getTrendingPosts(limitCount = 20): Promise<Post[]> {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('engagement', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    // Enrich posts with author verified status
    const posts = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const postData = docSnap.data() as Post;
        
        if (postData.authorVerified === undefined) {
          try {
            const authorRef = doc(db, 'users', postData.authorId);
            const authorSnap = await getDoc(authorRef);
            if (authorSnap.exists()) {
              postData.authorVerified = authorSnap.data().verified || false;
            }
          } catch (error) {
            postData.authorVerified = false;
          }
        }
        
        return postData;
      })
    );
    
    return posts;
  }

  // ==========================================
  // COLLABORATION OPERATIONS
  // ==========================================

  /**
   * Request collaboration on a post
   */
  async requestCollaboration(
    postId: string,
    userId: string,
    username: string,
    avatarURL: string,
    message?: string
  ): Promise<string> {
    const collabRef = doc(collection(db, `posts/${postId}/collaborationRequests`));
    const collabId = collabRef.id;

    await setDoc(collabRef, {
      requestId: collabId,
      postId,
      userId,
      username,
      avatarURL,
      message: message || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    return collabId;
  }

  /**
   * Accept collaboration request
   */
  async acceptCollaboration(postId: string, requestId: string, collaboratorId: string): Promise<void> {
    const batch = writeBatch(db);

    const requestRef = doc(db, `posts/${postId}/collaborationRequests/${requestId}`);
    batch.update(requestRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });

    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    const post = postSnap.data() as Post;
    const collaborators = (post as any).collaborators || [];
    
    if (!collaborators.includes(collaboratorId)) {
      batch.update(postRef, {
        collaborators: [...collaborators, collaboratorId],
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  }

  /**
   * Reject collaboration request
   */
  async rejectCollaboration(postId: string, requestId: string): Promise<void> {
    const requestRef = doc(db, `posts/${postId}/collaborationRequests/${requestId}`);
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
    });
  }

  /**
   * Get collaboration requests for a post
   */
  async getCollaborationRequests(postId: string): Promise<any[]> {
    const requestsRef = collection(db, `posts/${postId}/collaborationRequests`);
    const q = query(requestsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Remove collaborator from post
   */
  async removeCollaborator(postId: string, collaboratorId: string): Promise<void> {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    const post = postSnap.data() as Post;
    const collaborators = (post as any).collaborators || [];

    await updateDoc(postRef, {
      collaborators: collaborators.filter((id: string) => id !== collaboratorId),
      updatedAt: serverTimestamp(),
    });
  }

  // ==========================================
  // COMMENT MANAGEMENT
  // ==========================================

  /**
   * Pin a comment (only post owner can pin)
   */
  async pinComment(postId: string, commentId: string): Promise<void> {
    const commentRef = doc(db, `posts/${postId}/comments/${commentId}`);
    await updateDoc(commentRef, {
      isPinned: true,
      pinnedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Unpin a comment
   */
  async unpinComment(postId: string, commentId: string): Promise<void> {
    const commentRef = doc(db, `posts/${postId}/comments/${commentId}`);
    await updateDoc(commentRef, {
      isPinned: false,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Report a comment
   */
  async reportComment(
    postId: string,
    commentId: string,
    reporterId: string,
    reason: string
  ): Promise<void> {
    const reportRef = doc(collection(db, 'reports'));
    await setDoc(reportRef, {
      reportId: reportRef.id,
      reporterId,
      targetType: 'comment',
      targetId: commentId,
      postId,
      reason,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Report a post
   */
  async reportPost(
    postId: string,
    reporterId: string,
    reason: string
  ): Promise<void> {
    const reportRef = doc(collection(db, 'reports'));
    await setDoc(reportRef, {
      reportId: reportRef.id,
      reporterId,
      targetType: 'post',
      targetId: postId,
      reason,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }

  // ==========================================
  // LIKES MANAGEMENT
  // ==========================================

  /**
   * Get users who liked a post
   */
  async getPostLikes(postId: string, limitCount = 50): Promise<any[]> {
    const likesRef = collection(db, `posts/${postId}/likes`);
    const q = query(likesRef, orderBy('likedAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    const userIds = snapshot.docs.map(doc => doc.id);
    if (userIds.length === 0) return [];

    // Get user details for each like
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          return {
            userId,
            username: userData.username,
            displayName: userData.displayName,
            avatarURL: userData.avatarURL || '',
          };
        }
        return null;
      })
    );

    return users.filter(u => u !== null);
  }

  /**
   * Get users who liked a comment
   */
  async getCommentLikes(postId: string, commentId: string): Promise<any[]> {
    const likesRef = collection(db, `posts/${postId}/comments/${commentId}/likes`);
    const snapshot = await getDocs(likesRef);

    const userIds = snapshot.docs.map(doc => doc.id);
    if (userIds.length === 0) return [];

    // Get user details
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          return {
            userId,
            username: userData.username,
            displayName: userData.displayName,
            avatarURL: userData.avatarURL || '',
          };
        }
        return null;
      })
    );

    return users.filter(u => u !== null);
  }

  /**
   * Get posts where a user is tagged
   */
  async getPostsByTaggedUser(
    userId: string,
    limitCount = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
    const postsRef = collection(db, 'posts');
    let q = query(
      postsRef,
      where('taggedUsers', 'array-contains-any', [
        { userId },
        { userId, username: '' }, // Match any object with this userId
      ]),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const posts = snapshot.docs
      .map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
      } as Post))
      .filter((post) => 
        post.taggedUsers?.some((tag) => tag.userId === userId)
      );

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }
}

// Export singleton instance
export const postService = new PostService();
