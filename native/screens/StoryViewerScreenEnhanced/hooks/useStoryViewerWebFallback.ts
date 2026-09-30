import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useStoryViewerStore } from '../useStoryViewerStore';

export function useStoryViewerWebFallback(
  currentStoryData: any,
  viewerUrl: string
) {
  const isEmulator = useStoryViewerStore(s => s.isEmulator);
  const setIsEmulator = useStoryViewerStore(s => s.setIsEmulator);
  const webErrorCount = useStoryViewerStore(s => s.webErrorCount);
  const setWebErrorCount = useStoryViewerStore(s => s.setWebErrorCount);
  const preferSoftwareLayer = useStoryViewerStore(s => s.preferSoftwareLayer);
  const setPreferSoftwareLayer = useStoryViewerStore(s => s.setPreferSoftwareLayer);
  const sessionForceNative = useStoryViewerStore(s => s.sessionForceNative);
  const setSessionForceNative = useStoryViewerStore(s => s.setSessionForceNative);
  const webViewKey = useStoryViewerStore(s => s.webViewKey);
  const setWebViewKey = useStoryViewerStore(s => s.setWebViewKey);
  const setWebRendererFailed = useStoryViewerStore(s => s.setWebRendererFailed);
  const setWebRendererReady = useStoryViewerStore(s => s.setWebRendererReady);

  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check emulator
  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('expo-device').then(Device => {
        setIsEmulator(!Device.isDevice);
      }).catch(() => { });
    }
  }, [setIsEmulator]);

  // Determine webview usage
  const useWebView = Platform.OS !== 'web'
    && !sessionForceNative
    && (currentStoryData?.drawings?.length > 0 || currentStoryData?.textElements?.length > 0 || currentStoryData?.stickers?.length > 0);
  
  const useExternalViewer = useWebView && viewerUrl && Platform.OS === 'android';

  const handleWebViewFailure = (reason: string) => {
    console.warn(`[StoryViewerExternal] Falling back to native rendering due to: ${reason}`);
    setWebErrorCount((c: number) => c + 1);
    
    if (webErrorCount >= 1 && !preferSoftwareLayer && Platform.OS === 'android') {
      setPreferSoftwareLayer(true);
      setWebViewKey((k: number) => k + 1);
      return;
    }
    
    setWebRendererFailed(true);
    setSessionForceNative(true);
  };

  const handleViewerMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'VIEWER_READY') {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        setWebRendererReady(true);
      } else if (data.type === 'VIEWER_ERROR') {
        handleWebViewFailure(`Viewer reported error: ${data.error}`);
      }
    } catch { }
  };

  // Reset web state on story change
  useEffect(() => {
    setWebRendererReady(false);
    setWebRendererFailed(false);
    if (useWebView) {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => {
        setWebRendererFailed(true);
      }, 8000);
    }
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [currentStoryData, useWebView, setWebRendererReady, setWebRendererFailed]);

  return {
    useWebView,
    useExternalViewer,
    handleWebViewFailure,
    handleViewerMessage,
    preferSoftwareLayer,
    webViewKey
  };
}
