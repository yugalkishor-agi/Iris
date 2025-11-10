import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function MuteConfirmScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const username = (route.params as any)?.username || 'this user';

  const handleMute = () => {
    Alert.alert('Muted', `You have muted @${username}`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="volume-mute" size={64} color="#f59e0b" />
        <Text style={styles.title}>Mute @{username}?</Text>
        <Text style={styles.description}>
          You won't see their:{'\n\n'}
          • Posts in your feed{'\n'}
          • Stories{'\n\n'}
          You can still message each other.{'\n'}
          They won't know you muted them.
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.muteBtn} onPress={handleMute}>
          <Text style={styles.muteText}>Mute</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 22, fontWeight: '700', marginTop: 24, marginBottom: 16 },
  description: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
  actions: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  muteBtn: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#f59e0b', alignItems: 'center' },
  muteText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
