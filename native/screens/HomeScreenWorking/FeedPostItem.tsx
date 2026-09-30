import React, { memo } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { PostCard } from '../../components/feed/PostCard';
import { useHomeScreenWorkingStore } from './useHomeScreenWorkingStore';
import type { Post } from './homeFeedTypes';

interface FeedPostItemProps {
  item: Post;
  isFocused: boolean;
  onLayout: (event: LayoutChangeEvent, postId: string) => void;
  onLike: (postId: string) => void;
  onSaveChange: (postId: string, saved: boolean) => void;
  onShare: (postId: string, sharedCount: number) => void;
  onHide: (postId: string) => void;
  onToggleMusicMute: (postId: string) => void;
}

const FeedPostItemComponent = ({
  item,
  isFocused,
  onLayout,
  onLike,
  onSaveChange,
  onShare,
  onHide,
  onToggleMusicMute,
}: FeedPostItemProps) => {
  // Per-item music state subscribed directly from the store so that an
  // active-post transition only re-renders the 1-2 affected cards instead of
  // invalidating the whole FlashList via renderItem identity.
  const active = useHomeScreenWorkingStore((s) => s.activeMusicPostId === item.postId);
  const musicMuted = useHomeScreenWorkingStore((s) => !!s.mutedMusicPostIds[item.postId]);
  const isMusicActive = isFocused && active;

  return (
    <View onLayout={(event) => onLayout(event, item.postId)}>
      <PostCard
        postId={item.postId}
        user={{
          name: item.username || item.displayName || '',
          avatar: item.avatarURL,
          username: item.username || item.displayName || '',
          isVerified: item.verified,
          userId: item.userId,
        }}
        image={item.mediaURLs[0] || item.thumbnailURL || ''}
        mediaAspectRatio={item.aspectRatio}
        caption={item.content}
        mediaType={item.mediaType}
        location={item.location}
        time={item.createdAt?.toISOString?.() || new Date().toISOString()}
        likes={item.likesCount || 0}
        comments={item.commentsCount || 0}
        backgroundMusic={item.backgroundMusic}
        enableMusicAutoplay
        isMusicActive={isMusicActive}
        useExternalMusicControl
        musicMuted={musicMuted}
        onToggleMusicMute={onToggleMusicMute}
        taggedUsers={item.taggedUsers}
        collaborators={item.collaborators}
        shares={item.sharesCount || 0}
        likedByPreview={item.likedByPreview}
        latestCommentText={item.latestCommentText}
        latestCommentUser={item.latestCommentUser}
        hideLikesCount={item.hideLikesCount}
        hideSharesCount={item.hideSharesCount}
        commentsEnabled={item.commentsEnabled}
        allowSharing={item.allowSharing}
        audience={item.audience}
        isLiked={item.isLiked}
        isSaved={item.isSaved}
        onLike={onLike}
        onSaveChange={onSaveChange}
        onShare={onShare}
        onHide={onHide}
      />
    </View>
  );
};

export const FeedPostItem = memo(FeedPostItemComponent);
