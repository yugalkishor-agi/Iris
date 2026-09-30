import React from 'react';
import { View, Text, TouchableOpacity, Share, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

export default function BackupCodesScreen() {
  const navigation = useNavigation();
  const codes = [
    '1A2B-3C4D-5E6F',
    '7G8H-9I0J-1K2L',
    '3M4N-5O6P-7Q8R',
    '9S0T-1U2V-3W4X',
    '5Y6Z-7A8B-9C0D',
  ];

  const handleShare = async () => {
    await Share.share({ message: `Backup Codes:\n${codes.join('\n')}` });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Backup Codes</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.warning}>
        <Ionicons name="warning" size={24} color="#f59e0b" />
        <Text style={styles.warningText}>
          Save these codes in a secure place. Each can only be used once.
        </Text>
      </View>
      <FlashList estimatedItemSize={100}
        data={codes}
        renderItem={({ item }) => (
          <View style={styles.code}>
            <Text style={styles.codeText}>{item}</Text>
          </View>
        )}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list as any}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fef3c7', marginTop: 16, marginHorizontal: 16, borderRadius: 8 },
  warningText: { flex: 1, fontSize: 13, color: '#78716c' },
  list: { padding: 16 },
  code: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  codeText: { fontSize: 18, fontWeight: '600', fontFamily: 'monospace', color: '#000' },
});
