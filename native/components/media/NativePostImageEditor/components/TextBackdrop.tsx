import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

export function TextBackdrop({ visible, onPress }: any) {
  if (!visible) return null;
  return <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />;
}
