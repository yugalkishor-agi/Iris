import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterTab } from '../../hooks/notifications/notificationTypes';
import { typography } from '../../styles/theme';

interface NotificationsEmptyStateProps {
  activeFilter: FilterTab;
}

export const NotificationsEmptyState: React.FC<NotificationsEmptyStateProps> = ({ activeFilter }) => {
  return (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeFilter === 'comments' ? 'chatbubble-ellipses-outline' : 'notifications-outline'}
        size={46}
        color="#8E8E93"
      />
      <Text style={styles.emptyTitle}>
        {activeFilter === 'comments' ? 'No comment activity yet' : 'No notifications yet'}
      </Text>
      <Text style={styles.emptyDescription}>
        {activeFilter === 'comments'
          ? 'Replies and comment activity will show here.'
          : 'Likes, comments, follows and mentions will show here.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 56,
  },
  emptyTitle: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: typography.fontWeight.bold as any,
  },
  emptyDescription: {
    marginTop: 8,
    color: '#8E8E93',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
});
