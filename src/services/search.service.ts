import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User, Post } from '../types/database';
import { storageService, STORAGE_KEYS } from './storage.service';

export class SearchService {
  // ==========================================
  // USER SEARCH
  // ==========================================

  /**
   * Search users by username or display name
   */
  async searchUsers(
    searchTerm: string,
    limitCount = 20
  ): Promise<User[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const usersRef = collection(db, 'users');
    const searchLower = searchTerm.toLowerCase();

    // Search by username (prefix match)
    const usernameQuery = query(
      usersRef,
      where('username', '>=', searchLower),
      where('username', '<=', searchLower + '\uf8ff'),
      limit(limitCount)
    );

    const snapshot = await getDocs(usernameQuery);
    return snapshot.docs.map((doc) => doc.data() as User);
  }

  /**
   * Get suggested users for current user
   */
  async getSuggestedUsers(
    userId: string,
    limitCount = 10
  ): Promise<User[]> {
    const usersRef = collection(db, 'users');

    // Get random users (exclude current user and private accounts)
    const q = query(
      usersRef,
      where('userId', '!=', userId),
      where('isPrivate', '==', false),
      orderBy('userId'),
      orderBy('stats.followersCount', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as User);
  }

  // ==========================================
  // HASHTAG SEARCH
  // ==========================================

  /**
   * Search posts by hashtag
   */
  async searchHashtag(
    hashtag: string,
    limitCount = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
    if (!hashtag) {
      return { posts: [], lastDoc: null };
    }

    const postsRef = collection(db, 'posts');
    const cleanHashtag = hashtag.replace('#', '').toLowerCase();

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

    return {
      posts: snapshot.docs.map((doc) => doc.data() as Post),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limitCount = 10): Promise<Array<{
    tag: string;
    postCount: number;
  }>> {
    // This would typically be computed by a Cloud Function
    // For now, return most used hashtags from recent posts
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(100) // Sample recent posts
    );

    const snapshot = await getDocs(q);
    const hashtagCounts = new Map<string, number>();

    snapshot.docs.forEach((doc) => {
      const post = doc.data() as Post;
      post.tags?.forEach((tag) => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });
    });

    // Sort by count and return top N
    const sorted = Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount)
      .map(([tag, count]) => ({
        tag: `#${tag}`,
        postCount: count,
      }));

    return sorted;
  }

  // ==========================================
  // POST SEARCH
  // ==========================================

  /**
   * Search posts by caption or hashtags
   */
  async searchPosts(
    searchTerm: string,
    limitCount = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
    if (!searchTerm || searchTerm.length < 2) {
      return { posts: [], lastDoc: null };
    }

    const postsRef = collection(db, 'posts');
    
    // If search term starts with #, search hashtags
    if (searchTerm.startsWith('#')) {
      return this.searchHashtag(searchTerm, limitCount, lastDoc);
    }

    // Otherwise search by caption (limited - Firestore doesn't support full-text search)
    // In production, use Algolia or Elasticsearch for better search
    const searchLower = searchTerm.toLowerCase();
    let q = query(
      postsRef,
      where('caption', '>=', searchLower),
      where('caption', '<=', searchLower + '\uf8ff'),
      orderBy('caption'),
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
   * Get explore posts (trending/popular)
   */
  async getExplorePosts(
    limitCount = 30,
    mediaType?: 'image' | 'video'
  ): Promise<Post[]> {
    const postsRef = collection(db, 'posts');

    let q = query(
      postsRef,
      orderBy('engagement', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    // Filter by media type if specified
    if (mediaType) {
      q = query(
        postsRef,
        where('mediaType', '==', mediaType),
        orderBy('engagement', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Post);
  }

  // ==========================================
  // LOCATION SEARCH
  // ==========================================

  /**
   * Search posts by location
   */
  async searchLocation(
    location: string,
    limitCount = 20
  ): Promise<Post[]> {
    if (!location) {
      return [];
    }

    const postsRef = collection(db, 'posts');
    const locationLower = location.toLowerCase();

    const q = query(
      postsRef,
      where('location', '>=', locationLower),
      where('location', '<=', locationLower + '\uf8ff'),
      orderBy('location'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Post);
  }

  // ==========================================
  // RECENT SEARCHES
  // ==========================================

  /**
   * Save search to user's recent searches
   * Note: Stored in localStorage on frontend for now
   * Can be moved to Firestore if needed
   */
  saveRecentSearch(userId: string, searchTerm: string): void {
    const searches = this.getRecentSearches(userId);

    // Remove if already exists
    const filtered = searches.filter(s => s !== searchTerm);
    
    // Add to beginning
    filtered.unshift(searchTerm);

    // Keep only last 10
    const trimmed = filtered.slice(0, 10);

    // Save using storage service
    storageService.setUserData(
      STORAGE_KEYS.USER_SPECIFIC.RECENT_SEARCHES,
      userId,
      trimmed
    );
  }

  /**
   * Get recent searches for user
   */
  getRecentSearches(userId: string): string[] {
    const searches = storageService.getUserData<string[]>(
      STORAGE_KEYS.USER_SPECIFIC.RECENT_SEARCHES,
      userId
    );
    return searches || [];
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(userId: string): void {
    storageService.setUserData(
      STORAGE_KEYS.USER_SPECIFIC.RECENT_SEARCHES,
      userId,
      []
    );
  }
}

// Export singleton instance
export const searchService = new SearchService();
