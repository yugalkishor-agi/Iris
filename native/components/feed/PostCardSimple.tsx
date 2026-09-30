import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles/theme';

interface PostCardSimpleProps {
  postId: string;
  user: {
    name: string;
    avatar?: string;
  };
  caption?: string;
}

export function PostCardSimple({ postId, user, caption }: PostCardSimpleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>{user.name}</Text>
      </View>
      {caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{caption}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  username: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  captionContainer: {
    marginTop: spacing.sm,
  },
  caption: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
});
