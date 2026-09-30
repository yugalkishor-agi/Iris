import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

type ChatDetailsRoute = RouteProp<{ ChatDetails: { conversationId: string; userId: string } }, 'ChatDetails'>;

export default function ChatDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatDetailsRoute>();
  const { conversationId, userId } = route.params || {};

  const handleThemePress = () => {
    Alert.alert('Chat theme', 'Per-chat themes are coming soon.');
  };

  const handleDisappearingPress = () => {
    Alert.alert('Disappearing messages', 'Message timers will be available in a later update.');
  };

  const handlePrivacyPress = () => {
    if (!userId) return;
    (navigation as any).navigate('ChatPrivacySafety', { userId });
  };

  const handleCreateGroupPress = () => {
    if (!userId) return;
    (navigation as any).navigate('NewGroup', { initialMemberIds: [userId] });
  };

  const handleComingSoon = (label: string) => {
    Alert.alert(label, 'This section will be available soon for this chat.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content as any}>
      <Text style={styles.title}>Chat options</Text>

      <TouchableOpacity style={styles.row} onPress={handleThemePress} activeOpacity={0.7}>
        <View style={styles.rowLeft}>
          <Ionicons name="color-palette" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Theme</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={handleDisappearingPress} activeOpacity={0.7}>
        <View style={styles.rowLeft}>
          <Ionicons name="alarm" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Disappearing messages</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={handlePrivacyPress} activeOpacity={0.7}>
        <View style={styles.rowLeft}>
          <Ionicons name="shield-checkmark" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Privacy & safety</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => handleComingSoon('Nicknames')}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="person" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Nicknames</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={handleCreateGroupPress} activeOpacity={0.7}>
        <View style={styles.rowLeft}>
          <Ionicons name="people" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Create group chat</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => handleComingSoon('Media')}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="images" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Media</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => handleComingSoon('Links')}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="link" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Links</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => handleComingSoon('Files')}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="document" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Files</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => handleComingSoon('Voice messages')}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="mic" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Voice</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => handleComingSoon('Glimpses')}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="videocam" size={18} color="#38bdf8" />
          <Text style={styles.rowText}>Glimpses</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      <Text style={styles.meta}>conversationId: {conversationId}</Text>
      <Text style={styles.meta}>userId: {userId}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#f8fafc' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#111827',
    marginBottom: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: { fontSize: 15, color: '#e2e8f0', fontWeight: '500' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 8 },
});
