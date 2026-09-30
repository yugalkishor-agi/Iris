import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './StoryCameraStyles';
import { canUseExpoCameraHardware } from '../../utils/devicePerf';

interface StoryCameraProps {
  onMediaCaptured: (uri: string, type: 'photo' | 'video') => void;
  onClose: () => void;
}

export default function StoryCamera({ onMediaCaptured, onClose }: StoryCameraProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const available = await canUseExpoCameraHardware();
      if (mounted && !available) {
        setCameraUnavailable(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function pickFromGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0] as any;
        onMediaCaptured(asset.uri, asset.type === 'video' ? 'video' : 'photo');
      }
    } catch (e) {
      console.error('Gallery pick failed:', e);
      Alert.alert('Error', 'Failed to select media');
    }
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted || cameraUnavailable) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          {cameraUnavailable ? 'Camera is unavailable right now. Choose media from gallery.' : 'We need your permission to show the camera'}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={cameraUnavailable ? pickFromGallery : requestPermission}
        >
          <Text style={styles.permissionButtonText}>{cameraUnavailable ? 'Choose from Gallery' : 'Grant Permission'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo?.uri) {
          onMediaCaptured(photo.uri, 'photo');
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          maxDuration: 30,
        });
        if (video?.uri) {
          onMediaCaptured(video.uri, 'video');
        }
        setIsRecording(false);
      } catch (error) {
        console.error('Error recording video:', error);
        Alert.alert('Error', 'Failed to record video');
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
        onMountError={() => setCameraUnavailable(true)}
      />

      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
          <Ionicons
            name={flashMode === 'off' ? 'flash-off' : 'flash'}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
          <Ionicons name="images" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isRecording && styles.recordingButton]}
          onPress={takePicture}
          onLongPress={startRecording}
          onPressOut={stopRecording}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
          <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
