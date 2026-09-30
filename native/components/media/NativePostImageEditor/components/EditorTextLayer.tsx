import React from 'react';
import { View, Text } from 'react-native';

export function EditorTextLayer(props: any) {
  return <View style={{ position: 'absolute', left: props.layer.x, top: props.layer.y, transform: [{ scale: props.layer.scale }, { rotate: `${props.layer.rotation}deg`}] }}>
    <Text style={{ fontSize: props.layer.fontSize, color: props.layer.color, textAlign: props.layer.align }}>{props.layer.text}</Text>
  </View>;
}
