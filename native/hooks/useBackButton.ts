import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Custom hook to handle Android/iOS hardware back button
 * Exits app only when on home page, otherwise navigates back
 */
export function useBackButton(customHandler?: () => void) {
  const navigation: any = useNavigation();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      if (typeof customHandler === 'function') {
        customHandler();
        return true;
      }
      if (navigation?.canGoBack?.()) {
        navigation.goBack();
        return true;
      }
      return false; // allow system to handle (exit app)
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [customHandler, navigation]);

  // Helper function for programmatic back navigation
  const goBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
  };

  return { goBack };
}
