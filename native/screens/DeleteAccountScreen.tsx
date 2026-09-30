import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { useColors, spacing, typography, borderRadius } from '../styles/theme';

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const themeColors = useColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestDeletion = async () => {
    if (!user?.userId) return;
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password to continue.');
      return;
    }

    setLoading(true);
    try {
      const valid = await authService.verifyPassword(password.trim());
      if (!valid) {
        Alert.alert('Invalid Password', 'The password you entered is incorrect.');
        return;
      }

      await userService.updateUser(user.userId, {
        accountStatus: 'deletion_requested',
        deletionRequested: true,
        deletionRequestedAt: new Date(),
      } as any);

      await signOut();
      Alert.alert(
        'Deletion Requested',
        'Your account deletion request has been submitted. Contact support if this was not you.'
      );
    } catch (error: any) {
      Alert.alert('Failed', error?.message || 'Could not process deletion request.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'This starts account deletion workflow. Your data may be removed permanently after processing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: requestDeletion,
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
        <Text style={styles.title}>Delete Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.dangerCard}>
          <Ionicons name="trash-bin-outline" size={40} color={themeColors.accent.error} />
          <Text style={styles.dangerTitle}>Permanent Action</Text>
          <Text style={styles.dangerText}>
            Deletion request removes access to your profile and can permanently erase your account data.
          </Text>
        </View>

        <Text style={styles.label}>Confirm with your password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Current password"
          placeholderTextColor={themeColors.text.secondary}
        />

        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={loading}
        >
          {loading ? <ButtonLoadingSkeleton /> : <Text style={styles.deleteText}>Request Account Deletion</Text>}
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
    dangerCard: {
      borderWidth: 1,
      borderColor: `${themeColors.accent.error}55`,
      backgroundColor: `${themeColors.accent.error}10`,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    dangerTitle: {
      fontSize: typography.fontSize.lg,
      color: themeColors.text.primary,
      fontWeight: typography.fontWeight.semibold as any,
    },
    dangerText: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
      lineHeight: 20,
      textAlign: 'center',
    },
    label: {
      marginTop: spacing.xl,
      marginBottom: spacing.xs,
      color: themeColors.text.secondary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold as any,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border.light,
      borderRadius: borderRadius.md,
      backgroundColor: themeColors.background.secondary,
      color: themeColors.text.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: typography.fontSize.base,
    },
    deleteButton: {
      marginTop: spacing.xl,
      backgroundColor: themeColors.accent.error,
      borderRadius: borderRadius.md,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonDisabled: {
      opacity: 0.7,
    },
    deleteText: {
      color: '#fff',
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold as any,
    },
  });


