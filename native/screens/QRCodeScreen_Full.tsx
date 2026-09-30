import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';

export default function QRCodeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const profileUrl = `https://iris.app/@${user?.username}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Follow me on Iris: ${profileUrl}`,
        url: profileUrl,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>QR Code</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.qrContainer}>
          <View style={styles.userInfo}>
            <Avatar
              source={user?.avatarURL}
              size={64}
              fallbackText={user?.username}
            />
            <Text style={styles.username}>@{user?.username}</Text>
            {user?.displayName && (
              <Text style={styles.displayName}>{user.displayName}</Text>
            )}
          </View>

          <View style={styles.qrWrapper}>
            <QRCode
              value={profileUrl}
              size={200}
              color={colors.text.primary}
              backgroundColor={colors.background.primary}
            />
          </View>

          <Text style={styles.instruction}>
            Scan this code to follow me
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={24} color={colors.text.primary} />
            <Text style={styles.actionText}>Save Image</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={colors.text.primary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xxl,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  username: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  displayName: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  qrWrapper: {
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  instruction: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
});
