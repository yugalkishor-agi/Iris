import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AdvancedImageEditor from '../components/media/AdvancedImageEditor';
import { imageFilterService, ImageAdjustments } from '../services/imageFilter.service';

interface RouteParams {
  imageUri: string;
  onSave?: (editedImageUri: string, adjustments: ImageAdjustments) => void;
}

export default function AdvancedImageEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, onSave } = route.params as RouteParams;

  const handleSave = async (editedImageUri: string, adjustments: ImageAdjustments) => {
    try {
      // Apply the adjustments to the image
      const processedImageUri = await imageFilterService.applyAdjustments(
        editedImageUri,
        adjustments
      );

      if (onSave) {
        onSave(processedImageUri, adjustments);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving edited image:', error);
      Alert.alert(
        'Save Failed',
        'Failed to save the edited image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your edits?',
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

  if (!imageUri) {
    Alert.alert('Error', 'No image provided for editing');
    navigation.goBack();
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <AdvancedImageEditor
        imageUri={imageUri}
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
