import { ScreenSkeleton } from '../ui/LoadingSkeleton';
import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { GlimpseGridItem } from './GlimpseGridItem';
import { colors, spacing, typography } from '../../styles/theme';

interface GlimpseGridProps {
  data: any[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  onItemPress?: (item: any) => void;
  numColumns?: number;
  scrollEnabled?: boolean;
  contentContainerStyle?: any;
}

export function GlimpseGrid({
  data,
  loading = false,
  emptyTitle = 'No glimpses yet',
  emptyDescription = 'Glimpses will appear here',
  emptyIcon = 'film-outline',
  onItemPress,
  numColumns = 3,
  scrollEnabled = true,
  contentContainerStyle,
}: GlimpseGridProps) {
  
  const renderItem = ({ item }: { item: any }) => (
    <GlimpseGridItem 
      item={item} 
      onPress={onItemPress ? () => onItemPress(item) : undefined}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={emptyIcon as any} 
        size={48} 
        color={colors.text.secondary} 
      />
      <Text style={styles.emptyTitle}>{emptyTitle}</Text>
      <Text style={styles.emptyDescription}>{emptyDescription}</Text>
    </View>
  );

  if (loading) {
    return (
      <ScreenSkeleton variant="grid" rows={6} />
    );
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item, index) => item.storyId || item.glimpseId || `glimpse-${index}`}
      numColumns={numColumns}
      scrollEnabled={scrollEnabled}
      contentContainerStyle={[styles.gridContainer, contentContainerStyle] as any}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      drawDistance={700}
    />
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    padding: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

