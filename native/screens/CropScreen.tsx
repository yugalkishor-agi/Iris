import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CropScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>Crop</Text>
        <TouchableOpacity><Text style={styles.done}>Done</Text></TouchableOpacity>
      </View>
      <View style={styles.cropArea}>
        <Image source={{ uri: 'https://via.placeholder.com/400' }} style={styles.image} />
      </View>
      <View style={styles.tools}>
        <TouchableOpacity style={styles.tool}><Ionicons name="expand" size={24} color="#000" /></TouchableOpacity>
        <TouchableOpacity style={styles.tool}><Ionicons name="crop" size={24} color="#000" /></TouchableOpacity>
        <TouchableOpacity style={styles.tool}><Ionicons name="resize" size={24} color="#000" /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '600' },
  done: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  cropArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '90%', height: '90%', resizeMode: 'contain' },
  tools: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#fff' },
  tool: { padding: 12 },
});
