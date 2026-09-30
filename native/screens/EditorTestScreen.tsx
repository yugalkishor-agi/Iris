import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStoryEditor } from '../components/editor/NativeStoryEditor';
import { Image } from 'expo-image';

/**
 * Test screen for the Native Story Editor
 * Navigate to this screen to test the editor
 */
export default function EditorTestScreen() {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permission');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setShowEditor(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePicture = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permission');
        return;
      }

      // Take picture
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setShowEditor(true);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const useTestImage = () => {
    // Use a placeholder image for testing
    // You can replace this with any image URL
    const testImageUri = 'https://picsum.photos/1080/1920';
    setSelectedImage(testImageUri);
    setShowEditor(true);
  };

  const handleSave = (result: any) => {
    console.log('Story saved!', result);
    Alert.alert(
      'Success!',
      'Story edited successfully',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowEditor(false);
            setSelectedImage(null);
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setShowEditor(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Native Story Editor Test</Text>
        <Text style={styles.subtitle}>
          Choose an image to start editing
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>📷 Pick from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <Text style={styles.buttonText}>📸 Take Picture</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={useTestImage}
        >
          <Text style={styles.buttonText}>🖼️ Use Test Image</Text>
        </TouchableOpacity>
      </View>

      {selectedImage && !showEditor && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Selected Image:</Text>
          <Image source={{ uri: selectedImage }} style={styles.preview} />
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowEditor(true)}
          >
            <Text style={styles.buttonText}>✏️ Open Editor</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Editor Features:</Text>
        <Text style={styles.infoText}>✅ Text with fonts & colors</Text>
        <Text style={styles.infoText}>✅ Drawing with 5 brush types</Text>
        <Text style={styles.infoText}>✅ Emoji stickers</Text>
        <Text style={styles.infoText}>✅ Filters & effects</Text>
        <Text style={styles.infoText}>✅ Music overlay</Text>
        <Text style={styles.infoText}>✅ Interactive widgets</Text>
        <Text style={styles.infoText}>✅ Undo/Redo (50 steps)</Text>
      </View>

      {/* Editor Modal */}
      {showEditor && selectedImage && (
        <NativeStoryEditor
          visible={showEditor}
          mediaUri={selectedImage}
          mediaType="image"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#EC4899',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#4DD0E1',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewContainer: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  preview: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 6,
  },
});
