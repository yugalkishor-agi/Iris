import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CachedImage } from '../ui/CachedImage';

interface SharedCardProps {
  title: string;
  subtitle?: string;
  thumbnail?: string;
  onOpen?: () => void;
  stylesRef: any;
}

const SharedCard: React.FC<SharedCardProps> = ({ title, subtitle, thumbnail, onOpen, stylesRef }) => {
  const s = stylesRef;
  return (
    <TouchableOpacity style={s.sharedCard} onPress={onOpen} activeOpacity={0.85}>
      {thumbnail ? <CachedImage uri={thumbnail} style={s.sharedThumb} resizeMode="cover" /> : null}
      <View style={{ flex: 1 }}>
        <Text style={s.sharedTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.sharedSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

export default SharedCard;
