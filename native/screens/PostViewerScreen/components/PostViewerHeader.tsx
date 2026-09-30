import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing, typography } from '../../../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

interface PostViewerHeaderProps {
  isGlimpseRoute: boolean;
}

export const PostViewerHeader: React.FC<PostViewerHeaderProps> = ({ isGlimpseRoute }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top + spacing.xs, spacing.md) : spacing.md }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{isGlimpseRoute ? 'Glimpses' : 'Posts'}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
});
