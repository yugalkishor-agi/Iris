import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const imageSize = (width - spacing.md * 4) / 3;

interface GlimpseGridItemProps {
  item: any;
  onPress?: () => void;
}

export function GlimpseGridItem({ item, onPress }: GlimpseGridItemProps) {
  const navigation = useNavigation();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    
    (navigation as any).navigate('GlimpseViewer', { glimpseId: item.storyId });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.gridItem}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.mediaURL }}
        style={styles.gridImage}
        contentFit="cover"
      />
      
      {/* Glimpse indicator */}
      <View style={styles.glimpseBadge}>
        <Ionicons name="film" size={16} color="#fff" />
      </View>
      
      {/* Video indicator for video glimpses */}
      {item.mediaType === 'video' && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
      )}
      
      {/* Stats overlay */}
      <View style={styles.statsOverlay}>
        {(item.likesCount > 0 || item.viewsCount > 0) && (
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#fff" />
            <Text style={styles.statText}>
              {item.likesCount || 0}
            </Text>
          </View>
        )}
        {item.viewsCount > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="eye" size={14} color="#fff" />
            <Text style={styles.statText}>
              {item.viewsCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridItem: {
    width: imageSize,
    height: imageSize,
    margin: 1,
    position: 'relative',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.secondary,
  },
  glimpseBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(138, 43, 226, 0.8)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  videoBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 2,
    fontWeight: '500',
  },
});
