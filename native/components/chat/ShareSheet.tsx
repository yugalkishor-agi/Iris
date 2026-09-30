import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  onGallery: () => void;
  onCamera: () => void;
  onLocation: () => void;
  onPoll: () => void;
  onGif: () => void;
  onSticker: () => void;
  stylesRef: any;
}

const ShareSheet: React.FC<ShareSheetProps> = ({
  visible,
  onClose,
  onGallery,
  onCamera,
  onLocation,
  onPoll,
  onGif,
  onSticker,
  stylesRef,
}) => {
  const s = stylesRef;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.actionOverlay} activeOpacity={1} onPress={onClose}>
        <View style={s.shareSheetDock}>
          <View style={s.shareSheet}>
            <Text style={s.shareTitle}>Share in chat</Text>
            <View style={s.shareRow}>
              <TouchableOpacity style={s.shareItem} onPress={onGallery}>
                <Ionicons name="images" size={22} color="#38bdf8" />
                <Text style={s.shareLabel}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareItem} onPress={onCamera}>
                <Ionicons name="camera" size={22} color="#38bdf8" />
                <Text style={s.shareLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareItem} onPress={onLocation}>
                <Ionicons name="location" size={22} color="#38bdf8" />
                <Text style={s.shareLabel}>Location</Text>
              </TouchableOpacity>
            </View>
            <View style={s.shareRow}>
              <TouchableOpacity style={s.shareItem} onPress={onPoll}>
                <Ionicons name="stats-chart" size={22} color="#38bdf8" />
                <Text style={s.shareLabel}>Poll</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareItem} onPress={onGif}>
                <Ionicons name="film" size={22} color="#38bdf8" />
                <Text style={s.shareLabel}>GIF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareItem} onPress={onSticker}>
                <Ionicons name="sparkles" size={22} color="#38bdf8" />
                <Text style={s.shareLabel}>Sticker</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ShareSheet;
