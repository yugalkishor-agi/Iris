import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography } from '../../styles/theme';

interface NotificationsHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
}

export const NotificationsHeader = React.memo(function NotificationsHeader({
  unreadCount,
  onMarkAllAsRead,
}: NotificationsHeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerSide} onPress={() => (navigation as any).goBack()}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notifications</Text>
      <TouchableOpacity
        style={styles.headerSideRight}
        onPress={onMarkAllAsRead}
        activeOpacity={0.8}
        disabled={unreadCount === 0}
      >
        {unreadCount > 0 ? <Text style={styles.markAllText}>Mark all</Text> : <View style={styles.headerSpacer} />}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerSide: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSideRight: {
    minWidth: 56,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: typography.fontWeight.bold as any,
    letterSpacing: -0.4,
  },
  markAllText: {
    color: '#4DA3FF',
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold as any,
  },
});
