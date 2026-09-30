import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from './BackButton';
import { colors, spacing, typography } from '../../styles/theme';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
  onBackPress?: () => void;
  style?: any;
}

export function Header({ 
  title, 
  showBackButton = true, 
  rightActions, 
  onBackPress,
  style 
}: HeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <BackButton onPress={onBackPress} />
        )}
      </View>
      
      <View style={styles.centerSection}>
        <Text style={styles.title}>
          <Text>{title}</Text>
        </Text>
      </View>
      
      <View style={styles.rightSection}>
        {rightActions}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.background.primary,
  },
  leftSection: {
    width: 50,
    justifyContent: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
});
