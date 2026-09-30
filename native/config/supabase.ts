import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendConfigSummary, runtimeConfig, runtimeConfigSource } from './runtimeConfig';

if (__DEV__ && runtimeConfigSource.supabaseFromFallback) {
  console.warn(
    '[Config] Supabase env vars not injected. Using temporary fallback values from config/runtimeConfig.ts.'
  );
}

const supabaseUrl = runtimeConfig.supabase.url;
if (__DEV__) {
  console.log(
    `[Config] Supabase target url=${backendConfigSummary.supabase.url} tempOverride=${backendConfigSummary.supabase.tempOverrideEnabled}`
  );
}
const supabaseKey = runtimeConfig.supabase.anonKey;
const cdnUrl = runtimeConfig.supabase.cdnUrl;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const getMediaUrl = (path: string, useCDN = false): string => {
  if (useCDN && cdnUrl) {
    return `${cdnUrl.replace(/\/$/, '')}/storage/v1/object/public/${path}`;
  }
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${path}`;
};

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  POSTS: 'posts',
  STORIES: 'stories',
  MESSAGES: 'messages',
  GLIMPSES: 'glimpses',
} as const;

export default supabase;
