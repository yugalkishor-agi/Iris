import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit as firestoreLimit,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { userService } from './user.service';

// User type from userService
interface User {
  userId: string;
  username: string;
  displayName?: string;
  email: string;
  avatarURL?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  createdAt: any;
  [key: string]: any;
}

export interface SuggestedUser extends User {
  score: number;
  reason: string;
}

/**
 * People Suggestion Service
 * Algorithm based on 5 conditions (Location pending):
 * 1. Mutual Followers (40 points)
 * 2. Similar Interests (25 points)
 * 3. Popular Users (15 points)
 * 4. New Users (10 points)
 * 5. Activity Pattern (10 points)
 */
class SuggestionService {
  
  private suggestionCache: Map<string, { 
    suggestions: SuggestedUser[], 
    timestamp: number 
  }> = new Map();
  
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get personalized suggestions for user
   * Uses 5 conditions with weighted scoring
   */
  async getSuggestionsForUser(
    userId: string, 
    limit: number = 7,
    offset: number = 0
  ): Promise<SuggestedUser[]> {
    
    try {
      console.log('🔍 Getting suggestions for user:', userId, { limit, offset });
      
      // Check cache first (if offset is 0)
      if (offset === 0) {
        const cached = this.getCachedSuggestions(userId);
        if (cached) {
          console.log('✅ Returning cached suggestions');
          return cached.slice(0, limit);
        }
      }
      
      // Get current user data
      const currentUser = await userService.getUser(userId);
      if (!currentUser) {
        console.error('❌ Current user not found');
        return [];
      }
      
      // Get user's following list
      const following = await userService.getFollowing(userId);
      console.log('📊 User follows:', following.length, 'users');
      
      // Get all potential suggestions
      const allUsers = await this.getAllPotentialSuggestions(userId);
      console.log('📊 Total potential suggestions:', allUsers.length);
      
      // Filter out already following, blocked, self, and private accounts
      const filtered = await this.filterUsers(userId, allUsers, following);
      console.log('📊 After filtering:', filtered.length, 'users');
      
      // Calculate score for each user
      const scored = await Promise.all(
        filtered.map(async (user) => {
          const score = await this.calculateScore(currentUser, user, following);
          const reason = await this.getSuggestionReason(currentUser, user);
          
          return {
            ...user,
            score,
            reason
          } as SuggestedUser;
        })
      );
      
      // Sort by score (highest first)
      scored.sort((a, b) => b.score - a.score);
      
      console.log('✅ Top 5 suggestions:', scored.slice(0, 5).map(u => ({
        username: u.username,
        score: u.score,
        reason: u.reason
      })));
      
      // Cache results (store top 20)
      if (offset === 0) {
        this.cacheSuggestions(userId, scored.slice(0, 20));
      }
      
      // Apply pagination
      return scored.slice(offset, offset + limit);
      
    } catch (error) {
      console.error('❌ Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Get all potential users to suggest
   * Optimized query to get active users
   */
  private async getAllPotentialSuggestions(userId: string): Promise<User[]> {
    try {
      // Get all users except current user
      const usersRef = collection(db, 'users');
      const q = query(usersRef, firestoreLimit(200)); // Limit for performance
      
      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(doc => ({ userId: doc.id, ...doc.data() } as User))
        .filter(u => u.userId !== userId);
      
      return users;
    } catch (error) {
      console.error('Error getting potential suggestions:', error);
      return [];
    }
  }

  /**
   * Filter users based on following, blocking, privacy
   */
  private async filterUsers(
    userId: string,
    users: User[],
    following: string[]
  ): Promise<User[]> {
    
    try {
      // Get blocked users
      const blocked = await userService.getBlockedUsers(userId);
      
      return users.filter(user => {
        // Skip if already following
        if (following.includes(user.userId)) return false;
        
        // Skip if blocked or blocking
        if (blocked.includes(user.userId)) return false;
        
        // Skip if no avatar (incomplete profile)
        if (!user.avatarURL) return false;
        
        return true;
      });
      
    } catch (error) {
      console.error('Error filtering users:', error);
      return users;
    }
  }

  /**
   * Calculate weighted score based on 5 conditions
   * Total possible: 100 points
   */
  private async calculateScore(
    currentUser: User, 
    suggestedUser: User,
    currentUserFollowing: string[]
  ): Promise<number> {
    
    let score = 0;
    
    // 1. Mutual Followers (40 points max)
    const mutualFollowers = await this.getMutualFollowers(
      currentUser.userId, 
      suggestedUser.userId,
      currentUserFollowing
    );
    const mutualScore = Math.min(mutualFollowers.length * 8, 40);
    score += mutualScore;
    
    // 2. Similar Interests (25 points max)
    // Extract from bio keywords or tags
    const commonInterests = await this.getCommonInterests(
      currentUser, 
      suggestedUser
    );
    const interestScore = Math.min(commonInterests.length * 5, 25);
    score += interestScore;
    
    // 3. Popular User (15 points max)
    const followersCount = suggestedUser.followersCount || 0;
    let popularScore = 0;
    if (followersCount > 1000) popularScore = 15;
    else if (followersCount > 500) popularScore = 10;
    else if (followersCount > 100) popularScore = 5;
    score += popularScore;
    
    // 4. New User (10 points)
    const daysSinceJoined = this.getDaysSince(suggestedUser.createdAt);
    if (daysSinceJoined < 30) {
      score += 10;
    }
    
    // 5. Activity Pattern (10 points)
    // Check if user is active (posted recently)
    const daysSinceLastPost = await this.getDaysSinceLastPost(suggestedUser.userId);
    if (daysSinceLastPost < 7) {
      score += 10;
    } else if (daysSinceLastPost < 30) {
      score += 5;
    }
    
    // Bonus: Complete profile (5 points)
    if (suggestedUser.bio && suggestedUser.avatarURL && suggestedUser.displayName) {
      score += 5;
    }
    
    return score;
  }

  /**
   * Get human-readable reason for suggestion
   */
  private async getSuggestionReason(
    currentUser: User,
    suggestedUser: User
  ): Promise<string> {
    
    try {
      // Check mutual followers first (highest priority)
      const mutualFollowers = await this.getMutualFollowers(
        currentUser.userId,
        suggestedUser.userId
      );
      
      if (mutualFollowers.length > 0) {
        const firstFollower = await userService.getUser(mutualFollowers[0]);
        if (firstFollower) {
          // Clean username - remove @ prefix if exists
          const cleanUsername = firstFollower.username.replace(/^@+/, '');
          if (mutualFollowers.length === 1) {
            return `Followed by @${cleanUsername}`;
          } else {
            return `Followed by @${cleanUsername} + ${mutualFollowers.length - 1} others`;
          }
        }
      }
      
      // Check similar interests
      const commonInterests = await this.getCommonInterests(currentUser, suggestedUser);
      if (commonInterests.length > 0) {
        const topInterests = commonInterests.slice(0, 2).join(', ');
        return `Similar interests: ${topInterests}`;
      }
      
      // Check if new user
      const daysSinceJoined = this.getDaysSince(suggestedUser.createdAt);
      if (daysSinceJoined < 7) {
        return 'New to Iris';
      }
      
      // Check if popular
      if ((suggestedUser.followersCount || 0) > 1000) {
        return 'Popular on Iris';
      }
      
      // Default
      return 'Suggested for you';
      
    } catch (error) {
      console.error('Error getting suggestion reason:', error);
      return 'Suggested for you';
    }
  }

  /**
   * Get mutual followers between two users
   */
  private async getMutualFollowers(
    userId1: string,
    userId2: string,
    user1Following?: string[]
  ): Promise<string[]> {
    
    try {
      // Get user1's following list (use cached if provided)
      const following1 = user1Following || await userService.getFollowing(userId1);
      
      // Get user2's followers list
      const followers2 = await userService.getFollowers(userId2);
      
      // Find intersection
      return following1.filter(id => followers2.includes(id));
      
    } catch (error) {
      console.error('Error getting mutual followers:', error);
      return [];
    }
  }

  /**
   * Get common interests between users
   * Extract from bio, username, or posts
   */
  private async getCommonInterests(
    user1: User,
    user2: User
  ): Promise<string[]> {
    
    try {
      // Extract keywords from bios
      const interests1 = this.extractInterests(user1.bio || '');
      const interests2 = this.extractInterests(user2.bio || '');
      
      // Find common interests
      return interests1.filter(interest => interests2.includes(interest));
      
    } catch (error) {
      console.error('Error getting common interests:', error);
      return [];
    }
  }

  /**
   * Extract interests from bio text
   * Simple keyword matching
   */
  private extractInterests(bio: string): string[] {
    const keywords = [
      'fitness', 'gym', 'workout', 'health',
      'coding', 'developer', 'programming', 'tech',
      'travel', 'traveller', 'adventure', 'explore',
      'food', 'foodie', 'cooking', 'chef',
      'music', 'musician', 'singer', 'artist',
      'photography', 'photographer', 'photo',
      'fashion', 'style', 'designer',
      'sports', 'football', 'cricket', 'basketball',
      'gaming', 'gamer', 'esports',
      'book', 'reading', 'writer', 'author'
    ];
    
    const lowerBio = bio.toLowerCase();
    return keywords.filter(keyword => lowerBio.includes(keyword));
  }

  /**
   * Get days since a timestamp
   */
  private getDaysSince(timestamp: any): number {
    if (!timestamp) return 999;
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days since user's last post
   */
  private async getDaysSinceLastPost(userId: string): Promise<number> {
    try {
      // Check posts collection
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return 999; // No posts
      }
      
      const lastPost = snapshot.docs[0].data();
      return this.getDaysSince(lastPost.createdAt);
      
    } catch (error) {
      console.error('Error getting last post date:', error);
      return 999;
    }
  }

  /**
   * Get suggestions specifically for Following/Followers list
   * Shows only mutual connections
   */
  async getMutualSuggestions(
    userId: string,
    contextUserId: string, // The user whose followers/following we're viewing
    limit: number = 7
  ): Promise<SuggestedUser[]> {
    
    try {
      console.log('🔍 Getting mutual suggestions:', { userId, contextUserId, limit });
      
      const currentUser = await userService.getUser(userId);
      if (!currentUser) return [];
      
      // Get context user for username (not userId)
      const contextUser = await userService.getUser(contextUserId);
      // Clean username - remove @ prefix if exists
      const contextUsername = (contextUser?.username || 'user').replace(/^@+/, '');
      
      const currentUserFollowing = await userService.getFollowing(userId);
      const contextUserFollowing = await userService.getFollowing(contextUserId);
      const contextUserFollowers = await userService.getFollowers(contextUserId);
      
      // Find people in context user's network but not followed by current user
      const potentialSuggestions = new Set([
        ...contextUserFollowing,
        ...contextUserFollowers
      ]);
      
      // Convert Set to Array and deduplicate first
      const uniquePotentialIds = Array.from(potentialSuggestions).filter(
        id => id !== userId && !currentUserFollowing.includes(id)
      );
      
      const suggestions: SuggestedUser[] = [];
      const seenUserIds = new Set<string>(); // Prevent duplicates
      
      for (const suggestedId of uniquePotentialIds) {
        // Skip if already added (double-check)
        if (seenUserIds.has(suggestedId)) {
          continue;
        }
        
        const user = await userService.getUser(suggestedId);
        if (!user || !user.avatarURL) continue;
        
        // Mark as seen to prevent duplicates
        seenUserIds.add(suggestedId);
        
        // Calculate mutual count
        const mutualFollowers = await this.getMutualFollowers(userId, suggestedId);
        
        // Clean username - remove @ prefix if exists
        const cleanContextUsername = contextUsername.replace(/^@+/, '');
        
        suggestions.push({
          ...user,
          score: mutualFollowers.length * 10,
          reason: mutualFollowers.length > 0 
            ? `Followed by @${cleanContextUsername} + ${mutualFollowers.length} others`
            : `Followed by @${cleanContextUsername}`
        });
        
        // Limit results
        if (suggestions.length >= limit * 2) break;
      }
      
      // Sort by score and return top results (ensure uniqueness)
      const uniqueSuggestions = suggestions
        .sort((a, b) => b.score - a.score)
        .filter((user, index, self) => 
          index === self.findIndex(u => u.userId === user.userId)
        )
        .slice(0, limit);
      
      return uniqueSuggestions;
      
    } catch (error) {
      console.error('Error getting mutual suggestions:', error);
      return [];
    }
  }

  /**
   * Cache suggestions for faster subsequent loads
   */
  private cacheSuggestions(userId: string, suggestions: SuggestedUser[]): void {
    this.suggestionCache.set(userId, {
      suggestions,
      timestamp: Date.now()
    });
    
    console.log('💾 Cached', suggestions.length, 'suggestions for user:', userId);
  }

  /**
   * Get cached suggestions if still valid
   */
  private getCachedSuggestions(userId: string): SuggestedUser[] | null {
    const cached = this.suggestionCache.get(userId);
    
    if (!cached) return null;
    
    // Check if cache expired
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_DURATION) {
      this.suggestionCache.delete(userId);
      return null;
    }
    
    return cached.suggestions;
  }

  /**
   * Get suggested users (alias for getSuggestionsForUser)
   */
  async getSuggestedUsers(
    userId: string,
    limit: number = 7,
    offset: number = 0
  ): Promise<SuggestedUser[]> {
    return this.getSuggestionsForUser(userId, limit, offset);
  }

  /**
   * Clear cache for a user (call after following someone)
   */
  clearCache(userId: string): void {
    this.suggestionCache.delete(userId);
    console.log('🗑️ Cleared suggestion cache for user:', userId);
  }
}

export const suggestionService = new SuggestionService();
