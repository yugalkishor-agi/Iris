import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { onSnapshot, doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { messageService } from '../services/message.service';
import { settingsService } from '../services/settings.service';
import type { User, Message } from '../types/database';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

type ChatProfileRoute = RouteProp<{ ChatProfile: { userId: string; conversationId?: string } }, 'ChatProfile'>;

type ShareTab = 'glimpses' | 'links' | 'images';

type ThemeOption = { key: string; label: string; swatch: string };

const THEME_OPTIONS: ThemeOption[] = [
  { key: 'nebula', label: 'Nebula Glow', swatch: '#a855f7' },
  { key: 'lagoon', label: 'Lagoon Blue', swatch: '#38bdf8' },
  { key: 'ember', label: 'Ember Gold', swatch: '#f59e0b' },
  { key: 'mint', label: 'Mint Pulse', swatch: '#34d399' },
];

const DISAPPEARING_OPTIONS = [
  { label: 'Off', value: null },
  { label: '24 hours', value: 1440 },
  { label: '7 days', value: 10080 },
];

export default function ChatProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatProfileRoute>();
  const { user } = useAuth();
  const { userId, conversationId } = route.params || {};

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [nicknameModal, setNicknameModal] = useState(false);
  const [optionsModal, setOptionsModal] = useState(false);
  const [themeModal, setThemeModal] = useState(false);
  const [disappearModal, setDisappearModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('nebula');
  const [disappearMinutes, setDisappearMinutes] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  const [activeTab, setActiveTab] = useState<ShareTab>('glimpses');
  const [sharedImages, setSharedImages] = useState<string[]>([]);
  const [sharedLinks, setSharedLinks] = useState<string[]>([]);
  const [sharedGlimpses, setSharedGlimpses] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    userService.getUser(userId).then(setProfileUser).catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    if (!conversationId || !user?.userId) return;
    const unsubscribe = onSnapshot(doc(db, 'conversations', conversationId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;
      const nicknames = data.nicknames || {};
      const theme = data.chatThemes?.[user.userId];
      setCurrentTheme(typeof theme === 'string' ? theme : 'nebula');
      const disappear = typeof data.disappearingBy?.[user.userId] === 'number' ? data.disappearingBy[user.userId] : null;
      const archivedBy = data.archivedBy || [];
      const restrictedBy = data.restrictedBy || [];
      const nickValue = nicknames[user.userId];
      setNickname(typeof nickValue === 'string' ? nickValue : '');
      setDisappearMinutes(disappear);
      setIsRestricted(restrictedBy.includes(user.userId));
      setIsArchived(archivedBy.includes(user.userId));
    });
    return unsubscribe;
  }, [conversationId, user?.userId]);

  useEffect(() => {
    if (!user?.userId || !userId) return;
    settingsService.isUserBlocked(user.userId, userId).then(setIsBlocked).catch(() => undefined);
  }, [user?.userId, userId]);

  useEffect(() => {
    if (!conversationId) return;
    const loadShared = async () => {
      try {
        const messages = await messageService.getConversationMessages(conversationId, 200);
        const images: string[] = [];
        const links: string[] = [];
        const glimpses: string[] = [];

        const urlRegex = /(https?:\/\/[^\s]+)/g;

        messages.forEach((msg: Message) => {
          const m = msg as any;
          const type = msg.type || (msg.mediaType ? 'media' : 'text');
          const mediaType = msg.mediaType || msg.type;
          if ((type === 'media' && mediaType === 'image') || mediaType === 'image') {
            if (msg.mediaURL) images.push(msg.mediaURL);
          }
          if (msg.text) {
            const found = msg.text.match(urlRegex) || [];
            found.forEach((u) => links.push(u));
          }
          if (type === 'shared_glimpse' || type === 'glimpse_collab_request' || m.sharedContent?.type === 'glimpse') {
            const cover = m.sharedContent?.coverImage || m.sharedContent?.coverImageURL || msg.thumbnailURL || msg.mediaURL;
            if (cover) glimpses.push(cover);
          }
        });

        setSharedImages(Array.from(new Set(images)));
        setSharedLinks(Array.from(new Set(links)));
        setSharedGlimpses(Array.from(new Set(glimpses)));
      } catch (e) {
        console.error('Failed to load shared content', e);
      }
    };
    loadShared();
  }, [conversationId]);

  const safeNickname = typeof nickname === 'string' ? nickname : '';
  const displayName = safeNickname || profileUser?.displayName || profileUser?.username || 'User';

  const handleSaveNickname = async () => {
    if (!conversationId || !user?.userId) return;
    const trimmed = nicknameDraft.trim();
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        [`nicknames.${user.userId}`]: trimmed ? trimmed : deleteField(),
        updatedAt: serverTimestamp(),
      });
      setNickname(trimmed);
      setNicknameModal(false);
    } catch {
      Alert.alert('Error', 'Failed to update nickname');
    }
  };

  const handleRestrict = async () => {
    if (!conversationId || !user?.userId) return;
    try {
      if (isRestricted) {
        await messageService.unrestrictConversation(conversationId, user.userId);
        setIsRestricted(false);
      } else {
        await messageService.restrictConversation(conversationId, user.userId);
        setIsRestricted(true);
      }
      setOptionsModal(false);
    } catch {
      Alert.alert('Error', 'Unable to update restrict settings');
    }
  };

  const handleBlock = async () => {
    if (!user?.userId || !userId) return;
    try {
      if (isBlocked) {
        await settingsService.unblockUser(user.userId, userId);
        setIsBlocked(false);
      } else {
        await settingsService.blockUser(user.userId, userId);
        setIsBlocked(true);
      }
      setOptionsModal(false);
    } catch {
      Alert.alert('Error', 'Unable to update block settings');
    }
  };

  const handleArchive = async () => {
    if (!conversationId || !user?.userId) return;
    try {
      if (isArchived) {
        await messageService.unarchiveConversation(conversationId, user.userId);
        setIsArchived(false);
      } else {
        await messageService.archiveConversation(conversationId, user.userId);
        setIsArchived(true);
      }
      setOptionsModal(false);
    } catch {
      Alert.alert('Error', 'Unable to update archive settings');
    }
  };

  const handleReport = () => {
    setOptionsModal(false);
    (navigation as any).navigate('Report', { contentType: 'user', contentId: userId, authorId: userId, authorUsername: profileUser?.username });
  };

  const handleThemeSelect = async (key: string) => {
    if (!conversationId || !user?.userId) return;
    try {
      await messageService.setChatTheme(conversationId, user.userId, key);
      setCurrentTheme(key);
      setThemeModal(false);
    } catch {
      Alert.alert('Error', 'Failed to update theme');
    }
  };

  const handleDisappearSelect = async (minutes: number | null) => {
    if (!conversationId || !user?.userId) return;
    try {
      await messageService.setDisappearingMessages(conversationId, user.userId, minutes);
      setDisappearMinutes(minutes);
      setDisappearModal(false);
    } catch {
      Alert.alert('Error', 'Failed to update disappearing messages');
    }
  };

  const renderGrid = (data: string[]) => (
    <FlashList estimatedItemSize={100}
      data={data}
      keyExtractor={(item, index) => `${item}-${index}`}
      numColumns={3}
      scrollEnabled={false}
      contentContainerStyle={styles.grid as any}
      renderItem={({ item }) => (
        <View style={styles.gridItem}>
          <Image source={{ uri: item }} style={styles.gridImage} />
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No items yet</Text>}
    />
  );

  const renderLinks = () => (
    <View style={styles.linksWrap}>
      {sharedLinks.length === 0 ? (
        <Text style={styles.emptyText}>No links yet</Text>
      ) : (
        sharedLinks.map((link) => (
          <TouchableOpacity key={link} onPress={() => Linking.openURL(link)} style={styles.linkRow}>
            <Ionicons name="link-outline" size={16} color="#e2e8f0" />
            <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content as any}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#e2e8f0" />
        </TouchableOpacity>
      </View>

      <View style={styles.centerHeader}>
        <View style={styles.avatarRing}>
          <Image source={{ uri: profileUser?.avatarURL || '' }} style={styles.avatar} />
        </View>
        <Text style={styles.nameText}>{displayName}</Text>
        {profileUser?.username ? <Text style={styles.usernameText}>@{profileUser.username}</Text> : null}
      </View>

      <View style={styles.card}>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => (navigation as any).navigate('UserProfile', { userId })}>
            <View style={styles.quickIcon}><Ionicons name="person-outline" size={20} color="#e2e8f0" /></View>
            <Text style={styles.quickLabel}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => { if (!conversationId) { Alert.alert('Unavailable', 'Chat search not ready yet.'); return; } (navigation as any).navigate('ChatMessageSearch', { conversationId }); }}>
            <View style={styles.quickIcon}><Ionicons name="search-outline" size={20} color="#e2e8f0" /></View>
            <Text style={styles.quickLabel}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Mute', 'Mute settings coming soon.')}>
            <View style={styles.quickIcon}><Ionicons name="notifications-off-outline" size={20} color="#e2e8f0" /></View>
            <Text style={styles.quickLabel}>Mute</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => setOptionsModal(true)}>
            <View style={styles.quickIcon}><Ionicons name="ellipsis-horizontal" size={20} color="#e2e8f0" /></View>
            <Text style={styles.quickLabel}>Options</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.list}>
          <TouchableOpacity style={styles.row} onPress={() => setThemeModal(true)}>
            <View style={styles.rowLeft}>
              <View style={[styles.colorDot, { backgroundColor: THEME_OPTIONS.find((t) => t.key === currentTheme)?.swatch || '#a855f7' }]} />
              <Text style={styles.rowText}>Theme</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowSub}>{THEME_OPTIONS.find((t) => t.key === currentTheme)?.label || 'Nebula Glow'}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => setDisappearModal(true)}>
            <View style={styles.rowLeft}>
              <Ionicons name="time-outline" size={20} color="#e2e8f0" />
              <Text style={styles.rowText}>Disappearing messages</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowSub}>{disappearMinutes ? `${Math.floor(disappearMinutes / 60)}h` : 'Off'}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => (navigation as any).navigate('ChatPrivacySafety', { userId })}>
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#e2e8f0" />
              <Text style={styles.rowText}>Privacy & safety</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => { setNicknameDraft(safeNickname); setNicknameModal(true); }}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color="#e2e8f0" />
              <Text style={styles.rowText}>Nicknames</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowSub}>{safeNickname ? safeNickname : 'Add'}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => { if (!userId) return; (navigation as any).navigate('NewGroup', { initialMemberIds: [userId] }); }}>
            <View style={styles.rowLeft}>
              <Ionicons name="people-outline" size={20} color="#e2e8f0" />
              <Text style={styles.rowText}>Create a group chat</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sharedSection}>
          <Text style={styles.sectionTitle}>Shared in chat</Text>
          <View style={styles.shareTabs}>
            <TouchableOpacity style={[styles.shareTab, activeTab === 'glimpses' && styles.shareTabActive]} onPress={() => setActiveTab('glimpses')}>
              <Ionicons name="videocam-outline" size={18} color={activeTab === 'glimpses' ? '#0b1220' : '#94a3b8'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareTab, activeTab === 'links' && styles.shareTabActive]} onPress={() => setActiveTab('links')}>
              <Ionicons name="link-outline" size={18} color={activeTab === 'links' ? '#0b1220' : '#94a3b8'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareTab, activeTab === 'images' && styles.shareTabActive]} onPress={() => setActiveTab('images')}>
              <Ionicons name="images-outline" size={18} color={activeTab === 'images' ? '#0b1220' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
          {activeTab === 'glimpses' && renderGrid(sharedGlimpses)}
          {activeTab === 'links' && renderLinks()}
          {activeTab === 'images' && renderGrid(sharedImages)}
        </View>
      </View>

      <Modal transparent visible={nicknameModal} animationType="fade" onRequestClose={() => setNicknameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set nickname</Text>
            <TextInput
              value={nicknameDraft}
              onChangeText={setNicknameDraft}
              placeholder="Nickname"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalButtonGhost} onPress={() => setNicknameModal(false)}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleSaveNickname}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={optionsModal} animationType="fade" onRequestClose={() => setOptionsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Options</Text>
            <TouchableOpacity style={styles.optionRow} onPress={handleRestrict}>
              <Text style={styles.optionText}>{isRestricted ? 'Unrestrict' : 'Restrict'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={handleBlock}>
              <Text style={styles.optionText}>{isBlocked ? 'Unblock' : 'Block'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={handleArchive}>
              <Text style={styles.optionText}>{isArchived ? 'Unarchive' : 'Archive'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={handleReport}>
              <Text style={[styles.optionText, styles.dangerText]}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={() => setOptionsModal(false)}>
              <Text style={styles.optionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={themeModal} animationType="fade" onRequestClose={() => setThemeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Theme</Text>
            {THEME_OPTIONS.map((t) => (
              <TouchableOpacity key={t.key} style={styles.optionRow} onPress={() => handleThemeSelect(t.key)}>
                <View style={[styles.colorDot, { backgroundColor: t.swatch }]} />
                <Text style={styles.optionText}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={disappearModal} animationType="fade" onRequestClose={() => setDisappearModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Disappearing messages</Text>
            {DISAPPEARING_OPTIONS.map((t) => (
              <TouchableOpacity key={t.label} style={styles.optionRow} onPress={() => handleDisappearSelect(t.value as any)}>
                <Text style={styles.optionText}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  content: { paddingHorizontal: 18, paddingBottom: 40 },
  headerRow: { paddingTop: 8, paddingBottom: 6 },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' },
  centerHeader: { alignItems: 'center', marginTop: 10, marginBottom: 14 },
  avatarRing: { padding: 4, borderRadius: 60, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#1f2937' },
  nameText: { marginTop: 10, fontSize: 20, fontWeight: '700', color: '#e2e8f0' },
  usernameText: { marginTop: 2, fontSize: 12, color: '#94a3b8' },
  card: { backgroundColor: '#0f172a', borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#1e293b', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', gap: 6, width: 72 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1f2937' },
  quickLabel: { fontSize: 12, color: '#cbd5e1' },
  list: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 15, color: '#e2e8f0', fontWeight: '600' },
  rowSub: { fontSize: 12, color: '#94a3b8' },
  colorDot: { width: 18, height: 18, borderRadius: 9 },
  sharedSection: { marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 10 },
  shareTabs: { flexDirection: 'row', gap: 8, marginBottom: 10, backgroundColor: '#111827', borderRadius: 999, padding: 4, borderWidth: 1, borderColor: '#1f2937' },
  shareTab: { width: 42, height: 32, borderRadius: 999, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  shareTabActive: { backgroundColor: '#38bdf8' },
  grid: { paddingBottom: 8 },
  gridItem: { flex: 1, aspectRatio: 1, margin: 4, borderRadius: 10, overflow: 'hidden', backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' },
  gridImage: { width: '100%', height: '100%' },
  emptyText: { color: '#94a3b8', fontSize: 12, paddingVertical: 12 },
  linksWrap: { paddingVertical: 4 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  linkText: { color: '#e2e8f0', fontSize: 13, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#e2e8f0', marginBottom: 12, backgroundColor: '#111827' },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { backgroundColor: '#38bdf8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  modalButtonText: { color: '#0b1220', fontWeight: '700' },
  modalButtonGhost: { paddingHorizontal: 12, paddingVertical: 8 },
  modalGhostText: { color: '#94a3b8' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  optionText: { fontSize: 15, color: '#e2e8f0', fontWeight: '500' },
  dangerText: { color: '#f87171' },
});






