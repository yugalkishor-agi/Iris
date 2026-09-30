// ConversationList.tsx
// Purpose: List of conversations with FlashList for performance
// Extracted from: MessagesScreenEnhanced.tsx — Session 002

import React, { memo } from 'react';
import { View, Text, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors, spacing, typography } from '../../styles/theme';
import { ConversationRow } from './ConversationRow';
import type { Conversation, User } from '../../types/database';

interface ConversationListProps {
  conversations: Conversation[];
  conversationUsers: { [key: string]: User };
  currentUserId: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onConversationPress: (conversation: Conversation) => void;
  onConversationLongPress?: (conversation: Conversation) => void;
  drafts?: { [conversationId: string]: string };
  presenceUsers?: { [userId: string]: { isOnline?: boolean; lastSeen?: any } };
  typingConvos?: { [conversationId: string]: boolean };
}

const ConversationList = memo(({
  conversations,
  conversationUsers,
  currentUserId,
  refreshing,
  onRefresh,
  onConversationPress,
  onConversationLongPress,
  drafts = {},
  presenceUsers = {},
  typingConvos = {},
}: ConversationListProps) => {
  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = conversationUsers[item.conversationId];
    const draft = drafts[item.conversationId];
    const isTyping = typingConvos[item.conversationId];
    const presence = otherUser?.userId ? presenceUsers[otherUser.userId] : undefined;

    return (
      <ConversationRow
        conversation={item}
        conversationUser={otherUser}
        currentUserId={currentUserId}
        draft={draft}
        isTyping={isTyping}
        isOnline={presence?.isOnline}
        activeTab="chats"
        onPress={() => onConversationPress(item)}
        onLongPress={() => onConversationLongPress?.(item)}
        onAvatarPress={() => onConversationPress(item)}
        onMorePress={() => onConversationLongPress?.(item)}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No conversations yet</Text>
      <Text style={styles.emptySubtext}>Start a conversation to see it here</Text>
    </View>
  );

  return (
    <FlashList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={(item) => item.conversationId}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text.secondary}
          />
        ) : undefined
      }
      ListEmptyComponent={renderEmpty}
      estimatedItemSize={76}
    />
  );
});

ConversationList.displayName = 'ConversationList';

export default ConversationList;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
