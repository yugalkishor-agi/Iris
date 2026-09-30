import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://phnhiegifgjhblqaojsg.supabase.co';
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  'sb_publishable_D7Ejll7Zf4XDyZH5UNBp3A_oVLISjg4';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// CDN URL for optimized media delivery
const cdnUrl =
  process.env.EXPO_PUBLIC_SUPABASE_CDN_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_CDN_URL ??
  undefined;

/**
 * Get media URL with optional CDN
 * @param path - Storage path (e.g., 'avatars/user123.jpg')
 * @param useCDN - Whether to use CDN (default: false - CDN has DNS issues)
 * @returns Full URL to media file
 */
export const getMediaUrl = (path: string, useCDN = false): string => {
  if (useCDN && cdnUrl) {
    return `${cdnUrl}/storage/v1/object/public/${path}`;
  }
  return `${supabaseUrl}/storage/v1/object/public/${path}`;
};

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  POSTS: 'posts',
  STORIES: 'stories',
  MESSAGES: 'messages',
  GLIMPSES: 'glimpses',
} as const;

export default supabase;
