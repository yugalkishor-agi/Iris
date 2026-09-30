import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationBubbleProps {
  title?: string;
  lat?: number;
  lng?: number;
  onOpen?: () => void;
  stylesRef: any;
}

const LocationBubble: React.FC<LocationBubbleProps> = ({ title, lat, lng, onOpen, stylesRef }) => {
  const s = stylesRef;
  return (
    <View style={s.locCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Ionicons name="location" size={18} color="#ea580c" style={{ marginRight: 6 }} />
        <Text style={s.locTitle}>{title || 'Shared location'}</Text>
      </View>
      <Text style={s.locCoords}>{lat?.toFixed(4)}, {lng?.toFixed(4)}</Text>
      <TouchableOpacity style={s.locBtn} onPress={onOpen}>
        <Text style={s.locBtnText}>Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LocationBubble;
