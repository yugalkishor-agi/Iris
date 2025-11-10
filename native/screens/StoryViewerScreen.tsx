import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function StoryViewerScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://via.placeholder.com/400x800' }} style={styles.story} />
      <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  story: { width, height },
  close: { position: 'absolute', top: 50, right: 20 },
});
