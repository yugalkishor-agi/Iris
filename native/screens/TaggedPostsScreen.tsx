import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function TaggedPostsScreen() {
  const navigation = useNavigation();
  const posts = [
    { id: '1', image: 'https://via.placeholder.com/150' },
    { id: '2', image: 'https://via.placeholder.com/150' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>Tagged Posts</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={posts}
        numColumns={3}
        renderItem={({ item }) => <Image source={{ uri: item.image }} style={styles.post} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  post: { width: ITEM_SIZE, height: ITEM_SIZE },
});
