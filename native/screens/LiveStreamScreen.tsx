import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function LiveStreamScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.info}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={styles.viewers}>
            <Ionicons name="eye" size={16} color="#fff" />
            <Text style={styles.viewersText}>234</Text>
          </View>
        </View>
      </View>
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="mic-off" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="videocam-off" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.endBtn]}>
          <Text style={styles.endText}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { padding: 20 },
  close: { alignSelf: 'flex-end' },
  info: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  viewers: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, gap: 6 },
  viewersText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  bottom: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 16 },
  actionBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  endBtn: { backgroundColor: '#ef4444' },
  endText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
