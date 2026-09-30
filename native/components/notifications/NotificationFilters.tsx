import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FilterTab } from '../../hooks/notifications/notificationTypes';
import { typography } from '../../styles/theme';

interface NotificationFiltersProps {
  activeFilter: FilterTab;
  setActiveFilter: (filter: FilterTab) => void;
  unreadCount: number;
}

export const NotificationFilters = React.memo(function NotificationFilters({
  activeFilter,
  setActiveFilter,
  unreadCount,
}: NotificationFiltersProps) {
  return (
    <>
      {unreadCount > 0 ? (
        <View style={styles.topMetaBar}>
          <View style={styles.topMetaPill}>
            <Text style={styles.topMetaValue}>{unreadCount}</Text>
            <Text style={styles.topMetaLabel}>unread</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.9}
        >
          <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'comments' && styles.filterChipActive]}
          onPress={() => setActiveFilter('comments')}
          activeOpacity={0.9}
        >
          <Text style={[styles.filterChipText, activeFilter === 'comments' && styles.filterChipTextActive]}>Comments</Text>
        </TouchableOpacity>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  topMetaBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topMetaPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#111317',
    borderWidth: 1,
    borderColor: '#1E2228',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  topMetaValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: typography.fontWeight.bold as any,
    marginRight: 4,
  },
  topMetaLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: typography.fontWeight.medium as any,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#23262B',
    backgroundColor: '#0B0D10',
  },
  filterChipActive: {
    backgroundColor: '#171B22',
    borderColor: '#3A82F7',
  },
  filterChipText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold as any,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});
