import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0,
  },
  
  // Animation states
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  normal: {
    transform: [{ scale: 1 }],
  },
  
  // Size variants
  small: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  medium: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  large: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  
  // Color variants
  primary: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
  },
  success: {
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
  },
  warning: {
    backgroundColor: '#F093FB',
    shadowColor: '#F093FB',
  },
});
