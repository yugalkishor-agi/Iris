import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  style,
  textStyle,
  ...props 
}: BadgeProps) {
  return (
    <View style={[
      styles.badge,
      styles[variant],
      styles[`size_${size}`],
      style
    ]} {...props}>
      <Text style={[
        styles.badgeText,
        styles[`${variant}Text`],
        styles[`size_${size}Text`],
        textStyle
      ]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variants
  default: {
    backgroundColor: colors.accent.primary,
  },
  secondary: {
    backgroundColor: colors.background.tertiary,
  },
  destructive: {
    backgroundColor: '#EF4444',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  success: {
    backgroundColor: '#10B981',
  },
  warning: {
    backgroundColor: '#F59E0B',
  },
  
  // Sizes
  size_sm: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  size_lg: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  // Text styles
  badgeText: {
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  defaultText: {
    color: colors.text.inverse,
  },
  secondaryText: {
    color: colors.text.primary,
  },
  destructiveText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: colors.text.primary,
  },
  successText: {
    color: '#FFFFFF',
  },
  warningText: {
    color: '#FFFFFF',
  },
  
  // Size text styles
  size_smText: {
    fontSize: typography.fontSize.xs,
  },
  size_mdText: {
    fontSize: typography.fontSize.sm,
  },
  size_lgText: {
    fontSize: typography.fontSize.base,
  },
});
