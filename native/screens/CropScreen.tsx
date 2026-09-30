import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';

const RATIOS = [
  { key: 'free', label: 'Free', ratio: undefined as number | undefined },
  { key: '1:1', label: '1:1', ratio: 1 },
  { key: '4:5', label: '4:5', ratio: 4 / 5 },
  { key: '16:9', label: '16:9', ratio: 16 / 9 },
];

export default function CropScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const mediaUri = (route.params as any)?.mediaUri as string | undefined;
  const mediaType = (route.params as any)?.mediaType as string | undefined;
  const filterKey = (route.params as any)?.filterKey as string | undefined;
  const [selectedRatio, setSelectedRatio] = useState<string>('free');

  const active = RATIOS.find((r) => r.key === selectedRatio) || RATIOS[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Crop</Text>
        <TouchableOpacity
          onPress={() =>
            (navigation as any).navigate('StoryCreate', {
              mediaUri,
              mediaType,
              filterKey,
              cropRatio: selectedRatio,
            })
          }
          disabled={!mediaUri}
        >
          <Text style={[styles.done, !mediaUri && styles.doneDisabled]}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cropArea}>
        {mediaUri ? (
          <View style={[styles.frame, active.ratio ? { aspectRatio: active.ratio } : { aspectRatio: 1 }]}>
            <Image source={{ uri: mediaUri }} style={styles.image} />
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="image-outline" size={56} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No media selected</Text>
          </View>
        )}
      </View>

      <View style={styles.tools}>
        {RATIOS.map((ratio) => (
          <TouchableOpacity
            key={ratio.key}
            style={[styles.tool, selectedRatio === ratio.key && styles.toolActive]}
            onPress={() => setSelectedRatio(ratio.key)}
          >
            <Text style={[styles.toolText, selectedRatio === ratio.key && styles.toolTextActive]}>{ratio.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
  },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  done: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: colors.accent.primary },
  doneDisabled: { opacity: 0.5 },
  cropArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  frame: { width: '100%', maxHeight: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  tools: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.background.primary },
  tool: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.background.secondary },
  toolActive: { backgroundColor: colors.accent.primary },
  toolText: { color: colors.text.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold as any },
  toolTextActive: { color: '#fff' },
  empty: { alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
});
