import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Feed</Text>
        <View style={styles.content}>
          <Text style={styles.text}>Instagram-style feed will go here</Text>
          <Text style={styles.subtitle}>Posts, Stories, Glimpses</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    padding: 16,
  },
  content: {
    padding: 16,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
  },
});
