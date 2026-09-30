import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { storyService } from '../services/story.service';
import { useAuth } from '../contexts/AuthContext';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const storyWidth = (width - spacing.lg * 2 - spacing.md * 2) / 3;

interface ArchivedStory {
  storyId: string;
  mediaURL: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: Date;
  viewsCount: number;
  isHighlight: boolean;
}

interface StoryArchive {
  date: string;
  stories: ArchivedStory[];
}

export default function ArchivedStoryViewerScreen() {
  const [archives, setArchives] = useState<StoryArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<ArchivedStory | null>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  useEffect(() => {
    loadArchivedStories();
  }, []);

  const loadArchivedStories = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Mock archived stories data - in production, this would come from story service
      const mockArchives: StoryArchive[] = [
        {
          date: 'Today',
          stories: [
            {
              storyId: '1',
              mediaURL: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
              mediaType: 'image',
              caption: 'Beautiful morning!',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
              viewsCount: 45,
              isHighlight: false,
            },
            {
              storyId: '2',
              mediaURL: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=400&fit=crop',
              mediaType: 'image',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
              viewsCount: 32,
              isHighlight: true,
            },
          ],
        },
        {
          date: 'Yesterday',
          stories: [
            {
              storyId: '3',
              mediaURL: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=400&fit=crop',
              mediaType: 'image',
              caption: 'Beach vibes 🌊',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
              viewsCount: 78,
              isHighlight: false,
            },
            {
              storyId: '4',
              mediaURL: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop',
              mediaType: 'video',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
              viewsCount: 56,
              isHighlight: false,
            },
          ],
        },
        {
          date: 'This Week',
          stories: [
            {
              storyId: '5',
              mediaURL: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=400&fit=crop',
              mediaType: 'image',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
              viewsCount: 123,
              isHighlight: true,
            },
            {
              storyId: '6',
              mediaURL: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=400&fit=crop',
              mediaType: 'image',
              caption: 'Concert night! 🎵',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
              viewsCount: 89,
              isHighlight: false,
            },
          ],
        },
      ];

      setArchives(mockArchives);
    } catch (error) {
      console.error('Failed to load archived stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryPress = (story: ArchivedStory) => {
    setSelectedStory(story);
    // In production, this would navigate to story viewer
    (navigation as any).navigate('StoryViewerEnhanced', { storyId: story.storyId });
  };

  const handleAddToHighlight = (story: ArchivedStory) => {
    Alert.alert(
      'Add to Highlight',
      'Would you like to add this story to a highlight?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            // In production, this would show highlight selection
            Alert.alert('Added to Highlight', 'Story added to your highlights!');
          },
        },
      ]
    );
  };

  const handleDeleteStory = (story: ArchivedStory) => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to permanently delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In production, this would delete the story
            setArchives(archives.map(archive => ({
              ...archive,
              stories: archive.stories.filter(s => s.storyId !== story.storyId)
            })).filter(archive => archive.stories.length > 0));
            Alert.alert('Story Deleted', 'The story has been permanently deleted.');
          },
        },
      ]
    );
  };

  const renderStory = ({ item }: { item: ArchivedStory }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => handleStoryPress(item)}
      onLongPress={() => {
        Alert.alert(
          'Story Options',
          'What would you like to do with this story?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add to Highlight', onPress: () => handleAddToHighlight(item) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteStory(item) },
          ]
        );
      }}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.mediaURL }} style={styles.storyImage} />
      
      {item.mediaType === 'video' && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play" size={16} color="white" />
        </View>
      )}
      
      {item.isHighlight && (
        <View style={styles.highlightBadge}>
          <Ionicons name="star" size={12} color="white" />
        </View>
      )}
      
      <View style={styles.storyStats}>
        <Ionicons name="eye" size={12} color="white" />
        <Text style={styles.viewsText}>{item.viewsCount}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderArchiveSection = ({ item }: { item: StoryArchive }) => (
    <View style={styles.archiveSection}>
      <Text style={styles.archiveDate}>{item.date}</Text>
      <FlashList estimatedItemSize={100}
        data={item.stories}
        renderItem={renderStory}
        keyExtractor={(story) => story.storyId}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={styles.storiesGrid as any}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Story Archive</Text>
          <View style={{ width: 24 }} />
        </View>
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
        <Text style={styles.headerTitle}>Story Archive</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="archive" size={24} color={colors.accent.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Your story archive</Text>
          <Text style={styles.infoDescription}>
            Only you can see your archived stories. You can add them to highlights or delete them permanently.
          </Text>
        </View>
      </View>

      <FlashList estimatedItemSize={100}
        data={archives}
        renderItem={renderArchiveSection}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.archivesList as any}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No archived stories</Text>
            <Text style={styles.emptySubtext}>
              Your expired stories will be automatically archived here
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  archivesList: {
    paddingHorizontal: spacing.lg,
  },
  archiveSection: {
    marginBottom: spacing.xl,
  },
  archiveDate: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  storiesGrid: {
    gap: spacing.sm,
  },
  storyItem: {
    width: storyWidth,
    height: storyWidth * 1.5,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  videoOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  highlightBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  storyStats: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 2,
  },
  viewsText: {
    fontSize: typography.fontSize.xs,
    color: 'white',
    fontWeight: typography.fontWeight.semibold as any,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
