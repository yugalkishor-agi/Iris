import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Camera Styles
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  recordingButton: {
    backgroundColor: '#FF0000',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Editor Styles
  editorContainer: {
    flex: 1,
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  media: {
    width: screenWidth,
    height: screenHeight,
  },
  videoPlaceholder: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: screenHeight / 2 - 50,
  },
  editorTopControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  editorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeEditorButton: {
    backgroundColor: '#007AFF',
  },
  publishButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Text Overlay Styles
  textOverlay: {
    position: 'absolute',
    padding: 8,
    borderRadius: 8,
    minWidth: 50,
    minHeight: 30,
  },
  selectedOverlay: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  overlayText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Sticker Styles
  stickerOverlay: {
    position: 'absolute',
  },
  stickerText: {
    fontSize: 40,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    width: screenWidth - 40,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
  },
  textInput: {
    fontSize: 18,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  textControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  textControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Color Picker Styles
  colorPickerContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    maxWidth: screenWidth - 40,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },

  // Font Picker Styles
  fontPickerContainer: {
    width: screenWidth - 40,
    maxHeight: 400,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
  },
  fontOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 2,
  },
  selectedFont: {
    backgroundColor: '#007AFF',
  },
  fontOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  // Sticker Picker Styles
  stickerPickerContainer: {
    width: screenWidth - 40,
    maxHeight: 500,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
  },
  stickerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 10,
  },
  stickerOption: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stickerEmoji: {
    fontSize: 30,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Filter Picker Styles
  filterPickerContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    maxWidth: screenWidth - 40,
  },
  filterOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  selectedFilter: {
    backgroundColor: '#007AFF',
  },
  filterName: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Filter Effects (basic CSS-like filters)
  filter_vintage: {
    opacity: 0.8,
    // You would implement actual filter effects using libraries like react-native-image-filter-kit
  },
  filter_bw: {
    // Black and white filter
  },
  filter_sepia: {
    // Sepia filter
  },
  filter_warm: {
    // Warm filter
  },
  filter_cool: {
    // Cool filter
  },
  filter_bright: {
    // Brightness filter
  },
  filter_contrast: {
    // Contrast filter
  },

  // Error Styles
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});
