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
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Post } from '../types/database';

export interface Collection {
  collectionId: string;
  userId: string;
  name: string;
  coverImageURL?: string;
  isPrivate: boolean;
  postsCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface SavedPost {
  postId: string;
  savedAt: any;
}

export class CollectionService {
  // ==========================================
  // COLLECTION CRUD
  // ==========================================

  /**
   * Get user's collections
   */
  async getUserCollections(userId: string): Promise<Collection[]> {
    const collectionsRef = collection(db, `users/${userId}/savedCollections`);
    const q = query(collectionsRef, orderBy('updatedAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Collection);
  }

  /**
   * Get collection by ID
   */
  async getCollection(
    userId: string,
    collectionId: string
  ): Promise<Collection | null> {
    const collectionRef = doc(
      db,
      `users/${userId}/savedCollections/${collectionId}`
    );
    const collectionSnap = await getDoc(collectionRef);

    if (!collectionSnap.exists()) {
      return null;
    }

    return collectionSnap.data() as Collection;
  }

  /**
   * Create new collection
   */
  async createCollection(
    userId: string,
    name: string,
    isPrivate = false
  ): Promise<string> {
    const collectionsRef = collection(db, `users/${userId}/savedCollections`);
    const collectionRef = doc(collectionsRef);
    const collectionId = collectionRef.id;

    await setDoc(collectionRef, {
      collectionId,
      userId,
      name,
      coverImageURL: '',
      isPrivate,
      postsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Collection);

    return collectionId;
  }

  /**
   * Update collection
   */
  async updateCollection(
    userId: string,
    collectionId: string,
    updates: { name?: string; isPrivate?: boolean; coverImageURL?: string }
  ): Promise<void> {
    const collectionRef = doc(
      db,
      `users/${userId}/savedCollections/${collectionId}`
    );

    await updateDoc(collectionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete collection
   */
  async deleteCollection(userId: string, collectionId: string): Promise<void> {
    const collectionRef = doc(
      db,
      `users/${userId}/savedCollections/${collectionId}`
    );

    // Delete all posts in collection first
    const postsRef = collection(
      db,
      `users/${userId}/savedCollections/${collectionId}/posts`
    );
    const postsSnapshot = await getDocs(postsRef);

    const batch = writeBatch(db);
    postsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete collection itself
    batch.delete(collectionRef);

    await batch.commit();
  }

  // ==========================================
  // SAVED POSTS
  // ==========================================

  /**
   * Save post to collection
   */
  async savePost(
    userId: string,
    postId: string,
    collectionId?: string
  ): Promise<void> {
    // If no collection specified, create/use default "All" collection
    if (!collectionId) {
      const collections = await this.getUserCollections(userId);
      let defaultCollection = collections.find((c) => c.name === 'All');

      if (!defaultCollection) {
        collectionId = await this.createCollection(userId, 'All', false);
      } else {
        collectionId = defaultCollection.collectionId;
      }
    }

    const savedPostRef = doc(
      db,
      `users/${userId}/savedCollections/${collectionId}/posts/${postId}`
    );

    // Check if already saved
    const savedPostSnap = await getDoc(savedPostRef);
    if (savedPostSnap.exists()) {
      return; // Already saved
    }

    const batch = writeBatch(db);

    // Add to collection
    batch.set(savedPostRef, {
      postId,
      savedAt: serverTimestamp(),
    } as SavedPost);

    // Increment post count in collection
    const collectionRef = doc(
      db,
      `users/${userId}/savedCollections/${collectionId}`
    );
    batch.update(collectionRef, {
      postsCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Increment saves count in post
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      'stats.savesCount': increment(1),
    });

    await batch.commit();
  }

  /**
   * Unsave post from collection
   */
  async unsavePost(
    userId: string,
    postId: string,
    collectionId: string
  ): Promise<void> {
    const savedPostRef = doc(
      db,
      `users/${userId}/savedCollections/${collectionId}/posts/${postId}`
    );

    const batch = writeBatch(db);

    // Remove from collection
    batch.delete(savedPostRef);

    // Decrement post count in collection
    const collectionRef = doc(
      db,
      `users/${userId}/savedCollections/${collectionId}`
    );
    batch.update(collectionRef, {
      postsCount: increment(-1),
      updatedAt: serverTimestamp(),
    });

    // Decrement saves count in post
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      'stats.savesCount': increment(-1),
    });

    await batch.commit();
  }

  /**
   * Remove post from collection
   */
  async removePostFromCollection(
    userId: string,
    collectionId: string,
    postId: string
  ): Promise<void> {
    const collectionRef = doc(
      db,
      `users/${userId}/savedCollections/${collectionId}`
    );
    const collectionSnap = await getDoc(collectionRef);
    
    if (!collectionSnap.exists()) return;
    
    const currentCount = collectionSnap.data()?.postsCount || 0;
    
    // Only proceed if count > 0
    if (currentCount > 0) {
      const batch = writeBatch(db);

      // Remove post from collection
      const postRefInCollection = doc(
        db,
        `users/${userId}/savedCollections/${collectionId}/posts`,
        postId
      );
      batch.delete(postRefInCollection);

      // Decrement collection's post count
      batch.update(collectionRef, {
        postsCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      // Decrement saves count in post
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, {
        'stats.savesCount': increment(-1),
      });

      await batch.commit();
    }
  }

  /**
   * Get posts in collection
   */
  async getCollectionPosts(
    userId: string,
    collectionId: string,
    limitCount = 30
  ): Promise<Post[]> {
    const postsRef = collection(
      db,
      `users/${userId}/savedCollections/${collectionId}/posts`
    );
    const q = query(postsRef, orderBy('savedAt', 'desc'), limit(limitCount));

    const snapshot = await getDocs(q);
    const postIds = snapshot.docs.map((doc) => doc.data().postId);

    // Fetch actual post documents
    const posts: Post[] = [];
    for (const postId of postIds) {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        posts.push(postSnap.data() as Post);
      }
    }

    return posts;
  }

  /**
   * Get all saved posts (across all collections)
   */
  async getAllSavedPosts(userId: string, limitCount = 50): Promise<Post[]> {
    const collections = await this.getUserCollections(userId);

    const allPosts: Post[] = [];
    const seenPostIds = new Set<string>();

    for (const collection of collections) {
      const posts = await this.getCollectionPosts(
        userId,
        collection.collectionId,
        limitCount
      );

      posts.forEach((post) => {
        if (!seenPostIds.has(post.postId)) {
          seenPostIds.add(post.postId);
          allPosts.push(post);
        }
      });
    }

    // Sort by saved date (most recent first)
    return allPosts;
  }

  /**
   * Check if post is saved
   */
  async isPostSaved(
    userId: string,
    postId: string,
    collectionId?: string
  ): Promise<boolean> {
    if (collectionId) {
      const savedPostRef = doc(
        db,
        `users/${userId}/savedCollections/${collectionId}/posts/${postId}`
      );
      const savedPostSnap = await getDoc(savedPostRef);
      return savedPostSnap.exists();
    }

    // Check all collections
    const collections = await this.getUserCollections(userId);
    for (const collection of collections) {
      const savedPostRef = doc(
        db,
        `users/${userId}/savedCollections/${collection.collectionId}/posts/${postId}`
      );
      const savedPostSnap = await getDoc(savedPostRef);
      if (savedPostSnap.exists()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Move post between collections
   */
  async movePost(
    userId: string,
    postId: string,
    fromCollectionId: string,
    toCollectionId: string
  ): Promise<void> {
    // Remove from old collection
    await this.unsavePost(userId, postId, fromCollectionId);

    // Add to new collection
    await this.savePost(userId, postId, toCollectionId);
  }
}

// Export singleton instance
export const collectionService = new CollectionService();
