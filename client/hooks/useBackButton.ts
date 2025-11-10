import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Custom hook to handle Android/iOS hardware back button
 * Exits app only when on home page, otherwise navigates back
 */
export function useBackButton(customHandler?: () => void) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only handle back button on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let listenerHandle: any = null;

    const setupListener = async () => {
      listenerHandle = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        const currentPath = location.pathname;

        // Define home routes where back button should exit app
        const homeRoutes = ['/', '/home', '/index'];
        const isHomePage = homeRoutes.includes(currentPath);

        if (customHandler) {
          customHandler();
          return;
        }

        // If on home page, exit app
        if (isHomePage) {
          CapacitorApp.exitApp();
        } 
        // If can go back in history, navigate back
        else if (canGoBack) {
          navigate(-1);
        } 
        // Otherwise go to home
        else {
          navigate('/');
        }
      });
    };

    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [customHandler, location.pathname, navigate]);

  // Helper function for programmatic back navigation
  const goBack = (fallbackPath?: string) => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigate('/');
    }
  };

  return { goBack };
}
