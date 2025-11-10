/**
 * Utility to anonymize blocked users in posts, profiles, and other content
 */

import type { Post } from '../../src/types/database';

export const ANONYMOUS_USER = {
  username: 'anonymous_user',
  displayName: 'Anonymous User',
  avatarURL: '',
  verified: false,
};

/**
 * Check if user is blocked and should be anonymized
 */
export const shouldAnonymize = (userId: string, blockedUsers: string[]): boolean => {
  return blockedUsers.includes(userId);
};

/**
 * Anonymize post data for blocked user
 */
export const anonymizePost = (post: Post, blockedUsers: string[]): Post | null => {
  // If post author is blocked, hide the post completely
  if (shouldAnonymize(post.authorId, blockedUsers)) {
    return null;
  }

  return post;
};

/**
 * Anonymize user data in any object
 */
export const anonymizeUser = (
  data: any,
  userId: string,
  blockedUsers: string[]
): any => {
  if (!shouldAnonymize(userId, blockedUsers)) {
    return data;
  }

  return {
    ...data,
    username: ANONYMOUS_USER.username,
    displayName: ANONYMOUS_USER.displayName,
    avatarURL: ANONYMOUS_USER.avatarURL,
    verified: false,
    bio: '',
  };
};

/**
 * Filter out posts from blocked users
 */
export const filterBlockedPosts = <T extends { authorId: string }>(
  items: T[],
  blockedUsers: string[]
): T[] => {
  return items.filter(item => !shouldAnonymize(item.authorId, blockedUsers));
};
