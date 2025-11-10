import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function MediaPickerScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>Select Media</Text>
        <TouchableOpacity><Text style={styles.next}>Next</Text></TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {[1,2,3,4,5,6].map(i => (
          <TouchableOpacity key={i} style={styles.item}>
            <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.image} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  next: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  item: { width: ITEM_SIZE, height: ITEM_SIZE },
  image: { width: '100%', height: '100%' },
});
