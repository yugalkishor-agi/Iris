import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { NativePostImageEditor } from '../media/NativePostImageEditor';
import { NativeStoryEditor } from '../editor/NativeStoryEditor';
import { normalizeEditorExport } from '../../utils/normalizeEditorExport';
import { StorySettingsModal } from './StorySettingsModal';
import { ShareOptionsModal } from './ShareOptionsModal';

export interface StoryMediaInput {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
}

export interface StoryEditorSettings {
  allowReplies: boolean;
  allowSharing: boolean;
  audience: 'everyone' | 'closeFriends' | 'custom';
  hiddenFrom: string[];
  closeFriends: string[];
}

export interface StoryEditorDraft {
  mediaUri: string;
  mediaType: 'image' | 'video';
  mediaWidth?: number;
  mediaHeight?: number;
  canvasConfig?: { width: number; height: number; aspectRatio: number };
  textElements: any[];
  stickers: any[];
  drawings: any[];
  audience: 'public' | 'closeFriends';
  storySettings: StoryEditorSettings;
  trimStart?: number;
  trimEnd?: number;
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
  audioOverlay?: {
    uri: string;
    name?: string;
    volume: number;
    start?: number;
    end?: number;
  };
}

interface StoryPostStyleEditorProps {
  visible: boolean;
  media: StoryMediaInput | null;
  settings: StoryEditorSettings;
  onSettingsChange: (settings: StoryEditorSettings) => void;
  onClose: () => void;
  onSaveDraft: (draft: StoryEditorDraft) => void;
}

export function StoryPostStyleEditor({
  visible,
  media,
  settings,
  onSettingsChange,
  onClose,
  onSaveDraft,
}: StoryPostStyleEditorProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<StoryEditorDraft | null>(null);

  const resolvedAudience = settings.audience === 'closeFriends' ? 'closeFriends' : 'public';
  const settingsButton = useMemo(() => (
    <TouchableOpacity
      style={styles.settingsButton}
      onPress={() => setShowSettings(true)}
      activeOpacity={0.86}
    >
      <Ionicons name="settings-outline" size={18} color="#F4FDFF" />
    </TouchableOpacity>
  ), []);

  if (!visible || !media) {
    return null;
  }

  const queueDraftForAudienceSelection = (draft: StoryEditorDraft) => {
    setPendingDraft(draft);
    setShowAudiencePicker(true);
  };

  const handleAudienceShare = (audience: 'everyone' | 'closeFriends') => {
    if (!pendingDraft) return;
    const finalSettings: StoryEditorSettings = {
      ...pendingDraft.storySettings,
      audience,
    };

    onSaveDraft({
      ...pendingDraft,
      audience: audience === 'closeFriends' ? 'closeFriends' : 'public',
      storySettings: finalSettings,
    });

    setShowAudiencePicker(false);
    setPendingDraft(null);
  };

  const handleSaveImage = (editedImageUri: string) => {
    queueDraftForAudienceSelection({
      mediaUri: editedImageUri,
      mediaType: 'image',
      mediaWidth: media.width,
      mediaHeight: media.height,
      textElements: [],
      stickers: [],
      drawings: [],
      audience: resolvedAudience,
      storySettings: settings,
    });
  };

  const handleSaveVideo = (payload: any) => {
    try {
      if (payload?.kind !== 'video') {
        Alert.alert('Unsupported export', 'Only video export is supported for story videos.');
        return;
      }

      const ex = normalizeEditorExport(payload);
      const trimStart = typeof payload?.trimStart === 'number' ? Math.max(0, Math.floor(payload.trimStart)) : undefined;
      const trimEnd = typeof payload?.trimEnd === 'number' ? Math.max(1, Math.floor(payload.trimEnd)) : undefined;
      const payloadFilters = payload?.filters;
      const filters =
        payloadFilters && (payloadFilters.brightness != null || payloadFilters.contrast != null || payloadFilters.saturation != null)
          ? {
              brightness: payloadFilters.brightness,
              contrast: payloadFilters.contrast,
              saturation: payloadFilters.saturation,
            }
          : ex.filters;

      queueDraftForAudienceSelection({
        mediaUri: media.uri,
        mediaType: 'video',
        textElements: ex.textElements,
        stickers: ex.stickers,
        drawings: ex.drawings,
        canvasConfig: ex.canvasConfig,
        audience: resolvedAudience,
        storySettings: settings,
        trimStart,
        trimEnd,
        filters,
        audioOverlay: ex.audioOverlay,
      });
    } catch (error) {
      console.error('[StoryPostStyleEditor] Failed to normalize video export:', error);
      Alert.alert('Editor error', 'Could not prepare this story. Please try again.');
    }
  };

  return (
    <>
      {media.type === 'image' ? (
        <NativePostImageEditor
          visible={visible}
          imageUri={media.uri}
          onClose={onClose}
          onSave={handleSaveImage}
          headerAccessory={settingsButton}
        />
      ) : (
        <NativeStoryEditor
          visible={visible}
          mediaUri={media.uri}
          mediaType="video"
          onCancel={onClose}
          onSave={handleSaveVideo}
        />
      )}

      <StorySettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <ShareOptionsModal
        visible={showAudiencePicker}
        onClose={() => {
          setShowAudiencePicker(false);
          setPendingDraft(null);
        }}
        onShare={handleAudienceShare}
        isUploading={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,18,34,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  floatingOverlay: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 30,
  },
});
