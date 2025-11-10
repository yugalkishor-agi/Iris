import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function BlockConfirmScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const username = (route.params as any)?.username || 'this user';

  const handleBlock = () => {
    Alert.alert('Blocked', `You have blocked @${username}`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="ban" size={64} color="#ef4444" />
        <Text style={styles.title}>Block @{username}?</Text>
        <Text style={styles.description}>
          They won't be able to:{'\n\n'}
          • Find your profile or posts{'\n'}
          • See your stories{'\n'}
          • Message you{'\n\n'}
          They won't be notified that you blocked them.
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.blockBtn} onPress={handleBlock}>
          <Text style={styles.blockText}>Block</Text>
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
  blockBtn: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center' },
  blockText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
