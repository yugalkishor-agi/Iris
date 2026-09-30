import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import TextOverlayEditor from '../components/media/TextOverlayEditor';
import { TextLayer } from '../hooks/useTextOverlay';

interface RouteParams {
  imageUri?: string;
  videoUri?: string;
  onSave?: (textLayers: TextLayer[]) => void;
}

export default function TextOverlayScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, videoUri, onSave } = route.params as RouteParams;

  const handleSave = (textLayers: TextLayer[]) => {
    if (textLayers.length === 0) {
      Alert.alert(
        'No Text Added',
        'You haven\'t added any text. Do you want to continue without text?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              if (onSave) {
                onSave(textLayers);
              }
              navigation.goBack();
            }
          },
        ]
      );
      return;
    }

    if (onSave) {
      onSave(textLayers);
    }
    navigation.goBack();
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your text overlays?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <TextOverlayEditor
        imageUri={imageUri}
        videoUri={videoUri}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
