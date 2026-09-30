import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    width: screenWidth - 40,
    maxHeight: screenHeight * 0.8,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputSection: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  textInput: {
    fontSize: 24,
    fontWeight: 'bold',
    minHeight: 80,
    width: '100%',
    textAlignVertical: 'center',
    padding: 10,
    borderRadius: 10,
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 5,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  backgroundPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  quickActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeQuickAction: {
    borderColor: '#007AFF',
  },
  quickActionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Picker Modal Styles
  pickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },

  // Color Picker
  colorPickerContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    maxWidth: screenWidth - 40,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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

  // Font Picker
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

  // Background Picker
  backgroundPickerContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    maxWidth: screenWidth - 40,
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  backgroundOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBackground: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  transparentBackground: {
    backgroundColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
});
