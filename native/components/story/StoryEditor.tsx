import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Animated,
  PanResponder} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMediaProcessing } from '../../hooks/useMediaProcessing';
import ProcessingIndicator from '../ProcessingIndicator/ProcessingIndicator';
import { canUseExpoCameraHardware } from '../../utils/devicePerf';
import { Image } from 'expo-image';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
}

interface StickerOverlay {
  id: string;
  type: 'emoji' | 'gif' | 'poll' | 'question' | 'music';
  content: any;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

type EditorTool = 'none' | 'text' | 'sticker' | 'draw' | 'filter' | 'music';

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

const TEXT_BACKGROUNDS = [
  'transparent', '#00000080', '#FFFFFF80', '#FF6B6B80',
  '#4ECDC480', '#45B7D180', '#96CEB480', '#FFEAA780'
];

const FONTS = [
  { name: 'System', value: 'System' },
  { name: 'Bold', value: 'System-Bold' },
  { name: 'Light', value: 'System-Light' },
  { name: 'Italic', value: 'System-Italic' },
];

const FILTERS = [
  { name: 'Normal', id: 'none' },
  { name: 'Vintage', id: 'vintage' },
  { name: 'B&W', id: 'bw' },
  { name: 'Warm', id: 'warm' },
  { name: 'Cool', id: 'cool' },
  { name: 'Vivid', id: 'vivid' }
];

export default function StoryEditor() {
  const navigation = useNavigation();
  const { processStoryMedia, isProcessing } = useMediaProcessing();
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  
  // Media state
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  
  // Editor state
  const [currentTool, setCurrentTool] = useState<EditorTool>('none');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  
  // Text editor state
  const [isTextEditorVisible, setIsTextEditorVisible] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBackground, setTextBackground] = useState('transparent');
  const [textFont, setTextFont] = useState(FONTS[0].value);
  const [textSize, setTextSize] = useState(24);
  
  // Filter state
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [showFilters, setShowFilters] = useState(false);
  
  // Processing state
  const [showProcessing, setShowProcessing] = useState(false);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const available = await canUseExpoCameraHardware();
      setCameraUnavailable(!available);
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  // Handle media capture
  const handleCapture = async () => {
    if (!cameraPermission) {
      Alert.alert('Permission needed', 'Camera permission is required to take photos/videos');
      return;
    }
    
    // TODO: Implement camera capture
    // For now, use image picker as fallback
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedMedia(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  // Handle gallery selection
  const handleGallerySelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedMedia(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  // Add text overlay
  const addTextOverlay = () => {
    if (!currentText.trim()) return;
    
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: currentText,
      x: screenWidth / 2,
      y: screenHeight / 2,
      scale: 1,
      rotation: 0,
      color: textColor,
      backgroundColor: textBackground,
      fontSize: textSize,
      fontFamily: textFont,
    };
    
    setTextOverlays(prev => [...prev, newOverlay]);
    setCurrentText('');
    setIsTextEditorVisible(false);
  };

  // Remove overlay
  const removeOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
    setStickerOverlays(prev => prev.filter(overlay => overlay.id !== id));
    setSelectedOverlayId(null);
  };

  // Publish story
  const handlePublish = async () => {
    if (!capturedMedia) return;

    try {
      setShowProcessing(true);
      
      // Process media with client-side compression
      const processedUri = await processStoryMedia(capturedMedia, mediaType, {
        quality: 0.8,
        maxWidth: 1080,
        maxHeight: 1920,
      });
      
      // TODO: Upload to Firebase with overlays data
      console.log('Publishing story with processed media:', processedUri);
      console.log('Text overlays:', textOverlays);
      console.log('Sticker overlays:', stickerOverlays);
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Failed to publish story:', error);
      Alert.alert('Error', 'Failed to publish story. Please try again.');
    } finally {
      setShowProcessing(false);
    }
  };

  // Render camera view
  if (!capturedMedia) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Camera Header */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Create Story</Text>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
          >
            <Ionicons 
              name={flashMode === 'off' ? 'flash-off' : 'flash'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>

        {/* Camera View */}
        <View style={styles.cameraContainer}>
          {cameraPermission && !cameraUnavailable ? (
            <CameraView
              style={styles.camera}
              facing={cameraType}
              flash={flashMode}
              onMountError={() => setCameraUnavailable(true)}
            />
          ) : (
            <View style={styles.permissionContainer}>
              <Ionicons name="camera-outline" size={64} color="#666666" />
              <Text style={styles.permissionText}>{cameraUnavailable ? 'Camera unavailable right now. Use gallery.' : 'Camera permission required'}</Text>
            </View>
          )}
        </View>

        {/* Camera Controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleGallerySelect}
          >
            <Ionicons name="images" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
          >
            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render editor view
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.glassButton}
          onPress={() => setCapturedMedia(null)}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Media Preview */}
      <View style={styles.mediaContainer}>
        <Image source={{ uri: capturedMedia }} style={styles.mediaPreview} />
        
        {/* Text Overlays */}
        {textOverlays.map(overlay => (
          <TouchableOpacity
            key={overlay.id}
            style={[
              styles.textOverlay,
              {
                left: overlay.x - 50,
                top: overlay.y - 20,
                transform: [
                  { scale: overlay.scale },
                  { rotate: `${overlay.rotation}deg` }
                ],
              }
            ]}
            onPress={() => setSelectedOverlayId(overlay.id)}
          >
            <Text
              style={[
                styles.overlayText,
                {
                  color: overlay.color,
                  backgroundColor: overlay.backgroundColor,
                  fontSize: overlay.fontSize,
                  fontFamily: overlay.fontFamily,
                }
              ]}
            >
              {overlay.text}
            </Text>
            {selectedOverlayId === overlay.id && (
              <TouchableOpacity
                style={styles.deleteOverlay}
                onPress={() => removeOverlay(overlay.id)}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Right Side Toolbar */}
      <View style={styles.rightToolbar}>
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => {
            setCurrentTool('text');
            setIsTextEditorVisible(true);
          }}
        >
          <View style={[styles.glassButton, currentTool === 'text' && styles.activeGlassButton]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' }}>Aa</Text>
          </View>
          <Text style={styles.toolbarLabel}>Text</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => setCurrentTool('sticker')}
        >
          <View style={[styles.glassButton, currentTool === 'sticker' && styles.activeGlassButton]}>
            <Ionicons name="happy-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.toolbarLabel}>Sticker</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => setCurrentTool('draw')}
        >
          <View style={[styles.glassButton, currentTool === 'draw' && styles.activeGlassButton]}>
            <Ionicons name="brush-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.toolbarLabel}>Draw</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => setShowFilters(!showFilters)}
        >
          <View style={[styles.glassButton, showFilters && styles.activeGlassButton]}>
            <Ionicons name="color-wand-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.toolbarLabel}>Filters</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => setCurrentTool('music')}
        >
          <View style={[styles.glassButton, currentTool === 'music' && styles.activeGlassButton]}>
            <Ionicons name="musical-notes-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.toolbarLabel}>Music</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolbarItem}>
          <View style={styles.glassButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.toolbarLabel}>More</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Interaction Area */}
      <LinearGradient 
        colors={['transparent', 'rgba(0,0,0,0.8)']} 
        style={styles.bottomInteractionArea}
        pointerEvents="box-none"
      >
        <View style={styles.captionContainer}>
          <TouchableOpacity style={styles.captionInput}>
            <Ionicons name="add-circle-outline" size={20} color="rgba(255,255,255,0.6)" />
            <Text style={styles.captionText}>Add a caption...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerActionBar}>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={handlePublish}
          >
            <LinearGradient
              colors={['#d0bcff', '#a078ff']}
              style={styles.footerIconBg}
            >
              <Ionicons name="add" size={18} color="#3c0091" />
            </LinearGradient>
            <Text style={styles.footerButtonText}>Your Story</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.footerButton}
            onPress={handlePublish}
          >
            <View style={[styles.footerIconBg, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="star" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.footerButtonText}>Close Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.nextArrowButton}
            onPress={handlePublish}
          >
            <Ionicons name="arrow-forward" size={28} color="#000000" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FILTERS.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.activeFilter
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text style={styles.filterText}>{filter.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Text Editor Modal */}
      <Modal
        visible={isTextEditorVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.textEditorContainer}>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
            style={styles.textEditorBackground}
          >
            <View style={styles.textEditorHeader}>
              <TouchableOpacity
                onPress={() => setIsTextEditorVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={addTextOverlay}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.textInput,
                {
                  color: textColor,
                  backgroundColor: textBackground,
                  fontSize: textSize,
                  fontFamily: textFont,
                }
              ]}
              value={currentText}
              onChangeText={setCurrentText}
              placeholder="Type something..."
              placeholderTextColor="#666666"
              multiline
              autoFocus
            />
            
            {/* Text Customization */}
            <View style={styles.textCustomization}>
              {/* Colors */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TEXT_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      textColor === color && styles.activeColor
                    ]}
                    onPress={() => setTextColor(color)}
                  />
                ))}
              </ScrollView>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Processing Indicator */}
      <ProcessingIndicator
        visible={showProcessing}
        allowBackgroundUsage={true}
        onClose={() => setShowProcessing(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Camera Styles
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  flipButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Editor Styles
  topControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 40,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeGlassButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  rightToolbar: {
    position: 'absolute',
    top: 20,
    right: 16,
    zIndex: 40,
    alignItems: 'center',
  },
  toolbarItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  toolbarLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 4,
  },
  bottomInteractionArea: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingBottom: 32,
    paddingTop: 60,
    paddingHorizontal: 16,
    zIndex: 40,
  },
  captionContainer: {
    marginBottom: 20,
  },
  captionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,20,20,0.6)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  captionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  footerActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40,40,40,0.8)',
    borderRadius: 24,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  footerIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextArrowButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textOverlay: {
    position: 'absolute',
    minWidth: 100,
    minHeight: 40,
  },
  overlayText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    padding: 8,
    borderRadius: 8,
  },
  deleteOverlay: {
    position: 'absolute',
    top: -12,
    right: -12,
  },
  // (Removed old toolsContainer styles, replaced by rightToolbar)
  filtersPanel: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  
  // Text Editor Modal
  textEditorContainer: {
    flex: 1,
  },
  textEditorBackground: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  textEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  textInput: {
    minHeight: 100,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    padding: 20,
    borderRadius: 12,
  },
  textCustomization: {
    marginTop: 20,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColor: {
    borderColor: '#FFFFFF',
  },
});


