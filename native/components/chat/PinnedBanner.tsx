import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type PinnedMessageMeta = {
  messageId: string;
  preview: string;
  createdAt?: any;
};

interface PinnedBannerProps {
  pinned: PinnedMessageMeta[];
  activeIndex: number;
  onPress: (id: string) => void;
  stylesRef: any;
}

const PinnedBanner: React.FC<PinnedBannerProps> = ({ pinned, activeIndex, onPress, stylesRef }) => {
  const s = stylesRef;
  if (!pinned.length) return null;
  const idx = Math.min(Math.max(activeIndex, 0), pinned.length - 1);
  const current = pinned[idx];

  return (
    <TouchableOpacity style={s.pinnedBanner} onPress={() => onPress(current.messageId)} activeOpacity={0.9}>
      <View style={s.pinnedIconWrap}>
        <Ionicons name="bookmark" size={18} color="#38bdf8" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.pinnedLabel}>Pinned message</Text>
        <Text numberOfLines={1} style={s.pinnedPreview}>
          {current.preview}
        </Text>
      </View>
      <Text style={s.pinnedCounter}>{idx + 1}/{pinned.length}</Text>
    </TouchableOpacity>
  );
};

export default PinnedBanner;
