import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { colors, typography } from '../../styles/theme';
import { CachedImage } from './CachedImage';

interface AvatarProps {
  source?: string | null;
  size?: number;
  fallbackText?: string;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  fallbackStyle?: ViewStyle;
  fallbackTextStyle?: TextStyle;
}

function AvatarComponent({
  source,
  size = 40,
  fallbackText = '?',
  style,
  imageStyle,
  fallbackStyle,
  fallbackTextStyle,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const showFallback = !source || imageError;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {showFallback ? (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            fallbackStyle,
          ]}
        >
          <Text
            style={[
              styles.fallbackText,
              {
                fontSize: size / 2.5,
              },
              fallbackTextStyle,
            ]}
          >
            {fallbackText.charAt(0).toUpperCase()}
          </Text>
        </View>
      ) : (
        <CachedImage
          uri={source || ''}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            imageStyle,
          ]}
          resizeMode="cover"
          onError={() => setImageError((prev) => (prev ? prev : true))}
        />
      )}
    </View>
  );
}

export const Avatar = memo(AvatarComponent);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {},
  fallback: {
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold as any,
  },
});
