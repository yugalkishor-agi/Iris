import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { highlightService, type Highlight } from '../services/highlight.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

export default function HighlightsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHighlights();
  }, []);

  const loadHighlights = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userHighlights = await highlightService.getUserHighlights(user.userId);
      setHighlights(userHighlights);
    } catch (error) {
      console.error('Failed to load highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHighlight = ({ item }: { item: Highlight }) => (
    <TouchableOpacity
      style={styles.highlightItem}
      onPress={() =>
        (navigation as any).navigate('HighlightView', { highlightId: item.highlightId })
      }
      activeOpacity={0.8}
    >
      <View style={styles.highlightImage}>
        <Image source={{ uri: item.coverImageURL }} style={styles.coverImage} contentFit="cover" />
      </View>
      <Text style={styles.highlightName} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Story Highlights</Text>
        <TouchableOpacity>
          <Ionicons name="add" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <FlashList estimatedItemSize={100}
        data={highlights}
        renderItem={renderHighlight}
        keyExtractor={(item) => item.highlightId}
        numColumns={3}
        contentContainerStyle={styles.list as any}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>No highlights yet</Text>
            <Text style={styles.emptyText}>
              Create highlights from your stories
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  list: {
    padding: spacing.lg,
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  highlightImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border.medium,
    marginBottom: spacing.xs,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  highlightName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
