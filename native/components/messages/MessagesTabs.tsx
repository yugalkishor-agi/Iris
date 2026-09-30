// MessagesTabs.tsx
// Purpose: Tab switcher for Chats, Requests, Archived
// Extracted from: MessagesScreenEnhanced.tsx — Session 002

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles/theme';

type TabType = 'chats' | 'requests' | 'archived';

interface MessagesTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  requestCount?: number;
  archivedCount?: number;
}

const MessagesTabs = memo(({
  activeTab,
  onTabChange,
  requestCount = 0,
  archivedCount = 0,
}: MessagesTabsProps) => {
  const tabs: Array<{ id: TabType; label: string; count?: number }> = [
    { id: 'chats', label: 'Chats' },
    { id: 'requests', label: 'Requests', count: requestCount },
    { id: 'archived', label: 'Archived', count: archivedCount },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.count > 99 ? '99+' : tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

MessagesTabs.displayName = 'MessagesTabs';

export default MessagesTabs;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.accent.primary,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
