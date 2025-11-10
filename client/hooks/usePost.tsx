import { useState, useEffect } from 'react';
import { postService } from '../../src/services/post.service';
import { cacheService } from '../../src/services/cache.service';
import type { Post } from '../../src/types/database';
import { useAuth } from '../contexts/AuthContext';

export const usePost = (postId: string) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        const data = await cacheService.getPost(
          postId,
          () => postService.getPost(postId)
        );
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  return { post, loading, error };
};

export const useFeed = (page: number = 1) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const userId = user?.userId;

  useEffect(() => {
    if (!userId) return;

    const loadFeed = async () => {
      try {
        // Only show loading on initial load (page 1)
        if (page === 1) {
          setLoading(true);
        }
        
        // Get following list
        const { userService } = await import('../../src/services/user.service');
        const { glimpseService } = await import('../../src/services/glimpse.service');
        const followingIds = await cacheService.getFollowingList(
          userId,
          () => userService.getFollowing(userId)
        );
        
        console.log('📊 Feed Debug:', {
          userId,
          followingCount: followingIds.length,
          followingIds: followingIds.slice(0, 5),
        });
        
        // Get feed posts (excluding own posts)
        const feedData = await cacheService.getFeedPosts(
          userId,
          page,
          async () => {
            const result = await postService.getFeedPosts(followingIds, userId, 20);
            return result;
          }
        );

        const feedPosts = (feedData as any).posts || [];
        
        // Get glimpses from following users (excluding own glimpses)
        const glimpses = await glimpseService.getFollowingGlimpses(followingIds, userId, 20);
        
        console.log('📊 Feed Content:', {
          posts: feedPosts.length,
          glimpses: glimpses.length,
          total: feedPosts.length + glimpses.length
        });
        
        // Convert glimpses to post-like format for unified display
        // Filter out glimpses with invalid media URLs
        const glimpsesAsPosts = glimpses
          .filter((glimpse: any) => {
            // Only include glimpses with valid media URLs
            return glimpse.mediaURL && glimpse.mediaURL.trim() !== '';
          })
          .map((glimpse: any) => ({
            ...glimpse,
            postId: glimpse.glimpseId,
            postType: 'glimpse', // Mark as glimpse for special rendering
            mediaURLs: [glimpse.mediaURL], // Ensure media URL is array
          mediaType: glimpse.mediaType, // Pass video/image type
          caption: glimpse.caption,
          createdAt: glimpse.createdAt,
          authorId: glimpse.authorId,
          authorUsername: glimpse.authorUsername,
          authorAvatarURL: glimpse.authorAvatarURL, // Use correct field
          authorVerified: glimpse.authorVerified,
          backgroundMusic: glimpse.backgroundMusic, // Pass audio data
          stats: glimpse.stats || {
            likesCount: 0,
            commentsCount: 0,
            savesCount: 0,
            sharesCount: 0,
            viewsCount: 0,
          }
        }));
        
        // Mix posts and glimpses together, sort by createdAt
        const mixedContent = [...feedPosts, ...glimpsesAsPosts].sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
        
        // Append content instead of replacing (only if page > 1)
        if (page === 1) {
          setPosts(mixedContent);
        } else {
          setPosts(prev => {
            // Deduplicate by postId
            const existingIds = new Set(prev.map(p => p.postId));
            const uniqueNew = mixedContent.filter((p: Post) => !existingIds.has(p.postId));
            return [...prev, ...uniqueNew];
          });
        }
        
        setHasMore(!!(feedData as any).lastDoc || glimpses.length >= 20);
      } catch (err: any) {
        console.error('Failed to load feed:', err);
        setError(err.message);
      } finally {
        if (page === 1) {
          setLoading(false);
        }
      }
    };

    loadFeed();
  }, [userId, page]);

  return { posts, loading, error, hasMore };
};

export const usePostActions = () => {
  const { user } = useAuth();
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const likePost = async (postId: string) => {
    if (!user) throw new Error('Not authenticated');
    
    setLiking(true);
    try {
      await postService.likePost(postId, user.userId);
      cacheService.invalidatePost(postId);
    } catch (error) {
      throw error;
    } finally {
      setLiking(false);
    }
  };

  const unlikePost = async (postId: string) => {
    if (!user) throw new Error('Not authenticated');
    
    setLiking(true);
    try {
      await postService.unlikePost(postId, user.userId);
      cacheService.invalidatePost(postId);
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    } finally {
      setLiking(false);
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!user) throw new Error('Not authenticated');
    
    setCommenting(true);
    try {
      await postService.addComment(
        postId,
        user.userId,
        user.username,
        user.avatarURL || '',
        text
      );
      cacheService.invalidatePost(postId);
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    } finally {
      setCommenting(false);
    }
  };

  const savePost = async (postId: string) => {
    if (!user) throw new Error('Not authenticated');
    await postService.savePost(postId, user.userId);
  };

  const unsavePost = async (postId: string) => {
    if (!user) throw new Error('Not authenticated');
    await postService.unsavePost(postId, user.userId);
  };

  return {
    likePost,
    unlikePost,
    addComment,
    savePost,
    unsavePost,
    liking,
    commenting,
  };
};

export const useComments = (postId: string, collectionType: 'posts' | 'glimpses' = 'posts') => {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const loadComments = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loading comments for:', { postId, collectionType });
        
        // Import Firestore functions
        const { collection: firestoreCollection, query, orderBy: firestoreOrderBy, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../src/config/firebase');
        
        // Query comments from the appropriate collection
        const commentsRef = firestoreCollection(db, collectionType, postId, 'comments');
        console.log('📍 Querying path:', `${collectionType}/${postId}/comments`);
        const q = query(commentsRef, firestoreOrderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        console.log('✅ Found comments:', snapshot.size);
        
        const commentsData = snapshot.docs.map(doc => ({
          commentId: doc.id,
          ...doc.data(),
          isLiked: false, // TODO: Check if user liked
        }));
        
        console.log('💬 Comments data:', commentsData);
        setComments(commentsData);
      } catch (error) {
        console.error('❌ Failed to load comments:', error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [postId, collectionType]);

  const addComment = async (text: string, parentCommentId?: string) => {
    if (!user) throw new Error('Not authenticated');
    
    // Import Firestore functions
    const { collection: firestoreCollection, doc: firestoreDoc, setDoc, serverTimestamp, increment: firestoreIncrement, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../../src/config/firebase');
    
    // Create comment in the appropriate collection
    const commentRef = firestoreDoc(firestoreCollection(db, collectionType, postId, 'comments'));
    const commentId = commentRef.id;
    
    const commentData: any = {
      commentId,
      authorId: user.userId,
      authorUsername: user.username,
      authorAvatarURL: user.avatarURL || '',
      text,
      createdAt: serverTimestamp(),
      likesCount: 0,
    };
    
    // Add parentCommentId if this is a reply
    if (parentCommentId) {
      commentData.parentCommentId = parentCommentId;
    }
    
    await setDoc(commentRef, commentData);
    
    // Update comment count
    const parentRef = firestoreDoc(db, collectionType, postId);
    await updateDoc(parentRef, {
      commentsCount: firestoreIncrement(1),
      repliesCount: firestoreIncrement(1), // For glimpses
    });
    
    // Reload comments
    const commentsRef = firestoreCollection(db, collectionType, postId, 'comments');
    const { query, orderBy: firestoreOrderBy, getDocs } = await import('firebase/firestore');
    const q = query(commentsRef, firestoreOrderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const commentsData = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      // Fetch user verification status
      let isVerified = false;
      try {
        const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
        const userRef = firestoreDoc(db, 'users', data.authorId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          isVerified = userSnap.data().isVerified || false;
        }
      } catch (err) {
        console.error('Failed to fetch user verification:', err);
      }
      
      return {
        commentId: doc.id,
        ...data,
        isLiked: false,
        isVerified,
      };
    }));
    
    setComments(commentsData);
  };

  const likeComment = async (commentId: string, glimpseAuthorId?: string) => {
    if (!user) throw new Error('Not authenticated');
    
    const { doc: firestoreDoc, setDoc, serverTimestamp, increment: firestoreIncrement, writeBatch } = await import('firebase/firestore');
    const { db } = await import('../../src/config/firebase');
    
    // Check if this is the glimpse/post author liking
    const isCreatorLike = glimpseAuthorId && user.userId === glimpseAuthorId;
    
    const batch = writeBatch(db);
    
    // Add like document
    const likeRef = firestoreDoc(db, collectionType, postId, 'comments', commentId, 'likes', user.userId);
    batch.set(likeRef, {
      userId: user.userId,
      likedAt: serverTimestamp(),
    });
    
    // Update like count and likedByCreator flag
    const commentRef = firestoreDoc(db, collectionType, postId, 'comments', commentId);
    const updateData: any = {
      likesCount: firestoreIncrement(1),
      updatedAt: serverTimestamp(),
    };
    if (isCreatorLike) {
      updateData.likedByCreator = true;
    }
    batch.update(commentRef, updateData);
    
    await batch.commit();
    
    // Update local state with creator flag if applicable
    setComments(comments.map(c => 
      c.commentId === commentId 
        ? { 
            ...c, 
            likesCount: c.likesCount + 1, 
            isLiked: true,
            likedByCreator: isCreatorLike ? true : c.likedByCreator
          }
        : c
    ));
  };

  const unlikeComment = async (commentId: string, glimpseAuthorId?: string) => {
    if (!user) throw new Error('Not authenticated');
    
    const { doc: firestoreDoc, deleteDoc, increment: firestoreIncrement, writeBatch, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../../src/config/firebase');
    
    // Check if this is the creator unliking
    const isCreatorUnlike = glimpseAuthorId && user.userId === glimpseAuthorId;
    
    const batch = writeBatch(db);
    
    // Remove like document
    const likeRef = firestoreDoc(db, collectionType, postId, 'comments', commentId, 'likes', user.userId);
    batch.delete(likeRef);
    
    // Update like count
    const commentRef = firestoreDoc(db, collectionType, postId, 'comments', commentId);
    batch.update(commentRef, {
      likesCount: firestoreIncrement(-1),
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
    
    // Update local state (force new array reference for re-render)
    setComments([...comments.map(c => 
      c.commentId === commentId 
        ? { ...c, likesCount: Math.max(0, c.likesCount - 1), isLiked: false }
        : c
    )]);
  };

  const deleteComment = async (commentId: string) => {
    if (!user) throw new Error('Not authenticated');
    
    const { doc: firestoreDoc, deleteDoc, updateDoc, increment: firestoreIncrement } = await import('firebase/firestore');
    const { db } = await import('../../src/config/firebase');
    
    // Delete comment document
    const commentRef = firestoreDoc(db, collectionType, postId, 'comments', commentId);
    await deleteDoc(commentRef);
    
    // Decrement comment count
    const parentRef = firestoreDoc(db, collectionType, postId);
    await updateDoc(parentRef, {
      commentsCount: firestoreIncrement(-1),
      repliesCount: firestoreIncrement(-1),
    });
    
    // Update local state
    setComments(comments.filter(c => c.commentId !== commentId));
  };

  return {
    comments,
    loading,
    addComment,
    likeComment,
    unlikeComment,
    deleteComment,
  };
};
