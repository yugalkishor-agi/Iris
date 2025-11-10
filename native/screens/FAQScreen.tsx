import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const faqs = [
  { q: 'How do I reset my password?', a: 'Go to Settings > Account > Change Password. You will need to enter your current password.' },
  { q: 'How do I delete my account?', a: 'Go to Settings > Account > Delete Account. This action is permanent and cannot be undone.' },
  { q: 'How do I make my account private?', a: 'Go to Settings > Privacy > Private Account and toggle it on.' },
  { q: 'How do I report a post or user?', a: 'Tap the three dots menu on any post or profile and select "Report".' },
  { q: 'How do I download my data?', a: 'Go to Settings > Account > Download Your Data. We will email you a download link within 48 hours.' },
  { q: 'How do I block someone?', a: 'Visit their profile, tap the three dots menu, and select "Block".' },
  { q: 'Can I recover a deleted account?', a: 'No, once an account is deleted, it cannot be recovered.' },
  { q: 'How do I change my username?', a: 'Usernames cannot be changed at this time.' },
];

export default function FAQScreen() {
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>FAQ</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.content}>
        {faqs.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqItem}
            onPress={() => setExpanded(expanded === i ? null : i)}
          >
            <View style={styles.question}>
              <Text style={styles.qText}>{faq.q}</Text>
              <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
            </View>
            {expanded === i && <Text style={styles.answer}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  faqItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  question: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#000' },
  answer: { marginTop: 12, fontSize: 14, color: '#6b7280', lineHeight: 20 },
});
