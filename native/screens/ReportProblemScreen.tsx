import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { reportService } from '../services/report.service';
import { spacing, typography, useColors } from '../styles/theme';
import { Image } from 'expo-image';

const CATEGORIES = [
  { key: 'bug', label: 'Bug', icon: 'bug' as const },
  { key: 'upload', label: 'Upload', icon: 'cloud-upload' as const },
  { key: 'notifications', label: 'Notifications', icon: 'notifications' as const },
  { key: 'messages', label: 'Messages', icon: 'chatbubbles' as const },
  { key: 'performance', label: 'Performance', icon: 'speedometer' as const },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle' as const },
];

type ReportAttachment = {
  uri: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
};

export default function ReportProblemScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [category, setCategory] = useState('bug');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);

  const handlePickAttachments = async () => {
    if (picking) return;

    try {
      setPicking(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo library permission to attach screenshots.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 4,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const next = result.assets.map((asset, index) => ({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `screenshot_${Date.now()}_${index + 1}.jpg`,
        sizeBytes: asset.fileSize,
      }));

      setAttachments((prev) => {
        const merged = [...prev];
        for (const item of next) {
          if (!merged.some((entry) => entry.uri === item.uri)) {
            merged.push(item);
          }
        }
        return merged.slice(0, 4);
      });
    } catch (error) {
      console.error('Failed to pick screenshots:', error);
      Alert.alert('Could not attach', 'Screenshot picker failed. Please try again.');
    } finally {
      setPicking(false);
    }
  };

  const handleRemoveAttachment = (uri: string) => {
    setAttachments((prev) => prev.filter((item) => item.uri !== uri));
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;

    const trimmed = description.trim();
    if (trimmed.length < 12) {
      Alert.alert('More detail needed', 'Describe the issue in a little more detail so it can be reproduced.');
      return;
    }

    try {
      setSubmitting(true);
      await reportService.submitProblemReport(
        user.userId,
        user.username,
        category,
        trimmed,
        Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web' ? Platform.OS : 'unknown',
        attachments
      );
      Alert.alert('Submitted', 'Your report has been sent to support.');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to submit problem report:', error);
      Alert.alert('Submission failed', 'The report could not be sent right now. Try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report a Problem</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer as any} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Direct issue intake</Text>
          <Text style={styles.heroText}>
            Send broken flows, upload failures, notification issues, or UI regressions in one write. You can attach screenshots for faster triage.
          </Text>
          <View style={styles.heroPillRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>Android-safe</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>Screenshots ready</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((item) => {
              const active = category === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(item.key)}
                  activeOpacity={0.82}
                >
                  <Ionicons name={item.icon} size={16} color={active ? c.text.primary : c.text.secondary} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Screenshots</Text>
            <Text style={styles.sectionMeta}>{attachments.length}/4</Text>
          </View>
          <View style={styles.attachmentRow}>
            <TouchableOpacity
              style={[styles.attachButton, attachments.length >= 4 && styles.attachButtonDisabled]}
              onPress={handlePickAttachments}
              disabled={attachments.length >= 4 || picking}
              activeOpacity={0.85}
            >
              <Ionicons name="images-outline" size={18} color={c.text.primary} />
              <Text style={styles.attachButtonText}>{picking ? 'Picking...' : 'Add images'}</Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentPreviewRow as any}>
              {attachments.map((item) => (
                <View key={item.uri} style={styles.attachmentCard}>
                  <Image source={{ uri: item.uri }} style={styles.attachmentImage} contentFit="cover" />
                  <TouchableOpacity style={styles.removeAttachmentButton} onPress={() => handleRemoveAttachment(item.uri)} activeOpacity={0.85}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.textAreaCard}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="What happened, what you expected, and which screen or action triggered it?"
              placeholderTextColor={c.text.muted}
              multiline
              textAlignVertical="top"
              maxLength={1200}
            />
            <Text style={styles.counter}>{description.trim().length}/1200</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={18} color={c.accent.primary} />
          <Text style={styles.tipText}>Include device state, action path, and whether the issue is only in Android release.</Text>
        </View>

        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.82}>
          {submitting ? <ButtonLoadingSkeleton width={92} /> : <Text style={styles.submitButtonText}>Submit Report</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background.primary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border.subtle,
    },
    headerButton: { width: 28, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' as any, color: c.text.primary },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
    heroCard: {
      backgroundColor: c.background.tertiary,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border.subtle,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
    heroTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' as any, color: c.text.primary, marginBottom: 6 },
    heroText: { fontSize: typography.fontSize.sm, lineHeight: 20, color: c.text.secondary, marginBottom: spacing.md },
    heroPillRow: { flexDirection: 'row', flexWrap: 'wrap' },
    heroPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      marginRight: spacing.sm,
      marginBottom: spacing.xs,
      backgroundColor: c.background.secondary,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    heroPillText: { fontSize: 12, fontWeight: '700' as any, color: c.text.primary },
    section: { marginBottom: spacing.xl },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      paddingHorizontal: 4,
    },
    sectionMeta: {
      fontSize: typography.fontSize.xs,
      color: c.text.muted,
      fontWeight: '700' as any,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700' as any,
      color: c.text.muted,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      paddingHorizontal: 4,
    },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.background.tertiary,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    chipActive: {
      backgroundColor: `${c.accent.primary}22`,
      borderColor: `${c.accent.primary}55`,
    },
    chipText: { marginLeft: 8, fontSize: typography.fontSize.sm, fontWeight: '600' as any, color: c.text.secondary },
    chipTextActive: { color: c.text.primary },
    attachmentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    attachButton: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border.subtle,
      backgroundColor: c.background.tertiary,
    },
    attachButtonDisabled: {
      opacity: 0.5,
    },
    attachButtonText: {
      marginLeft: 8,
      fontSize: typography.fontSize.sm,
      color: c.text.primary,
      fontWeight: '600' as any,
    },
    attachmentPreviewRow: {
      paddingTop: spacing.xs,
      paddingRight: spacing.md,
    },
    attachmentCard: {
      width: 86,
      height: 86,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border.subtle,
      overflow: 'hidden',
      marginRight: spacing.sm,
      backgroundColor: c.background.tertiary,
    },
    attachmentImage: {
      width: '100%',
      height: '100%',
    },
    removeAttachmentButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.58)',
    },
    textAreaCard: {
      backgroundColor: c.background.tertiary,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border.subtle,
      padding: spacing.lg,
    },
    textArea: {
      minHeight: 180,
      color: c.text.primary,
      fontSize: typography.fontSize.base,
      lineHeight: 22,
    },
    counter: {
      marginTop: spacing.sm,
      textAlign: 'right',
      color: c.text.muted,
      fontSize: typography.fontSize.xs,
      fontWeight: '600' as any,
    },
    tipCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: c.background.tertiary,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border.subtle,
      padding: spacing.md,
      marginBottom: spacing.xl,
    },
    tipText: {
      flex: 1,
      marginLeft: spacing.sm,
      fontSize: typography.fontSize.sm,
      lineHeight: 20,
      color: c.text.secondary,
    },
    submitButton: {
      height: 54,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.accent.primary,
    },
    submitButtonDisabled: { opacity: 0.72 },
    submitButtonText: { color: '#FFFFFF', fontSize: typography.fontSize.base, fontWeight: '700' as any },
  });
