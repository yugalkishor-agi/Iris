import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PostCard } from '../../../components/feed/PostCard';

const { width, height } = Dimensions.get('window');

interface PostViewerListItemProps {
  item: any;
  currentItemId: string;
  getItemId: (item: any) => string;
  isGlimpseItem: (item: any) => boolean;
  user: any;
  handleToggleLike: (item: any) => void;
  handleSave: (item: any, savedState: boolean) => void;
  handleShareCountAdd: (item: any, count: number) => void;
  setPost: (item: any) => void;
  setEditCaption: (caption: string) => void;
  loadStatusForPost: (item: any) => void;
  setMenuVisible: (visible: boolean) => void;
}

const PostViewerListItemComponent: React.FC<PostViewerListItemProps> = ({
  item,
  currentItemId,
  getItemId,
  isGlimpseItem,
  user,
  handleToggleLike,
  handleSave,
  handleShareCountAdd,
  setPost,
  setEditCaption,
  loadStatusForPost,
  setMenuVisible,
}) => {
  const itemId = getItemId(item);
  const isCurrent = itemId === currentItemId;
  const isGlimpse = isGlimpseItem(item);

  // Optimization: use functions bound to item ID instead of redefining inline for the child PostCard
  const onLikePress = React.useCallback(() => {
    if (!isCurrent || !user?.userId) return;
    handleToggleLike(item);
  }, [isCurrent, user?.userId, handleToggleLike, item]);

  const onSavePress = React.useCallback(() => {
    if (!isCurrent || !user?.userId) return;
    handleSave(item, !!item.isSaved);
  }, [isCurrent, user?.userId, handleSave, item]);

  const onSharePress = React.useCallback((sharedCount: number | undefined) => {
    if (!sharedCount || Number(sharedCount) <= 0) return;
    handleShareCountAdd(item, sharedCount);
  }, [handleShareCountAdd, item]);

  const onMenuPress = React.useCallback(() => {
    setPost(item);
    setEditCaption(item.caption || item.content || '');
    loadStatusForPost(item);
    setMenuVisible(true);
  }, [item, setPost, setEditCaption, loadStatusForPost, setMenuVisible]);

  return (
    <View style={styles.page}>
      <PostCard
        postId={itemId}
        postType={isGlimpse ? 'glimpse' : item.postType}
        user={{
          name: item.authorDisplayName || item.authorUsername || item.displayName || item.username,
          avatar: item.authorAvatarURL || item.avatarURL,
          avatarURL: item.authorAvatarURL || item.avatarURL,
          username: item.authorUsername || item.username,
          isVerified: item.authorVerified || item.verified,
          userId: item.authorId || item.userId,
        }}
        image={item.mediaURLs?.[0] || item.mediaURL || ''}
        caption={item.caption || item.content || ''}
        location={item.location}
        time={item.createdAt}
        likes={item.stats?.likesCount || item.likesCount || 0}
        comments={item.stats?.commentsCount || item.commentsCount || 0}
        latestCommentText={item.latestComment?.text || item.latestCommentText || item.latestComment?.comment || ''}
        latestCommentUser={item.latestComment?.username || item.latestCommentUser || item.latestComment?.authorUsername || item.latestComment?.authorName || ''}
        likedByPreview={item.likedByPreview || []}
        hideLikesCount={item.hideLikesCount}
        hideSharesCount={item.hideSharesCount}
        commentsEnabled={item.commentsEnabled}
        allowSharing={item.allowSharing}
        audience={item.audience}
        backgroundMusic={item.backgroundMusic}
        taggedUsers={item.taggedUsers}
        collaborators={item.collaborators}
        isLiked={!!item.isLiked}
        isSaved={!!item.isSaved}
        showMenuButton
        variant="fullscreen"
        onMenuPress={onMenuPress}
        onLike={onLikePress}
        onSave={onSavePress}
        onShare={(postId, sharedCount) => onSharePress(sharedCount)}
      />
    </View>
  );
};

export const PostViewerListItem = React.memo(PostViewerListItemComponent, (prevProps, nextProps) => {
  return prevProps.item === nextProps.item && prevProps.currentItemId === nextProps.currentItemId;
});

const styles = StyleSheet.create({
  page: {
    height: height,
    width: width,
    backgroundColor: '#000',
  },
});
