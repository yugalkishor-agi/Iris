import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { FeedItem, FilterTab, NotificationGroup, AppNotification } from '../../hooks/notifications/notificationTypes';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters } from './NotificationFilters';
import { FollowRequestsCard } from './FollowRequestsCard';
import { NotificationsEmptyState } from './NotificationsEmptyState';
import { typography } from '../../styles/theme';

interface NotificationsListProps {
  groupedFeedItems: FeedItem[];
  currentUserId: string | null;
  followingUsers: Set<string>;
  activeFilter: FilterTab;
  setActiveFilter: (filter: FilterTab) => void;
  unreadCount: number;
  isPrivateAccount: boolean;
  pendingFollowRequests: any[];
  refreshing: boolean;
  onRefresh: () => void;
  onPress: (group: NotificationGroup) => void;
  onDelete: (group: NotificationGroup) => void;
  onFollow: (userId: string) => void;
  onAcceptCollaboration: (notification: AppNotification) => void;
  onDeclineCollaboration: (notification: AppNotification) => void;
}

export const NotificationsList = React.memo(function NotificationsList({
  groupedFeedItems,
  currentUserId,
  followingUsers,
  activeFilter,
  setActiveFilter,
  unreadCount,
  isPrivateAccount,
  pendingFollowRequests,
  refreshing,
  onRefresh,
  onPress,
  onDelete,
  onFollow,
  onAcceptCollaboration,
  onDeclineCollaboration,
}: NotificationsListProps) {
  const listHeader = useMemo(() => (
    <View style={styles.listHeaderWrap}>
      <NotificationFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} unreadCount={unreadCount} />
      <FollowRequestsCard isPrivateAccount={isPrivateAccount} pendingFollowRequests={pendingFollowRequests} />
    </View>
  ), [activeFilter, isPrivateAccount, pendingFollowRequests, setActiveFilter, unreadCount]);

  const renderEmptyState = useCallback(() => (
    <NotificationsEmptyState activeFilter={activeFilter} />
  ), [activeFilter]);

  const renderActivityItem = useCallback(({ item }: { item: FeedItem }) => {
    if (item.kind === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{item.title}</Text>
        </View>
      );
    }

    return (
      <NotificationItem
        group={item.group}
        currentUserId={currentUserId}
        followingUsers={followingUsers}
        onPress={onPress}
        onDelete={onDelete}
        onFollow={onFollow}
        onAcceptCollaboration={onAcceptCollaboration}
        onDeclineCollaboration={onDeclineCollaboration}
      />
    );
  }, [currentUserId, followingUsers, onAcceptCollaboration, onDeclineCollaboration, onDelete, onFollow, onPress]);

  return (
    <FlashList
      data={groupedFeedItems}
      renderItem={renderActivityItem}
      keyExtractor={(item) => item.key}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={renderEmptyState}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      contentContainerStyle={(groupedFeedItems.length === 0 ? styles.emptyContent : styles.listContent) as any}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={70}
    />
  );
});

const styles = StyleSheet.create({
  listHeaderWrap: { paddingBottom: 4 },
  listContent: { paddingBottom: 36 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  sectionHeaderText: { color: '#FFFFFF', fontSize: 22, fontWeight: typography.fontWeight.bold as any, letterSpacing: -0.4 },
  emptyContent: { flexGrow: 1 },
});
