import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ActivityLogScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual activity log service
    setTimeout(() => {
      setActivities([
        { id: '1', type: 'login', message: 'Logged in from Chrome', time: 'Just now' },
        { id: '2', type: 'post', message: 'Created a new post', time: '2 hours ago' },
        { id: '3', type: 'follow', message: 'Followed 3 new people', time: 'Yesterday' },
        { id: '4', type: 'comment', message: 'Commented on 5 posts', time: '2 days ago' },
      ]);
      setLoading(false);
    }, 1000);
  }, [user]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'login': return 'log-in';
      case 'post': return 'image';
      case 'follow': return 'person-add';
      case 'comment': return 'chatbubble';
      default: return 'ellipse';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Activity Log</Text>
        <View style={{ width: 28 }} />
      </View>
      {loading ? <ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1 }} /> : (
        <FlatList
          data={activities}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.iconBox}>
                <Ionicons name={getIcon(item.type) as any} size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.msg}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  msg: { fontSize: 15, color: '#000' },
  time: { fontSize: 13, color: '#6b7280', marginTop: 4 },
});
