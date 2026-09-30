// Shared types for the GlimpseViewerScreenEnhanced store/screen.
// Mirrors the Glimpse shape used by GlimpseViewerScreenEnhanced.tsx.
export interface Glimpse {
  glimpseId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarURL?: string;
  authorVerified?: boolean;
  mediaURL: string;
  mediaType: 'image' | 'video';
  thumbnailURL?: string;
  coverImageURL?: string;
  caption?: string;
  editorMeta?: any;
  trimStart?: number | null;
  trimEnd?: number | null;
  duration?: number;
  audience?: 'public' | 'followers' | 'closeFriends' | 'close_friends';
  allowReplies?: boolean;
  allowSharing?: boolean;
  settings?: { allowComments?: boolean; hideLikes?: boolean };
  backgroundMusic?: {
    trackTitle: string;
    artistName: string;
    coverArtURL?: string;
    streamURL?: string;
    clipStart?: number;
    clipEnd?: number;
  };
  stats: {
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
  };
  tags?: string[];
  mentions?: string[];
  createdAt: any;
  isLiked?: boolean;
  isSaved?: boolean;
}
