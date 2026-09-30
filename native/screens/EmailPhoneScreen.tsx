import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useEffect, useMemo, useState } from 'react';
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

export default function EmailPhoneScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const themeColors = useColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    const load = async () => {
      try {
        const profile = await userService.getUser(user.userId);
        if (!profile) return;
        setEmail(profile.email || '');
        setPhone((profile.phoneNumber || profile.phone || '') as string);
      } catch (error) {
        console.error('Failed to load contact info:', error);
      }
    };
    load();
  }, [user?.userId]);

  const handleEmailUpdate = async () => {
    if (!newEmail || !emailPassword) {
      Alert.alert('Missing Fields', 'Please enter new email and current password.');
      return;
    }

    setLoading(true);
    try {
      await authService.updateUserEmail(newEmail.trim(), emailPassword);
      await refreshUser();
      setEmail(newEmail.trim());
      setNewEmail('');
      setEmailPassword('');
      setShowEmailForm(false);
      Alert.alert('Email Updated', 'Your email address has been updated.');
    } catch (error: any) {
      Alert.alert('Update Failed', error?.message || 'Could not update email right now.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneUpdate = async () => {
    if (!user?.userId) return;
    if (!newPhone.trim()) {
      Alert.alert('Invalid Phone', 'Please enter a phone number.');
      return;
    }

    setLoading(true);
    try {
      const phoneValue = newPhone.trim();
      await userService.updateUser(user.userId, {
        phoneNumber: phoneValue,
        phone: phoneValue,
      } as any);
      await refreshUser();
      setPhone(phoneValue);
      setNewPhone('');
      setShowPhoneForm(false);
      Alert.alert('Phone Updated', 'Your phone number has been saved.');
    } catch (error: any) {
      Alert.alert('Update Failed', error?.message || 'Could not update phone number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Email & Phone</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.rowTop}>
            <View>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{email || 'Not set'}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowEmailForm((prev) => !prev)}>
              <Text style={styles.actionText}>{showEmailForm ? 'Cancel' : 'Change'}</Text>
            </TouchableOpacity>
          </View>

          {showEmailForm && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="New email address"
                placeholderTextColor={themeColors.text.secondary}
              />
              <TextInput
                style={styles.input}
                value={emailPassword}
                onChangeText={setEmailPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Current password"
                placeholderTextColor={themeColors.text.secondary}
              />
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleEmailUpdate}
                disabled={loading}
              >
                {loading ? <ButtonLoadingSkeleton /> : <Text style={styles.primaryButtonText}>Save Email</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.rowTop}>
            <View>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{phone || 'Not set'}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowPhoneForm((prev) => !prev)}>
              <Text style={styles.actionText}>{showPhoneForm ? 'Cancel' : phone ? 'Edit' : 'Add'}</Text>
            </TouchableOpacity>
          </View>

          {showPhoneForm && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor={themeColors.text.secondary}
              />
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handlePhoneUpdate}
                disabled={loading}
              >
                {loading ? <ButtonLoadingSkeleton /> : <Text style={styles.primaryButtonText}>Save Phone</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    card: {
      backgroundColor: themeColors.background.secondary,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
      marginBottom: spacing.xs,
    },
    value: {
      fontSize: typography.fontSize.base,
      color: themeColors.text.primary,
      fontWeight: typography.fontWeight.semibold as any,
    },
    actionText: {
      fontSize: typography.fontSize.base,
      color: themeColors.accent.primary,
      fontWeight: typography.fontWeight.semibold as any,
    },
    form: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border.light,
      borderRadius: borderRadius.md,
      backgroundColor: themeColors.background.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: themeColors.text.primary,
      fontSize: typography.fontSize.base,
    },
    primaryButton: {
      marginTop: spacing.sm,
      backgroundColor: themeColors.accent.primary,
      minHeight: 44,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold as any,
    },
  });


