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
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { reportService } from '../services/report.service';
import { spacing, typography, useColors } from '../styles/theme';

export default function ContactSupportScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || submitting) return;

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (trimmedSubject.length < 4 || trimmedMessage.length < 12) {
      Alert.alert('More detail needed', 'Add a short subject and a clear message before sending.');
      return;
    }

    try {
      setSubmitting(true);
      await reportService.submitSupportMessage(
        user.userId,
        user.username,
        trimmedSubject,
        trimmedMessage,
        user.email,
        Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web' ? Platform.OS : 'unknown'
      );
      Alert.alert('Sent', 'Support has received your message.');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to contact support:', error);
      Alert.alert('Send failed', 'Support could not be reached right now. Try again shortly.');
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
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer as any} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Human support intake</Text>
          <Text style={styles.heroText}>
            Use this when you need account help, moderation follow-up, or assistance that does not fit a bug report.
          </Text>
          <View style={styles.heroPillRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>No background sync</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>One ticket</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="What do you need help with?"
              placeholderTextColor={c.text.muted}
              maxLength={120}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message</Text>
          <View style={styles.textAreaCard}>
            <TextInput
              style={styles.textArea}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the issue, account state, and what you already tried."
              placeholderTextColor={c.text.muted}
              multiline
              textAlignVertical="top"
              maxLength={1500}
            />
            <Text style={styles.counter}>{message.trim().length}/1500</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="mail-open" size={18} color={c.accent.primary} />
          <Text style={styles.tipText}>Responses can only help if the message includes the affected screen or account action.</Text>
        </View>

        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.82}>
          {submitting ? <ButtonLoadingSkeleton width={88} /> : <Text style={styles.submitButtonText}>Send Message</Text>}
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
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700' as any,
      color: c.text.muted,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      paddingHorizontal: 4,
    },
    inputCard: {
      backgroundColor: c.background.tertiary,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border.subtle,
      paddingHorizontal: spacing.lg,
      minHeight: 56,
      justifyContent: 'center',
    },
    input: { color: c.text.primary, fontSize: typography.fontSize.base },
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
