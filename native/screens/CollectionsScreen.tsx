import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, SafeAreaView, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { collectionService } from '../services/collection.service';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton, InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2;

export default function CollectionsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCollections();
  }, [user]);

  const loadCollections = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userCollections = await collectionService.getUserCollections(user.userId);
      setCollections(userCollections || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCollections();
    setRefreshing(false);
  }, []);

  const handleCreateCollection = async () => {
    const cleanName = newCollectionName.trim();
    if (!user || !cleanName) return;
    
    setCreating(true);
    try {
      const collectionId = await collectionService.createCollection(
        user.userId,
        cleanName,
        false
      );
      const collection = { collectionId, name: cleanName, isPrivate: false, postsCount: 0 };
      setCollections(prev => [collection, ...prev]);
      setNewCollectionName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
      Alert.alert('Error', 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const showCreateDialog = () => setShowCreateModal(true);

  const renderCollection = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.collection}
      onPress={() => (navigation as any).navigate('CollectionDetail', { collectionId: item.collectionId })}
    >
      <Image 
        source={{ uri: item.coverImageURL || '' }}
        style={styles.cover} 
      />
      <View style={styles.overlay}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.count}>{item.postsCount || 0} posts</Text>
      </View>
      <View style={styles.collectionActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Edit', 'Edit collection functionality')}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Collections</Text>
        <TouchableOpacity onPress={showCreateDialog}>
          <Ionicons name="add" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ScreenSkeleton variant="grid" rows={6} />
      ) : collections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No Collections Yet</Text>
          <Text style={styles.emptySubtitle}>Create collections to organize your saved posts</Text>
          <TouchableOpacity style={styles.createButton} onPress={showCreateDialog}>
            <Text style={styles.createButtonText}>Create Collection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={collections}
          numColumns={2}
          renderItem={renderCollection}
          keyExtractor={(item) => item.collectionId}
          contentContainerStyle={styles.listContainer as any}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Collection</Text>
            <TextInput
              style={styles.input}
              placeholder="Collection name"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              maxLength={40}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  if (creating) return;
                  setShowCreateModal(false);
                  setNewCollectionName('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.createBtn, (!newCollectionName.trim() || creating) && styles.disabledBtn]}
                onPress={handleCreateCollection}
                disabled={!newCollectionName.trim() || creating}
              >
                {creating ? (
                  <InlineLoadingSkeleton />
                ) : (
                  <Text style={styles.createText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  grid: { padding: 16 },
  collection: { width: ITEM_SIZE, height: ITEM_SIZE, margin: 8, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  cover: { width: '100%', height: '100%', backgroundColor: colors.background.secondary },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#fff' },
  count: { fontSize: 13, color: '#d1d5db', marginTop: 2 },
  collectionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionButton: { padding: 8, borderRadius: 8, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text.primary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginTop: 8 },
  createButton: { backgroundColor: colors.accent.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  listContainer: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text.primary, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.border.subtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.text.primary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 10 },
  modalBtn: { minWidth: 92, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: colors.background.secondary },
  createBtn: { backgroundColor: colors.accent.primary },
  disabledBtn: { opacity: 0.6 },
  cancelText: { color: colors.text.primary, fontWeight: '600' },
  createText: { color: '#fff', fontWeight: '600' },
});



