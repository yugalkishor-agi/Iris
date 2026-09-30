import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Developer Menu Screen
 * Quick access to all testing and development features
 */
export default function DevMenuScreen() {
  const navigation = useNavigation();

  const devFeatures = [
    {
      id: 'editor-test',
      title: '🎨 Story Editor Test',
      description: 'Test the Native Story Editor with live updates',
      route: 'EditorTest',
      icon: 'brush',
      color: '#EC4899',
    },
    {
      id: 'story-create',
      title: '📸 Story Creator',
      description: 'Test full story creation flow',
      route: 'StoryEditor',
      icon: 'camera',
      color: '#4DD0E1',
    },
    {
      id: 'post-create',
      title: '➕ New Post',
      description: 'Test post creation',
      route: 'NewPost',
      icon: 'add-circle',
      color: '#10B981',
    },
    {
      id: 'glimpse-create',
      title: '⚡ Glimpse Creator',
      description: 'Test glimpse creation',
      route: 'GlimpseCreate',
      icon: 'flash',
      color: '#F59E0B',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Developer Menu</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent as any}
      >
        <Text style={styles.sectionTitle}>🧪 Testing Features</Text>
        <Text style={styles.sectionSubtitle}>
          Quick access to development and testing screens
        </Text>

        <View style={styles.featuresGrid}>
          {devFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.featureCard, { borderLeftColor: feature.color }]}
              onPress={() => (navigation as any).navigate(feature.route)}
            >
              <View style={styles.featureIcon}>
                <Ionicons
                  name={feature.icon as any}
                  size={32}
                  color={feature.color}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.3)"
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#4DD0E1" />
          <Text style={styles.infoText}>
            Make changes to editor files and see instant updates with Fast Refresh enabled
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    gap: 16,
  },
  featureIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(77, 208, 225, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(77, 208, 225, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
});
