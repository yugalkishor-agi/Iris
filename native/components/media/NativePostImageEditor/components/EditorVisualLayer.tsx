import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

export function EditorVisualLayer(props: any) {
  return <View style={{ position: 'absolute', left: props.layer.x, top: props.layer.y, width: props.layer.width, height: props.layer.height, transform: [{ scale: props.layer.scale }, { rotate: `${props.layer.rotation}deg`}] }}>
    {props.layer.type === 'sticker' ? <Text style={{fontSize: 40}}>{props.layer.content}</Text> : (props.layer.assetUri ? <Image source={{uri: props.layer.assetUri}} style={{width: '100%', height: '100%'}} /> : null)}
  </View>;
}
