import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';

const FILTERS = [
  { key: 'normal', label: 'Normal', opacity: 0, tint: '#ffffff' },
  { key: 'warm', label: 'Warm', opacity: 0.12, tint: '#ffb74d' },
  { key: 'cool', label: 'Cool', opacity: 0.12, tint: '#64b5f6' },
  { key: 'vintage', label: 'Vintage', opacity: 0.16, tint: '#d7b899' },
  { key: 'mono', label: 'Mono', opacity: 0.2, tint: '#808080' },
];

export default function FiltersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const mediaUri = (route.params as any)?.mediaUri as string | undefined;
  const mediaType = (route.params as any)?.mediaType as string | undefined;
  const [selected, setSelected] = useState('normal');

  const filter = useMemo(() => FILTERS.find((f) => f.key === selected) || FILTERS[0], [selected]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Filters</Text>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('Crop', { mediaUri, mediaType, filterKey: selected })}
          disabled={!mediaUri}
        >
          <Text style={[styles.apply, !mediaUri && styles.applyDisabled]}>Apply</Text>
        </TouchableOpacity>
      </View>

      {mediaUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: mediaUri }} style={styles.preview} />
          {filter.key !== 'normal' && (
            <View style={[styles.filterOverlay, { backgroundColor: filter.tint, opacity: filter.opacity }]} />
          )}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="image-outline" size={56} color={colors.text.secondary} />
          <Text style={styles.emptyText}>No media selected</Text>
        </View>
      )}

      <ScrollView horizontal style={styles.filters} showsHorizontalScrollIndicator={false}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filter, selected === f.key && styles.filterActive]}
            onPress={() => setSelected(f.key)}
          >
            <View style={styles.filterPreview}>
              <View style={[styles.filterPreviewTint, { backgroundColor: f.tint, opacity: f.opacity }]} />
            </View>
            <Text style={[styles.filterName, selected === f.key && styles.filterNameActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  apply: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: colors.accent.primary },
  applyDisabled: { opacity: 0.5 },
  previewWrap: { width: '100%', aspectRatio: 1, position: 'relative', backgroundColor: colors.background.secondary },
  preview: { width: '100%', height: '100%' },
  filterOverlay: { ...StyleSheet.absoluteFillObject },
  filters: { paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  filter: { alignItems: 'center', marginRight: spacing.md, padding: 4, borderRadius: 10 },
  filterActive: { backgroundColor: colors.background.secondary },
  filterPreview: { width: 68, height: 68, borderRadius: 10, backgroundColor: '#ddd', overflow: 'hidden', marginBottom: 6, position: 'relative' },
  filterPreviewTint: { ...StyleSheet.absoluteFillObject },
  filterName: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  filterNameActive: { color: colors.text.primary, fontWeight: typography.fontWeight.semibold as any },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
});
