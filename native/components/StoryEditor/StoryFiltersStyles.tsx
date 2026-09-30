import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  filterContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: screenHeight * 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 24,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.8,
    borderRadius: 15,
  },
  filtersScrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterOption: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  selectedFilter: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  filterThumbnailContainer: {
    marginBottom: 8,
  },
  filterThumbnail: {
    width: 60,
    height: 80,
    borderRadius: 10,
  },
  filterName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedFilterName: {
    color: '#007AFF',
    fontWeight: '600',
  },
  intensityContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  intensityLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  intensitySlider: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    left: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    marginLeft: -10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  resetButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Filter Effects (CSS-like filters for React Native)
  filter_vintage: {
    opacity: 0.9,
    // In a real implementation, you'd use libraries like:
    // react-native-image-filter-kit or react-native-gl-image-filters
  },
  filter_blackwhite: {
    // Grayscale filter
  },
  filter_sepia: {
    // Sepia tone filter
  },
  filter_warm: {
    // Warm color temperature
  },
  filter_cool: {
    // Cool color temperature
  },
  filter_bright: {
    // Increased brightness
  },
  filter_contrast: {
    // High contrast
  },
  filter_saturated: {
    // Increased saturation
  },
  filter_faded: {
    // Faded/washed out look
    opacity: 0.8,
  },
  filter_dramatic: {
    // High contrast, deep shadows
  },
  filter_soft: {
    // Soft, dreamy look
    opacity: 0.9,
  },
  filter_sharp: {
    // Enhanced sharpness
  },
  filter_retro: {
    // Retro/vintage look
  },
  filter_modern: {
    // Clean, modern look
  },
});
