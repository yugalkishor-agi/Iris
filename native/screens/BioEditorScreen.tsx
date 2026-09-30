import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { colors, spacing, typography } from '../styles/theme';

export default function BioEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const maxLength = 150;
  const initialBio = (route.params as any)?.initialBio || user?.bio || '';

  useEffect(() => {
    loadUserBio();
  }, []);

  const loadUserBio = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userData = await userService.getUser(user.userId);
      const currentBio = userData?.bio || '';
      setBio(currentBio);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load user bio:', error);
      setBio(initialBio);
    } finally {
      setLoading(false);
    }
  };

  const handleBioChange = (text: string) => {
    setBio(text);
    setHasChanges(text !== initialBio);
  };

  const handleSave = async () => {
    if (!user || !hasChanges) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      await userService.updateUser(user.userId, { bio: bio.trim() });
      Alert.alert('Success', 'Bio updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to update bio:', error);
      Alert.alert('Error', 'Failed to update bio. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading bio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleDiscard}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Bio</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={saving || !hasChanges}
            style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
          >
            {saving ? (
              <InlineLoadingSkeleton />
            ) : (
              <Text style={[styles.saveText, !hasChanges && styles.saveTextDisabled]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={styles.input}
              placeholder="Write something about yourself..."
              placeholderTextColor={colors.text.secondary}
              value={bio}
              onChangeText={handleBioChange}
              multiline
              maxLength={maxLength}
              autoFocus
              textAlignVertical="top"
            />
            <View style={styles.footer}>
              <Text style={styles.helperText}>
                Tell people a little bit about yourself
              </Text>
              <Text style={[styles.counter, bio.length >= maxLength && styles.counterLimit]}>
                {bio.length}/{maxLength}
              </Text>
            </View>
          </View>

          {/* Bio Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Bio Tips:</Text>
            <Text style={styles.tipText}>• Keep it authentic and personal</Text>
            <Text style={styles.tipText}>• Mention your interests or profession</Text>
            <Text style={styles.tipText}>• Add emojis to make it fun</Text>
            <Text style={styles.tipText}>• Include your location if you want</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  saveTextDisabled: {
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    minHeight: 120,
    maxHeight: 200,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  helperText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  counter: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  counterLimit: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
});

