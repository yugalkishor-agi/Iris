import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { colors, commonStyles, typography } from '../../styles/theme';

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  success?: boolean;
}

export default function Input({
  containerStyle,
  leftIcon,
  rightIcon,
  error,
  success,
  style,
  ...props
}: InputProps) {
  const inputContainerStyles = [
    styles.container,
    leftIcon && styles.withLeftIcon,
    rightIcon && styles.withRightIcon,
    error && styles.errorContainer,
    success && styles.successContainer,
    containerStyle,
  ];

  const inputStyles = [
    styles.input,
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    style,
  ];

  return (
    <View style={inputContainerStyles}>
      {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
      <TextInput
        style={inputStyles}
        placeholderTextColor={colors.text.muted}
        {...props}
      />
      {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.input.base,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  withLeftIcon: {
    paddingLeft: 48,
  },
  withRightIcon: {
    paddingRight: 48,
  },
  errorContainer: {
    borderColor: colors.accent.error,
  },
  successContainer: {
    borderColor: colors.accent.success,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    paddingHorizontal: 0,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
});
