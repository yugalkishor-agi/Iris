import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { storyService } from '../services/story.service';
import { highlightService } from '../services/highlight.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface Story {
  storyId: string;
  authorId: string;
  mediaURL: string;
  mediaType: 'image' | 'video';
  createdAt: any;
  expiresAt: any;
  isSelected?: boolean;
}

interface Highlight {
  highlightId: string;
  title: string;
  coverImageURL: string;
  storiesCount: number;
  createdAt: any;
  updatedAt: any;
  stories: Story[];
}

export default function StoryHighlightsManagerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToHighlightModal, setShowAddToHighlightModal] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { width: screenWidth } = Dimensions.get('window');
  const itemWidth = (screenWidth - 48) / 3; // 3 columns with padding

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load user's highlights
      const userHighlights = await highlightService.getUserHighlights(user.userId);
      setHighlights(userHighlights);
      
      // Load archived stories (expired stories)
      const archived = await storyService.getArchivedStories(user.userId);
      setArchivedStories(archived);
    } catch (error) {
      console.error('Error loading highlights data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleStorySelection = (storyId: string) => {
    setSelectedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const handleCreateHighlight = async () => {
    if (!user || !newHighlightTitle.trim() || selectedStories.size === 0) return;
    
    try {
      setIsCreating(true);
      
      const selectedStoriesArray = archivedStories.filter(story => 
        selectedStories.has(story.storyId)
      );
      
      const highlightData = {
        title: newHighlightTitle.trim(),
        authorId: user.userId,
        stories: selectedStoriesArray,
        coverImageURL: selectedStoriesArray[0]?.mediaURL || '',
      };
      
      const highlightId = await highlightService.createHighlight(highlightData);
      
      // Refresh highlights
      await loadData();
      
      // Reset state
      setNewHighlightTitle('');
      setSelectedStories(new Set());
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Highlight created successfully!');
    } catch (error) {
      console.error('Error creating highlight:', error);
      Alert.alert('Error', 'Failed to create highlight. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToHighlight = async () => {
    if (!selectedHighlight || selectedStories.size === 0) return;
    
    try {
      setIsCreating(true);
      
      const selectedStoriesArray = archivedStories.filter(story => 
        selectedStories.has(story.storyId)
      );
      
      await highlightService.addStoriesToHighlight(
        selectedHighlight.highlightId,
        selectedStoriesArray
      );
      
      // Refresh highlights
      await loadData();
      
      // Reset state
      setSelectedStories(new Set());
      setShowAddToHighlightModal(false);
      setSelectedHighlight(null);
      
      Alert.alert('Success', 'Stories added to highlight!');
    } catch (error) {
      console.error('Error adding stories to highlight:', error);
      Alert.alert('Error', 'Failed to add stories. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteHighlight = (highlight: Highlight) => {
    Alert.alert(
      'Delete Highlight',
      `Are you sure you want to delete "${highlight.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await highlightService.deleteHighlight(highlight.highlightId);
              await loadData();
              Alert.alert('Success', 'Highlight deleted successfully!');
            } catch (error) {
              console.error('Error deleting highlight:', error);
              Alert.alert('Error', 'Failed to delete highlight.');
            }
          },
        },
      ]
    );
  };

  const handleEditHighlight = (highlight: Highlight) => {
    (navigation as any).navigate('HighlightEdit', {
      highlightId: highlight.highlightId,
    });
  };

  const renderHighlightItem = ({ item }: { item: Highlight }) => (
    <TouchableOpacity
      style={styles.highlightItem}
      onPress={() => handleEditHighlight(item)}
    >
      <View style={styles.highlightCover}>
        <Image source={{ uri: item.coverImageURL }} style={styles.coverImage} />
        <View style={styles.highlightOverlay}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteHighlight(item)}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.highlightTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.highlightCount}>
        {item.storiesCount} {item.storiesCount === 1 ? 'story' : 'stories'}
      </Text>
    </TouchableOpacity>
  );

  const renderStoryItem = ({ item }: { item: Story }) => {
    const isSelected = selectedStories.has(item.storyId);
    
    return (
      <TouchableOpacity
        style={[styles.storyItem, isSelected && styles.selectedStoryItem]}
        onPress={() => handleStorySelection(item.storyId)}
      >
        <Image source={{ uri: item.mediaURL }} style={styles.storyImage} />
        {item.mediaType === 'video' && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={16} color="#FFFFFF" />
          </View>
        )}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCreateHighlightModal = () => (
    <Modal
      visible={showCreateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Highlight</Text>
            <TouchableOpacity
              onPress={handleCreateHighlight}
              disabled={!newHighlightTitle.trim() || selectedStories.size === 0 || isCreating}
            >
              <Text
                style={[
                  styles.modalSaveText,
                  (!newHighlightTitle.trim() || selectedStories.size === 0 || isCreating) &&
                    styles.disabledText,
                ]}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <TextInput
              style={styles.titleInput}
              placeholder="Highlight title"
              value={newHighlightTitle}
              onChangeText={setNewHighlightTitle}
              maxLength={50}
              autoFocus
            />
            
            <Text style={styles.sectionTitle}>
              Selected Stories ({selectedStories.size})
            </Text>
            
            <FlashList estimatedItemSize={100}
              data={archivedStories}
              renderItem={renderStoryItem}
              keyExtractor={(item) => item.storyId}
              numColumns={3}
              contentContainerStyle={styles.storiesGrid as any}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddToHighlightModal = () => (
    <Modal
      visible={showAddToHighlightModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddToHighlightModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddToHighlightModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add to Highlight</Text>
            <TouchableOpacity
              onPress={handleAddToHighlight}
              disabled={!selectedHighlight || selectedStories.size === 0 || isCreating}
            >
              <Text
                style={[
                  styles.modalSaveText,
                  (!selectedHighlight || selectedStories.size === 0 || isCreating) &&
                    styles.disabledText,
                ]}
              >
                {isCreating ? 'Adding...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.sectionTitle}>Select Highlight</Text>
            <FlashList estimatedItemSize={100}
              data={highlights}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.highlightSelectItem,
                    selectedHighlight?.highlightId === item.highlightId &&
                      styles.selectedHighlightItem,
                  ]}
                  onPress={() => setSelectedHighlight(item)}
                >
                  <Image source={{ uri: item.coverImageURL }} style={styles.highlightSelectImage} />
                  <Text style={styles.highlightSelectTitle}>{item.title}</Text>
                  {selectedHighlight?.highlightId === item.highlightId && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.highlightId}
              style={styles.highlightsList}
            />
            
            <Text style={styles.sectionTitle}>
              Selected Stories ({selectedStories.size})
            </Text>
            
            <FlashList estimatedItemSize={100}
              data={archivedStories}
              renderItem={renderStoryItem}
              keyExtractor={(item) => item.storyId}
              numColumns={3}
              contentContainerStyle={styles.storiesGrid as any}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Story Highlights</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading highlights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Story Highlights</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (archivedStories.length === 0) {
              Alert.alert('No Stories', 'You need archived stories to create highlights.');
              return;
            }
            setSelectedStories(new Set());
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlashList estimatedItemSize={100}
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View style={styles.content}>
            {/* Highlights Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Highlights</Text>
              {highlights.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="bookmark-outline" size={64} color="#8E8E93" />
                  <Text style={styles.emptyTitle}>No Highlights Yet</Text>
                  <Text style={styles.emptyMessage}>
                    Create highlights from your archived stories to showcase your best moments.
                  </Text>
                </View>
              ) : (
                <FlashList estimatedItemSize={100}
                  data={highlights}
                  renderItem={renderHighlightItem}
                  keyExtractor={(item) => item.highlightId}
                  numColumns={3}
                  contentContainerStyle={styles.highlightsGrid as any}
                  scrollEnabled={false}
                />
              )}
            </View>

            {/* Archived Stories Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Archived Stories</Text>
                {archivedStories.length > 0 && selectedStories.size > 0 && (
                  <TouchableOpacity
                    style={styles.addToHighlightButton}
                    onPress={() => {
                      if (highlights.length === 0) {
                        Alert.alert('No Highlights', 'Create a highlight first.');
                        return;
                      }
                      setSelectedHighlight(null);
                      setShowAddToHighlightModal(true);
                    }}
                  >
                    <Text style={styles.addToHighlightText}>Add to Highlight</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {archivedStories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={64} color="#8E8E93" />
                  <Text style={styles.emptyTitle}>No Archived Stories</Text>
                  <Text style={styles.emptyMessage}>
                    Your expired stories will appear here and can be added to highlights.
                  </Text>
                </View>
              ) : (
                <FlashList estimatedItemSize={100}
                  data={archivedStories}
                  renderItem={renderStoryItem}
                  keyExtractor={(item) => item.storyId}
                  numColumns={3}
                  contentContainerStyle={styles.storiesGrid as any}
                  scrollEnabled={false}
                />
              )}
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Modals */}
      {renderCreateHighlightModal()}
      {renderAddToHighlightModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  addToHighlightButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addToHighlightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  highlightsGrid: {
    gap: 12,
  },
  highlightItem: {
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  highlightCover: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  highlightOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  highlightCount: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
  storiesGrid: {
    gap: 8,
  },
  storyItem: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedStoryItem: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  disabledText: {
    color: '#8E8E93',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleInput: {
    fontSize: 16,
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
    marginBottom: 20,
  },
  highlightsList: {
    maxHeight: 120,
    marginBottom: 20,
  },
  highlightSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedHighlightItem: {
    backgroundColor: '#F0F8FF',
  },
  highlightSelectImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  highlightSelectTitle: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
});
