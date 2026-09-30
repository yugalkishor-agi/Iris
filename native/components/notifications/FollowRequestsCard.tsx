import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../ui/Avatar';
import { typography } from '../../styles/theme';

interface FollowRequestsCardProps {
  isPrivateAccount: boolean;
  pendingFollowRequests: any[];
}

export const FollowRequestsCard = React.memo(function FollowRequestsCard({
  isPrivateAccount,
  pendingFollowRequests,
}: FollowRequestsCardProps) {
  const navigation = useNavigation();

  if (!isPrivateAccount || pendingFollowRequests.length === 0) return null;

  const previewUsers = pendingFollowRequests.slice(0, 3);
  const label = (() => {
    if (previewUsers.length === 1) return previewUsers[0].username;
    if (previewUsers.length === 2) return `${previewUsers[0].username} and ${previewUsers[1].username}`;
    if (previewUsers.length >= 3) return `${previewUsers[0].username}, ${previewUsers[1].username} and ${pendingFollowRequests.length - 2} others`;
    return 'New follow requests';
  })();

  return (
    <TouchableOpacity
      style={styles.requestsCard}
      activeOpacity={0.9}
      onPress={() => (navigation as any).navigate('FollowRequests')}
    >
      <View style={styles.requestsAvatarStack}>
        {previewUsers.map((request, index) => (
          <View
            key={request.requestId || request.userId}
            style={[styles.requestAvatarWrap, { marginLeft: index === 0 ? 0 : -16, zIndex: previewUsers.length - index }]}
          >
            <Avatar source={request.avatarURL} size={42} fallbackText={request.username || '?'} />
          </View>
        ))}
      </View>
      <View style={styles.requestsBody}>
        <Text style={styles.requestsTitle}>Follow requests</Text>
        <Text style={styles.requestsSubtitle} numberOfLines={2}>{label}</Text>
      </View>
      <View style={styles.requestsMeta}>
        <View style={styles.requestsCountPill}>
          <Text style={styles.requestsCountText}>{pendingFollowRequests.length}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  requestsCard: {
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0E1014',
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestsAvatarStack: {
    width: 66,
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestAvatarWrap: {
    borderWidth: 2,
    borderColor: '#0E1014',
    borderRadius: 24,
  },
  requestsBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  requestsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: typography.fontWeight.bold as any,
    marginBottom: 4,
  },
  requestsSubtitle: {
    color: '#B6BBC6',
    fontSize: 13,
    lineHeight: 18,
  },
  requestsMeta: {
    alignItems: 'center',
    gap: 8,
  },
  requestsCountPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: '#1A6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.fontWeight.bold as any,
  },
});
