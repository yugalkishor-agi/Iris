import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { useColors, spacing, typography, borderRadius } from '../styles/theme';

export default function DeactivateAccountScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const themeColors = useColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [loading, setLoading] = useState(false);

  const deactivate = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      await userService.updateUser(user.userId, {
        accountStatus: 'deactivated',
        deactivatedAt: new Date(),
      } as any);
      await signOut();
      Alert.alert('Account Deactivated', 'Your account has been deactivated. You can log back in to reactivate.');
    } catch (error: any) {
      Alert.alert('Failed', error?.message || 'Could not deactivate your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Account',
      'Your profile and content will be hidden until you log back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: deactivate,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Deactivate Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={40} color={themeColors.accent.warning} />
          <Text style={styles.warningTitle}>Temporary Deactivation</Text>
          <Text style={styles.warningText}>
            Your profile, posts, and activity are hidden while the account is deactivated.
            You can reactivate by logging back in.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.deactivateButton, loading && styles.deactivateButtonDisabled]}
          onPress={handleDeactivate}
          disabled={loading}
        >
          {loading ? <ButtonLoadingSkeleton /> : <Text style={styles.deactivateText}>Deactivate Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold as any,
      color: themeColors.text.primary,
    },
    placeholder: {
      width: 24,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    warningCard: {
      borderWidth: 1,
      borderColor: `${themeColors.accent.warning}55`,
      backgroundColor: `${themeColors.accent.warning}14`,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    warningTitle: {
      fontSize: typography.fontSize.lg,
      color: themeColors.text.primary,
      fontWeight: typography.fontWeight.semibold as any,
    },
    warningText: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
      lineHeight: 20,
      textAlign: 'center',
    },
    deactivateButton: {
      marginTop: spacing.xl,
      backgroundColor: themeColors.accent.warning,
      borderRadius: borderRadius.md,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deactivateButtonDisabled: {
      opacity: 0.7,
    },
    deactivateText: {
      color: '#fff',
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold as any,
    },
  });


