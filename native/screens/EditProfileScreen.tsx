import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { borderRadius, colors, spacing, typography } from '../styles/theme';

const MAX_BIO_LENGTH = 150;

const normalizeWebsite = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user: currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    website: '',
    location: '',
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      try {
        const userData = await userService.getUser(currentUser.userId);
        if (userData) {
          setFormData({
            displayName: userData.displayName || '',
            username: userData.username || '',
            bio: userData.bio || '',
            website: userData.website || '',
            location: userData.location || '',
          });
        }
      } catch (error) {
        console.error('Failed to load user data', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const trimmedDisplayName = useMemo(() => formData.displayName.trim(), [formData.displayName]);
  const normalizedWebsite = useMemo(() => normalizeWebsite(formData.website), [formData.website]);
  const bioLength = formData.bio.length;

  const setField = (key: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    if (!trimmedDisplayName) {
      Alert.alert('Display name required', 'Please enter a display name.');
      return;
    }

    if (formData.bio.length > MAX_BIO_LENGTH) {
      Alert.alert('Bio too long', `Bio must stay within ${MAX_BIO_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    try {
      await userService.updateUser(currentUser.userId, {
        displayName: trimmedDisplayName,
        bio: formData.bio.trim(),
        website: normalizedWebsite,
        location: formData.location.trim(),
      });
      await refreshUser();
      Alert.alert('Profile updated', 'Your changes have been saved.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            style={[styles.headerSaveButton, saving && styles.disabledButton]}
            activeOpacity={0.8}
          >
            {saving ? (
              <InlineLoadingSkeleton />
            ) : (
              <Text style={styles.headerSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer as any}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#111827', '#0B1220', '#05070B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={16} color={colors.accent.primary} />
              <Text style={styles.heroBadgeText}>Profile details</Text>
            </View>
            <Text style={styles.heroTitle}>Refine how your profile feels.</Text>
            <Text style={styles.heroSubtitle}>
              Changes save directly to your account and update your public profile across the app.
            </Text>
            <View style={styles.identityPill}>
              <Ionicons name="at" size={14} color={colors.text.secondary} />
              <Text style={styles.identityText}>{formData.username || 'username'}</Text>
            </View>
          </LinearGradient>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={18} color={colors.accent.primary} />
              <Text style={styles.sectionTitle}>Public profile</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Display name</Text>
              <TextInput
                style={styles.input}
                value={formData.displayName}
                onChangeText={(text) => setField('displayName', text)}
                placeholder="Your name"
                placeholderTextColor={colors.text.muted}
                maxLength={40}
              />
              <Text style={styles.helperText}>This is the name people see first on your profile.</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.readOnlyInput}>
                <Ionicons name="lock-closed" size={14} color={colors.text.muted} />
                <Text style={styles.readOnlyValue}>{formData.username}</Text>
              </View>
              <Text style={styles.helperText}>Username stays fixed here to avoid broken mentions and profile links.</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.accent.primary} />
              <Text style={styles.sectionTitle}>Bio</Text>
            </View>

            <View style={styles.field}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setField('bio', text)}
                placeholder="Tell people something real about you"
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={5}
                maxLength={MAX_BIO_LENGTH}
                textAlignVertical="top"
              />
              <View style={styles.metaRow}>
                <Text style={styles.helperText}>Long bios will collapse with a more/less toggle on profile.</Text>
                <Text style={styles.counterText}>{bioLength}/{MAX_BIO_LENGTH}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="globe-outline" size={18} color={colors.accent.primary} />
              <Text style={styles.sectionTitle}>Links and location</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                value={formData.website}
                onChangeText={(text) => setField('website', text)}
                placeholder="https://your-site.com"
                placeholderTextColor={colors.text.muted}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>We auto-normalize the link before saving.</Text>
            </View>

            <View style={[styles.field, styles.lastField]}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setField('location', text)}
                placeholder="City, Country"
                placeholderTextColor={colors.text.muted}
                maxLength={60}
              />
              <Text style={styles.helperText}>Used in profile metadata and about-account surfaces.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primarySaveButton, saving && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={saving ? ['#1F2937', '#1F2937'] : ['#0EA5E9', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primarySaveGradient}
            >
              {saving ? (
                <InlineLoadingSkeleton />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={colors.text.primary} />
                  <Text style={styles.primarySaveText}>Save changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  headerSaveButton: {
    minWidth: 74,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.md,
  },
  headerSaveText: {
    color: colors.accent.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(14,165,233,0.12)',
    marginBottom: spacing.md,
  },
  heroBadgeText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as any,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold as any,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  identityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  identityText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
  sectionCard: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
  },
  field: {
    marginBottom: spacing.lg,
  },
  lastField: {
    marginBottom: 0,
  },
  label: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  readOnlyInput: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: '#09090B',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  readOnlyValue: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
  },
  textArea: {
    minHeight: 124,
  },
  helperText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  counterText: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as any,
  },
  primarySaveButton: {
    height: 54,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  primarySaveGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primarySaveText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
