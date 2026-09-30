import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { reportService, REPORT_CATEGORIES } from '../services/report.service';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';

type ChatPrivacySafetyRouteProp = RouteProp<
  { ChatPrivacySafety: { userId: string; username?: string } },
  'ChatPrivacySafety'
>;

export default function ChatPrivacySafetyScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatPrivacySafetyRouteProp>();
  const { user } = useAuth();

  const targetUserId = route.params?.userId;
  const targetUsername = route.params?.username || 'User';

  const [working, setWorking] = useState(false);

  const categories = useMemo(() => {
    return Object.entries(REPORT_CATEGORIES).map(([key, value]) => ({
      key,
      label: value.label,
      subcategories: value.subcategories || [],
    }));
  }, []);

  const onReport = useCallback(() => {
    if (!user || !targetUserId) return;
    Alert.alert('Report', `Report ${targetUsername}`, [
      { text: 'Cancel', style: 'cancel' },
      ...categories.slice(0, 6).map((c) => ({
        text: c.label,
        onPress: async () => {
          try {
            setWorking(true);
            await reportService.reportUser(targetUserId, user.userId, user.username, c.key);
            Alert.alert('Thanks', 'Your report has been submitted.');
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Unable to submit report');
          } finally {
            setWorking(false);
          }
        },
      })),
      {
        text: 'More…',
        onPress: () => {
          Alert.alert('Choose category', 'Select a category', [
            { text: 'Cancel', style: 'cancel' },
            ...categories.map((c) => ({
              text: c.label,
              onPress: async () => {
                try {
                  setWorking(true);
                  await reportService.reportUser(targetUserId, user.userId, user.username, c.key);
                  Alert.alert('Thanks', 'Your report has been submitted.');
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Unable to submit report');
                } finally {
                  setWorking(false);
                }
              },
            })),
          ]);
        },
      },
    ]);
  }, [categories, targetUserId, targetUsername, user]);

  const onBlock = useCallback(() => {
    if (!user || !targetUserId) return;
    Alert.alert('Block user', `Block ${targetUsername}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            setWorking(true);
            await userService.blockUser(user.userId, targetUserId);
            Alert.alert('Blocked', `${targetUsername} has been blocked.`);
            (navigation as any).goBack();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Unable to block');
          } finally {
            setWorking(false);
          }
        },
      },
    ]);
  }, [navigation, targetUserId, targetUsername, user]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & safety</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content as any}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Controls</Text>

          <TouchableOpacity style={styles.row} onPress={onReport} disabled={working}>
            <View style={styles.rowIcon}>
              <Ionicons name="flag-outline" size={18} color="#e2e8f0" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Report</Text>
              <Text style={styles.rowSub}>Tell us what happened</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, styles.rowDanger]} onPress={onBlock} disabled={working}>
            <View style={[styles.rowIcon, styles.rowIconDanger]}>
              <Ionicons name="ban-outline" size={18} color="#fecaca" />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, styles.rowTitleDanger]}>Block</Text>
              <Text style={styles.rowSub}>They won’t be able to message you</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    padding: 14,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#111827',
    padding: 14,
  },
  cardTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#111827',
    marginTop: 10,
  },
  rowDanger: {
    borderColor: 'rgba(248, 113, 113, 0.25)',
    backgroundColor: 'rgba(248, 113, 113, 0.06)',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  rowIconDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  rowTitleDanger: {
    color: '#fecaca',
  },
  rowSub: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
});

