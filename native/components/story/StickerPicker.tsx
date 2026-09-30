import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { FlashList } from '@shopify/flash-list';

const { width, height } = Dimensions.get('window');

interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: StickerItem) => void;
}

interface StickerItem {
  id: string;
  type: 'emoji' | 'location' | 'mention' | 'hashtag' | 'poll' | 'question' | 'time' | 'weather';
  content: string;
  icon?: string;
  color?: string;
}

export function StickerPicker({ visible, onClose, onSelectSticker }: StickerPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'interactive' | 'location'>('emoji');
  const [searchQuery, setSearchQuery] = useState('');

  const emojiCategories = [
    { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'] },
    { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
    { name: 'Gestures', emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏'] },
    { name: 'Activities', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂'] },
  ];

  const interactiveStickers = [
    { id: 'poll', type: 'poll' as const, content: 'Poll', icon: 'bar-chart', color: '#8B5CF6' },
    { id: 'question', type: 'question' as const, content: 'Ask a Question', icon: 'help-circle', color: '#EC4899' },
    { id: 'mention', type: 'mention' as const, content: 'Mention Someone', icon: 'at', color: '#3B82F6' },
    { id: 'hashtag', type: 'hashtag' as const, content: 'Add Hashtag', icon: 'hash', color: '#10B981' },
    { id: 'time', type: 'time' as const, content: 'Current Time', icon: 'time', color: '#F59E0B' },
    { id: 'weather', type: 'weather' as const, content: 'Weather', icon: 'partly-sunny', color: '#06B6D4' },
  ];

  const locationStickers = [
    { id: 'location-1', type: 'location' as const, content: 'Add Location', icon: 'location', color: '#EF4444' },
    { id: 'location-2', type: 'location' as const, content: 'Check In', icon: 'checkmark-circle', color: '#10B981' },
  ];

  const tabs = [
    { id: 'emoji', label: 'Emoji', icon: 'happy' },
    { id: 'interactive', label: 'Interactive', icon: 'apps' },
    { id: 'location', label: 'Location', icon: 'location' },
  ];

  const handleEmojiSelect = (emoji: string) => {
    const sticker: StickerItem = {
      id: Date.now().toString(),
      type: 'emoji',
      content: emoji,
    };
    onSelectSticker(sticker);
  };

  const handleStickerSelect = (sticker: StickerItem) => {
    onSelectSticker({
      ...sticker,
      id: Date.now().toString(),
    });
  };

  const renderEmojiCategory = ({ item }: { item: typeof emojiCategories[0] }) => (
    <View style={styles.emojiCategory}>
      <Text style={styles.categoryTitle}>{item.name}</Text>
      <View style={styles.emojiGrid}>
        {item.emojis.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={styles.emojiButton}
            onPress={() => handleEmojiSelect(emoji)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInteractiveSticker = ({ item }: { item: typeof interactiveStickers[0] }) => (
    <TouchableOpacity
      style={[styles.interactiveSticker, { backgroundColor: item.color }]}
      onPress={() => handleStickerSelect(item)}
    >
      <Ionicons name={item.icon as any} size={24} color="#FFFFFF" />
      <Text style={styles.stickerText}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0} style={{ width: '100%' }}>
        <View style={styles.modal}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Add Sticker</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={20} 
                  color={activeTab === tab.id ? colors.accent.primary : colors.text.secondary} 
                />
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stickers..."
              placeholderTextColor={colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {activeTab === 'emoji' && (
              <FlashList estimatedItemSize={100}
                data={emojiCategories}
                renderItem={renderEmojiCategory}
                keyExtractor={(item) => item.name}
                scrollEnabled={false}
              />
            )}

            {activeTab === 'interactive' && (
              <View style={styles.interactiveContainer}>
                {interactiveStickers.map((sticker) => (
                  <TouchableOpacity
                    key={sticker.id}
                    style={[styles.interactiveSticker, { backgroundColor: sticker.color }]}
                    onPress={() => handleStickerSelect(sticker)}
                  >
                    <Ionicons name={sticker.icon as any} size={24} color="#FFFFFF" />
                    <Text style={styles.stickerText}>{sticker.content}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeTab === 'location' && (
              <View style={styles.locationContainer}>
                {locationStickers.map((sticker) => (
                  <TouchableOpacity
                    key={sticker.id}
                    style={[styles.locationSticker, { backgroundColor: sticker.color }]}
                    onPress={() => handleStickerSelect(sticker)}
                  >
                    <Ionicons name={sticker.icon as any} size={32} color="#FFFFFF" />
                    <Text style={styles.locationText}>{sticker.content}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: height * 0.8,
    minHeight: height * 0.6,
    alignSelf: 'stretch',
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.medium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.background.secondary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emojiCategory: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emojiButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  emoji: {
    fontSize: 24,
  },
  interactiveContainer: {
    gap: spacing.md,
  },
  interactiveSticker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  stickerText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  locationSticker: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
