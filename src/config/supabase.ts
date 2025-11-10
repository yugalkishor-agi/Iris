import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shaqlzwarwjeozjtugdo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYXFsendhcndqZW96anR1Z2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzYwNzUsImV4cCI6MjA3NTA1MjA3NX0.3L-e6nEZp9owu91rUpcj6VVPzGQrPTCEEKNNq2U56Fg';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// CDN URL for optimized media delivery
const cdnUrl = 'https://cdn.supabase.co/shaqlzwarwjeozjtugdo';

/**
 * Get media URL with optional CDN
 * @param path - Storage path (e.g., 'avatars/user123.jpg')
 * @param useCDN - Whether to use CDN (default: false - CDN has DNS issues)
 * @returns Full URL to media file
 */
export const getMediaUrl = (path: string, useCDN = false): string => {
  if (useCDN) {
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
