import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, TextInput, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/user.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface PhotoTag {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  avatarURL?: string;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  approved: boolean;
}

interface PhotoTaggingProps {
  imageUri: string;
  existingTags?: PhotoTag[];
  onSave: (tags: PhotoTag[]) => void;
  onCancel: () => void;
  currentUserId: string;
}

interface SearchUser {
  userId: string;
  username: string;
  displayName?: string;
  avatarURL?: string;
  isFollowing?: boolean;
}

export default function PhotoTagging({
  imageUri,
  existingTags = [],
  onSave,
  onCancel,
  currentUserId,
}: PhotoTaggingProps) {
  const [tags, setTags] = useState<PhotoTag[]>(existingTags);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pendingTagPosition, setPendingTagPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Handle tap on image to add tag
  const handleImagePress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const { width, height } = event.nativeEvent.target.measure || { width: screenWidth, height: 300 };
    
    // Convert to percentage
    const xPercent = (locationX / width) * 100;
    const yPercent = (locationY / height) * 100;
    
    setPendingTagPosition({ x: xPercent, y: yPercent });
    setShowUserSearch(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const users = await userService.searchUsers(query, 20);
      
      // Filter out already tagged users
      const taggedUserIds = tags.map(tag => tag.userId);
      const filteredUsers = users.filter(user => !taggedUserIds.includes(user.userId));
      
      setSearchResults(filteredUsers.map(user => ({
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        avatarURL: user.avatarURL,
        isFollowing: false, // TODO: Check if following
      })));
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Add tag
  const addTag = (user: SearchUser) => {
    if (!pendingTagPosition) return;

    const newTag: PhotoTag = {
      id: Date.now().toString(),
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      avatarURL: user.avatarURL,
      x: pendingTagPosition.x,
      y: pendingTagPosition.y,
      approved: user.userId === currentUserId, // Auto-approve own tags
    };

    setTags(prev => [...prev, newTag]);
    setShowUserSearch(false);
    setPendingTagPosition(null);
    setSelectedTagId(newTag.id);
  };

  // Remove tag
  const removeTag = (tagId: string) => {
    Alert.alert(
      'Remove Tag',
      'Are you sure you want to remove this tag?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setTags(prev => prev.filter(tag => tag.id !== tagId));
            if (selectedTagId === tagId) {
              setSelectedTagId(null);
            }
          },
        },
      ]
    );
  };

  // Move tag position
  const moveTag = (tagId: string, x: number, y: number) => {
    setTags(prev =>
      prev.map(tag =>
        tag.id === tagId ? { ...tag, x, y } : tag
      )
    );
  };

  return (
    <View style={styles.container}>
      {/* Image with tags */}
      <View style={styles.imageContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleImagePress}
          style={styles.imageTouchable}
        >
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="contain" />
          
          {/* Render tags */}
          {tags.map(tag => (
            <PhotoTagComponent
              key={tag.id}
              tag={tag}
              isSelected={selectedTagId === tag.id}
              onSelect={() => setSelectedTagId(tag.id)}
              onMove={(x, y) => moveTag(tag.id, x, y)}
              onRemove={() => removeTag(tag.id)}
            />
          ))}
          
          {/* Pending tag position indicator */}
          {pendingTagPosition && (
            <View
              style={[
                styles.pendingTag,
                {
                  left: `${pendingTagPosition.x}%`,
                  top: `${pendingTagPosition.y}%`,
                },
              ]}
            >
              <View style={styles.pendingTagDot} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Tap on the photo to tag people
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
          <Text style={styles.controlText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.saveButton]}
          onPress={() => onSave(tags)}
        >
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          <Text style={styles.controlText}>Save ({tags.length})</Text>
        </TouchableOpacity>
      </View>

      {/* User Search Modal */}
      <Modal visible={showUserSearch} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.searchModal}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Tag People</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowUserSearch(false);
                  setPendingTagPosition(null);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search people..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  searchUsers(text);
                }}
                autoFocus
              />
            </View>

            <FlashList estimatedItemSize={100}
              data={searchResults}
              keyExtractor={(item) => item.userId}
              style={styles.searchResults}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => addTag(item)}
                >
                  <View style={styles.userAvatar}>
                    {item.avatarURL ? (
                      <Image source={{ uri: item.avatarURL }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={20} color="#666" />
                      </View>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.username}>@{item.username}</Text>
                    {item.displayName && (
                      <Text style={styles.displayName}>{item.displayName}</Text>
                    )}
                  </View>

                  {item.isFollowing && (
                    <View style={styles.followingBadge}>
                      <Text style={styles.followingText}>Following</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  {searchLoading ? (
                    <Text style={styles.emptyText}>Searching...</Text>
                  ) : searchQuery ? (
                    <Text style={styles.emptyText}>No users found</Text>
                  ) : (
                    <Text style={styles.emptyText}>Start typing to search people</Text>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Selected tag info */}
      {selectedTagId && (
        <View style={styles.tagInfo}>
          {(() => {
            const selectedTag = tags.find(tag => tag.id === selectedTagId);
            return selectedTag ? (
              <View style={styles.tagInfoContent}>
                <Text style={styles.tagInfoText}>
                  @{selectedTag.username}
                  {!selectedTag.approved && ' (pending approval)'}
                </Text>
                <TouchableOpacity
                  style={styles.removeTagButton}
                  onPress={() => removeTag(selectedTagId)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ) : null;
          })()}
        </View>
      )}
    </View>
  );
}

// Individual Photo Tag Component
interface PhotoTagComponentProps {
  tag: PhotoTag;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
}

function PhotoTagComponent({ tag, isSelected, onSelect, onMove }: PhotoTagComponentProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePanResponderMove = (event: any, gestureState: any) => {
    // Calculate new position as percentage
    const { width, height } = event.nativeEvent.target.measure || { width: screenWidth, height: 300 };
    const newX = ((gestureState.moveX - gestureState.x0 + tag.x * width / 100) / width) * 100;
    const newY = ((gestureState.moveY - gestureState.y0 + tag.y * height / 100) / height) * 100;
    
    // Constrain to image bounds
    const constrainedX = Math.max(0, Math.min(100, newX));
    const constrainedY = Math.max(0, Math.min(100, newY));
    
    onMove(constrainedX, constrainedY);
  };

  return (
    <Animated.View
      style={[
        styles.photoTag,
        {
          left: `${tag.x}%`,
          top: `${tag.y}%`,
          transform: [{ scale }],
        },
        isSelected && styles.selectedTag,
      ]}
    >
      <TouchableOpacity
        style={styles.tagButton}
        onPress={onSelect}
        onLongPress={() => {
          // Animate scale for feedback
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
          ]).start();
        }}
      >
        <View style={styles.tagDot} />
        
        {isSelected && (
          <View style={styles.tagLabel}>
            <Text style={styles.tagLabelText}>@{tag.username}</Text>
            {!tag.approved && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  instructions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  photoTag: {
    position: 'absolute',
    zIndex: 10,
  },
  selectedTag: {
    zIndex: 20,
  },
  tagButton: {
    alignItems: 'center',
  },
  tagDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tagLabel: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  tagLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  pendingTag: {
    position: 'absolute',
    zIndex: 5,
  },
  pendingTagDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFA500',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  searchModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
    paddingBottom: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#000000',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  displayName: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  followingBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followingText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  tagInfo: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
  },
  tagInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagInfoText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  removeTagButton: {
    padding: 8,
  },
});
