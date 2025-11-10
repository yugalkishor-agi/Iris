import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NewPostScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Post</Text>
        
        <TouchableOpacity style={styles.option}>
          <Ionicons name="camera" size={32} color="#fff" />
          <Text style={styles.optionText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option}>
          <Ionicons name="images" size={32} color="#fff" />
          <Text style={styles.optionText}>Choose from Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option}>
          <Ionicons name="videocam" size={32} color="#fff" />
          <Text style={styles.optionText}>Record Video</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
  },
});
