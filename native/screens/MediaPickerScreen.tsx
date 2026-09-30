import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function MediaPickerScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [opening, setOpening] = useState(false);

  const openLibrary = async () => {
    try {
      setOpening(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Media access is required to pick photos/videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: 20,
        quality: 0.9,
      });

      if (!result.canceled) {
        setSelected(result.assets || []);
      }
    } catch (error) {
      console.error('Failed to pick media:', error);
      Alert.alert('Error', 'Failed to open media picker');
    } finally {
      setOpening(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Select Media</Text>
        <TouchableOpacity
          onPress={() => {
            if (!selected[0]) return;
            (navigation as any).navigate('Filters', { mediaUri: selected[0].uri, mediaType: selected[0].type });
          }}
          disabled={!selected.length}
        >
          <Text style={[styles.next, !selected.length && styles.nextDisabled]}>Next</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.libraryBtn} onPress={openLibrary} disabled={opening}>
          {opening ? <InlineLoadingSkeleton /> : <Ionicons name="images-outline" size={18} color="#fff" />}
          <Text style={styles.libraryText}>{opening ? 'Opening...' : 'Open Library'}</Text>
        </TouchableOpacity>
      </View>

      {selected.length > 0 ? (
        <FlashList estimatedItemSize={100}
          data={selected}
          numColumns={3}
          keyExtractor={(item, index) => `${item.assetId || item.uri}-${index}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.item}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              {item.type === 'video' && (
                <View style={styles.badge}>
                  <Ionicons name="videocam" size={12} color="#fff" />
                </View>
              )}
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={56} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No media selected</Text>
          <Text style={styles.emptySubtitle}>Tap "Open Library" to choose photos or videos</Text>
        </View>
      )}
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
  next: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: colors.accent.primary },
  nextDisabled: { opacity: 0.45 },
  toolbar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  libraryBtn: { alignSelf: 'flex-start', backgroundColor: colors.accent.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  libraryText: { color: '#fff', fontWeight: '600' },
  item: { width: ITEM_SIZE, height: ITEM_SIZE, position: 'relative' },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 10, padding: 4 },
  indexBadge: { position: 'absolute', left: 8, bottom: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  indexText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyTitle: { color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any },
  emptySubtitle: { color: colors.text.secondary, fontSize: typography.fontSize.base, textAlign: 'center' },
});

