import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Bookmark, Flag, HeartOff, MessageCircle, Pencil, Pin, Send, Trash2, UserMinus } from 'lucide-react-native';
import { colors, spacing, typography } from '../../../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PostViewerModalsProps {
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  editVisible: boolean;
  setEditVisible: (visible: boolean) => void;
  post: any;
  user: any;
  isOwnContent: boolean;
  saved: boolean;
  menuActionLoading: boolean;
  editCaption: string;
  setEditCaption: (caption: string) => void;
  handleSave: (post: any, saved: boolean) => void;
  handleToggleHideLikes: () => void;
  handleToggleHideShares: () => void;
  handleToggleComments: () => void;
  handleTogglePin: () => void;
  handleDeletePost: () => void;
  handleReportPost: () => void;
  handleUnfollow: () => void;
  handleSaveEdit: () => void;
}

export const PostViewerModals: React.FC<PostViewerModalsProps> = ({
  menuVisible,
  setMenuVisible,
  editVisible,
  setEditVisible,
  post,
  user,
  isOwnContent,
  saved,
  menuActionLoading,
  editCaption,
  setEditCaption,
  handleSave,
  handleToggleHideLikes,
  handleToggleHideShares,
  handleToggleComments,
  handleTogglePin,
  handleDeletePost,
  handleReportPost,
  handleUnfollow,
  handleSaveEdit,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={[styles.menuSheet, { paddingBottom: Math.max(insets.bottom + 8, 12) }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            {isOwnContent ? (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleSave(post, saved)}>
                  <Bookmark size={20} color={colors.text.primary} strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={styles.menuText}>{saved ? 'Unsave' : 'Save'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleToggleHideLikes} disabled={menuActionLoading}>
                  <HeartOff size={20} color={colors.text.primary} strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={styles.menuText}>{post?.hideLikesCount ? 'Show like count' : 'Hide like count'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleToggleHideShares} disabled={menuActionLoading}>
                  <Send size={20} color={colors.text.primary} strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={styles.menuText}>{post?.hideSharesCount ? 'Show share count' : 'Hide share count'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleToggleComments} disabled={menuActionLoading}>
                  <MessageCircle size={20} color={colors.text.primary} strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={styles.menuText}>{post?.commentsEnabled === false ? 'Turn on commenting' : 'Turn off commenting'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => { setEditVisible(true); setMenuVisible(false); }}>
                  <Pencil size={20} color={colors.text.primary} strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleTogglePin} disabled={menuActionLoading}>
                  <Pin size={20} color={colors.text.primary} strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={styles.menuText}>{post?.pinnedAt ? 'Unpin from grid' : 'Pin in grid'}</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleDeletePost}>
                  <Trash2 size={20} color="#ef4444" strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={[styles.menuText, styles.menuTextDanger]}>Delete</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleSave(post, saved)}>
                  <Bookmark size={20} color={colors.text.primary} strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={styles.menuText}>{saved ? 'Unsave' : 'Save'}</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={handleReportPost}>
                  <Flag size={20} color="#ef4444" strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={[styles.menuText, styles.menuTextDanger]}>Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleUnfollow}>
                  <UserMinus size={20} color="#ef4444" strokeWidth={1.5} style={styles.menuIcon} />
                  <Text style={[styles.menuText, styles.menuTextDanger]}>Unfollow</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <Pressable style={styles.editOverlay} onPress={() => setEditVisible(false)}>
          <Pressable style={styles.editCard} onPress={() => {}}>
            <Text style={styles.editTitle}>Edit caption</Text>
            <TextInput
              style={styles.editInput}
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="Update your caption"
              placeholderTextColor="#A8A8A8"
              multiline
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.editButton, styles.editSave]} onPress={handleSaveEdit} disabled={menuActionLoading}>
                <Text style={styles.editSaveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, styles.editCancel]} onPress={() => setEditVisible(false)}>
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sheetHandle: { width: 36, height: 4, backgroundColor: '#555555', borderRadius: 2, marginTop: 8, marginBottom: 12, alignSelf: 'center' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: '#121212', paddingVertical: 12, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  menuIcon: { marginRight: spacing.md },
  menuText: { fontSize: 15, color: '#F5F5F5' },
  menuDivider: { height: 1, backgroundColor: colors.border.subtle, marginVertical: 8, marginHorizontal: 20 },
  menuItemDanger: {},
  menuTextDanger: { color: colors.accent.error },
  editOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', padding: spacing.lg },
  editCard: { backgroundColor: colors.background.elevated, borderRadius: 24, padding: spacing.lg },
  editTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary, marginBottom: spacing.md },
  editInput: { minHeight: 90, borderWidth: 1, borderColor: '#333333', borderRadius: 8, padding: 12, backgroundColor: '#262626', color: '#FFFFFF', textAlignVertical: 'top', marginBottom: spacing.lg },
  editActions: { alignItems: 'center', gap: 10, flexDirection: 'column', justifyContent: 'center' },
  editButton: { width: '90%', height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  editCancel: { backgroundColor: 'transparent' },
  editSave: { backgroundColor: '#0095F6' },
  editCancelText: { color: '#A8A8A8', fontWeight: typography.fontWeight.semibold as any },
  editSaveText: { color: '#FFFFFF', fontWeight: typography.fontWeight.semibold as any },
});
