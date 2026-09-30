import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { auth, db, storage } from '../config/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

type Result = { name: string; ok: boolean; detail?: string; ms: number };

export default function BackendDiagnosticsScreen() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const run = async (name: string, fn: () => Promise<string | void>): Promise<Result> => {
    const t0 = Date.now();
    try {
      const detail = await fn();
      return { name, ok: true, detail: detail || 'ok', ms: Date.now() - t0 };
    } catch (e: any) {
      return { name, ok: false, detail: e?.message || String(e), ms: Date.now() - t0 };
    }
  };

  const testConversationsIndex = async () => {
    try {
      const uid = auth.currentUser?.uid || 'test_uid_probe';
      const q = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', uid),
        orderBy('lastMessageAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      return `count=${snap.size}`;
    } catch (e: any) {
      if (e?.code === 'failed-precondition') throw new Error('missing composite index for conversations(participantIds array-contains, lastMessageAt)');
      throw e;
    }
  };

  const testAuth = async () => {
    const u = auth.currentUser;
    if (!u) return 'no current user';
    const token = await u.getIdToken(true);
    return `uid=${u.uid} tokenLen=${token.length}`;
  };

  const testFirestoreWriteRead = async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const col = collection(db, 'users', uid, 'diagnostics');
      const created = await addDoc(col, { createdAt: serverTimestamp(), t: Date.now(), uid });
      const snap = await getDoc(doc(db, 'users', uid, 'diagnostics', created.id));
      await deleteDoc(doc(db, 'users', uid, 'diagnostics', created.id));
      if (!snap.exists()) throw new Error('doc not found');
      return `id=${created.id}`;
    } else {
      const col = collection(db, 'diagnostics');
      const created = await addDoc(col, { createdAt: serverTimestamp(), t: Date.now(), uid: null });
      const snap = await getDoc(doc(db, 'diagnostics', created.id));
      await deleteDoc(doc(db, 'diagnostics', created.id));
      if (!snap.exists()) throw new Error('doc not found');
      return `id=${created.id}`;
    }
  };

  const testPostsQuery = async () => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(5));
    const snap = await getDocs(q);
    return `count=${snap.size}`;
  };

  const testNotificationsIndex = async () => {
    try {
      const uid = auth.currentUser?.uid || 'test_uid_probe';
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      return `count=${snap.size}`;
    } catch (e: any) {
      if (e?.code === 'failed-precondition') throw new Error('missing composite index for notifications(userId, createdAt)');
      throw e;
    }
  };

  const testStorageUpload = async () => {
    const path = `diagnostics/test_${Date.now()}.txt`;
    const r = ref(storage, path);
    await uploadString(r, 'hello', 'raw');
    const url = await getDownloadURL(r);
    await deleteObject(r);
    return `ok urlLen=${url.length}`;
  };

  const runAll = async () => {
    setRunning(true);
    const out: Result[] = [];
    out.push(await run('Auth', testAuth));
    out.push(await run('Firestore: write/read', testFirestoreWriteRead));
    out.push(await run('Firestore: posts query', testPostsQuery));
    out.push(await run('Firestore: notifications index', testNotificationsIndex));
    out.push(await run('Firestore: conversations index', testConversationsIndex));
    out.push(await run('Storage: upload/delete', testStorageUpload));
    setResults(out);
    setRunning(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Diagnostics</Text>
      <TouchableOpacity disabled={running} onPress={runAll} style={[styles.button, running && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{running ? 'Running…' : 'Run All Checks'}</Text>
      </TouchableOpacity>
      <ScrollView style={styles.list}>
        {results.map((r, i) => (
          <View key={i} style={[styles.item, r.ok ? styles.ok : styles.fail]}>
            <Text style={styles.itemTitle}>{r.ok ? '✅' : '❌'} {r.name} ({r.ms}ms)</Text>
            {!!r.detail && <Text style={styles.itemDetail}>{r.detail}</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  button: { backgroundColor: '#ec4899', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600' },
  list: { marginTop: 16 },
  item: { padding: 12, borderRadius: 10, marginBottom: 10 },
  ok: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)' },
  fail: { backgroundColor: 'rgba(244,63,94,0.15)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.35)' },
  itemTitle: { color: '#fff', fontWeight: '600', marginBottom: 4 },
  itemDetail: { color: '#cbd5e1' },
});
