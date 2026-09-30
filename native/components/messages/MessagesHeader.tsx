// MessagesHeader.tsx
// Purpose: Messages screen header with search and new message button
// Extracted from: MessagesScreenEnhanced.tsx — Session 002

import React, { memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../styles/theme';

interface MessagesHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewMessage: () => void;
  onNewGroup?: () => void;
  screenAppearTranslateY?: Animated.AnimatedInterpolation<number>;
}

const MessagesHeader = memo(({
  searchQuery,
  onSearchChange,
  onNewMessage,
  onNewGroup,
  screenAppearTranslateY,
}: MessagesHeaderProps) => {
  return (
    <Animated.View 
      style={[
        styles.header,
        screenAppearTranslateY && { transform: [{ translateY: screenAppearTranslateY }] }
      ]}
    >
      {/* Title Row */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.actions}>
          {onNewGroup && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onNewGroup}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="people-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onNewMessage}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

MessagesHeader.displayName = 'MessagesHeader';

export default MessagesHeader;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
});
