import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  collection,
  DocumentSnapshot,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FlashList } from '@shopify/flash-list';

type ChatMessageSearchRouteProp = RouteProp<
  { ChatMessageSearch: { conversationId: string; userId?: string } },
  'ChatMessageSearch'
>;

type MessageRow = {
  messageId: string;
  senderId: string;
  senderUsername?: string;
  text?: string;
  type?: string;
  createdAt?: any;
  deletedFor?: string[];
  isUnsent?: boolean;
  poll?: { question?: string };
  location?: { label?: string; name?: string; address?: string };
};

type ResultRow = {
  messageId: string;
  preview: string;
  sender: string;
  icon: any;
};

const makePreview = (msg: MessageRow): string => {
  if (msg.isUnsent) return 'Message removed';
  if (msg.type === 'poll') return msg.poll?.question || 'Poll';
  if (msg.type === 'location') return (msg.location?.name || msg.location?.address || msg.location?.label) || 'Location';
  const raw = (msg.text || '').trim();
  if (raw.length === 0) return msg.type ? String(msg.type) : 'Message';
  return raw.length > 90 ? raw.slice(0, 90) + '…' : raw;
};

export default function ChatMessageSearchScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatMessageSearchRouteProp>();
  const { user } = useAuth();

  const conversationId = route.params?.conversationId;
  const otherUserId = route.params?.userId;

  const [queryText, setQueryText] = useState('');
  const [mode, setMode] = useState<'all' | 'text' | 'media' | 'links' | 'user'>('all');
  const [userScope, setUserScope] = useState<'all' | 'me' | 'other'>('all');
  const [results, setResults] = useState<ResultRow[]>([]);
  const [scanned, setScanned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const cursorRef = useRef<DocumentSnapshot | null>(null);
  const pagesRef = useRef(0);
  const activeTokenRef = useRef(0);

  const needle = useMemo(() => queryText.trim().toLowerCase(), [queryText]);

  const reset = useCallback(() => {
    cursorRef.current = null;
    pagesRef.current = 0;
    setResults([]);
    setScanned(0);
    setHasMore(true);
  }, []);

  useEffect(() => {
    reset();
  }, [conversationId, needle, mode, userScope, reset]);

  const allowEmptySearch = useMemo(() => {
    if (mode === 'media' || mode === 'links') return true;
    if (mode === 'user' && userScope !== 'all') return true;
    return false;
  }, [mode, userScope]);

  const shouldScan = useMemo(() => {
    if (!conversationId || !user) return false;
    if (allowEmptySearch) return true;
    return needle.length > 0;
  }, [allowEmptySearch, conversationId, needle, user]);

  const fetchNextPage = useCallback(async () => {
    if (!conversationId || !user) return;
    if (!shouldScan) return;
    if (!hasMore || loading) return;

    const token = ++activeTokenRef.current;
    setLoading(true);

    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const pageSize = 30;

      const q = cursorRef.current
        ? query(messagesRef, orderBy('createdAt', 'desc'), startAfter(cursorRef.current), limit(pageSize))
        : query(messagesRef, orderBy('createdAt', 'desc'), limit(pageSize));

      const snap = await getDocs(q);
      if (activeTokenRef.current !== token) return;

      const docs = snap.docs;
      if (docs.length > 0) {
        cursorRef.current = docs[docs.length - 1];
      }

      pagesRef.current += 1;
      setScanned((prev) => prev + docs.length);

      const matches: ResultRow[] = [];
      for (const d of docs) {
        const msg = d.data() as MessageRow;
        const messageId = msg?.messageId || d.id;
        if (!messageId) continue;

        const deletedFor = Array.isArray(msg.deletedFor) ? msg.deletedFor : [];
        if (deletedFor.includes(user.userId)) continue;

        const textHay =
          [
            msg.text,
            msg.senderUsername,
            msg.poll?.question,
            (msg.location?.name || msg.location?.address || msg.location?.label),
            msg.type,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        const isMedia = Boolean((msg as any).mediaURL) || ['media', 'gif', 'sticker', 'shared_post', 'shared_glimpse', 'shared_story'].includes(String(msg.type || ''));
        const isLink = typeof msg.text === 'string' && /(https?:\/\/|www\.)/i.test(msg.text);
        const isText = typeof msg.text === 'string' && msg.text.trim().length > 0;
        const senderName = (msg.senderUsername || '').toLowerCase();
        const senderMatch =
          userScope === 'all'
            ? true
            : userScope === 'me'
              ? msg.senderId === user.userId
              : msg.senderId !== user.userId;
        const needleMatch = needle.length === 0 ? true : textHay.includes(needle) || senderName.includes(needle);

        let passes = false;
        if (mode === 'all') {
          passes = needleMatch;
        } else if (mode === 'text') {
          passes = isText && needleMatch;
        } else if (mode === 'media') {
          passes = isMedia && needleMatch;
        } else if (mode === 'links') {
          passes = isLink && (needle.length === 0 ? true : textHay.includes(needle));
        } else if (mode === 'user') {
          passes = senderMatch && (needle.length === 0 ? true : senderName.includes(needle));
        }

        if (!passes) continue;

        const icon =
          msg.type === 'poll'
            ? 'stats-chart-outline'
            : msg.type === 'location'
              ? 'location-outline'
              : isLink
                ? 'link-outline'
                : isMedia
                  ? 'image-outline'
                  : 'chatbubble-outline';

        matches.push({
          messageId,
          preview: makePreview(msg),
          sender: msg.senderId === user.userId ? 'You' : msg.senderUsername || 'User',
          icon,
        });
      }

      setResults((prev) => {
        const seen = new Set(prev.map((r) => r.messageId));
        const next = [...prev];
        for (const m of matches) {
          if (!seen.has(m.messageId)) next.push(m);
        }
        return next;
      });

      // Stop after a few pages to avoid heavy scans; user can tap "Scan more".
      if (docs.length < pageSize) {
        setHasMore(false);
      } else if (pagesRef.current >= 12) {
        setHasMore(false);
      }
    } catch (e) {
      // Silently stop scanning to avoid UI loops; user can retry by editing query.
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [conversationId, hasMore, loading, needle, user]);

  useEffect(() => {
    if (!shouldScan) return;
    fetchNextPage();
  }, [fetchNextPage, shouldScan]);

  const onSelectResult = useCallback(
    (messageId: string) => {
      (navigation as any).navigate('Chat', {
        conversationId,
        userId: otherUserId,
        scrollToMessageId: messageId,
      });
    },
    [conversationId, navigation, otherUserId]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#64748b" />
        <TextInput
          value={queryText}
          onChangeText={setQueryText}
          placeholder="Search in chat..."
          placeholderTextColor="#64748b"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {queryText.length > 0 ? (
          <TouchableOpacity onPress={() => setQueryText('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All' },
          { key: 'text', label: 'Text' },
          { key: 'media', label: 'Media' },
          { key: 'links', label: 'Links' },
          { key: 'user', label: 'User' },
        ].map((item) => {
          const active = mode === (item.key as any);
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setMode(item.key as any)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode === 'user' ? (
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All users' },
            { key: 'me', label: 'Me' },
            { key: 'other', label: 'Other' },
          ].map((item) => {
            const active = userScope === (item.key as any);
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setUserScope(item.key as any)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {shouldScan ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Found {results.length} · Scanned {scanned}
          </Text>
          {loading ? <InlineLoadingSkeleton /> : null}
        </View>
      ) : (
        <View style={styles.hint}>
          <Ionicons name="chatbubble-ellipses-outline" size={44} color="#334155" />
          <Text style={styles.hintTitle}>Search messages</Text>
          <Text style={styles.hintText}>
            {allowEmptySearch ? 'Scanning this chat.' : 'Type a keyword to scan this chat.'}
          </Text>
        </View>
      )}

      <FlashList estimatedItemSize={100}
        data={results}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={(results.length === 0 ? styles.listEmpty : styles.list) as any}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultRow} onPress={() => onSelectResult(item.messageId)} activeOpacity={0.85}>
            <View style={styles.resultIcon}>
              <Ionicons name={item.icon} size={16} color="#38bdf8" />
            </View>
            <View style={styles.resultText}>
              <Text style={styles.resultSender}>{item.sender}</Text>
              <Text style={styles.resultPreview} numberOfLines={2}>
                {item.preview}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748b" />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          needle ? (
            <View style={styles.footer}>
              {hasMore ? (
                <TouchableOpacity
                  style={styles.scanMore}
                  onPress={fetchNextPage}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Ionicons name="refresh" size={16} color="#bae6fd" />
                  <Text style={styles.scanMoreText}>{loading ? 'Scanning…' : 'Scan more'}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.footerText}>End of results</Text>
              )}
            </View>
          ) : null
        }
      />
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
  searchWrap: {
    margin: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: '#0f172a',
  },
  filterChipActive: {
    borderColor: 'rgba(56, 189, 248, 0.45)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#bae6fd',
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  clearBtn: {
    padding: 2,
  },
  metaRow: {
    marginHorizontal: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
    gap: 8,
  },
  hintTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '800',
  },
  hintText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  listEmpty: {
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#111827',
    marginBottom: 10,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
  },
  resultText: {
    flex: 1,
  },
  resultSender: {
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  resultPreview: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  scanMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
  },
  scanMoreText: {
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: '800',
  },
  footerText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
});



