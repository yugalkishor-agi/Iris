import React from 'react';
import { View, Text } from 'react-native';

export function StickerAssetSheet(props: any) {
  if (!props.visible) return null;
  return <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300, backgroundColor: 'black' }}><Text style={{color: 'white'}}>Sticker Sheet Placeholder</Text></View>;
}
