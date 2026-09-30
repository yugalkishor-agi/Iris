import { useCallback, useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

interface UseGlimpseToolsProps {
  mediaUri: string;
  setActiveTool: (tool: any) => void;
  setComposerVisible: (val: boolean) => void;
  openComposer: () => void;
}

export function useGlimpseTools({
  mediaUri,
  setActiveTool,
  setComposerVisible,
  openComposer,
}: UseGlimpseToolsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleToolPress = useCallback((tool: string) => {
    if (tool === 'text') {
      openComposer();
      return;
    }
    if (tool === 'download') {
      void handleDownload();
      return;
    }
    setComposerVisible(false);
    Keyboard.dismiss();
    setActiveTool((prev: any) => (prev === tool ? null : tool));
  }, [openComposer, setActiveTool, setComposerVisible]);

  const handleDownload = useCallback(async () => {
    try {
      setDownloading(true);
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Gallery permission is needed to export media.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(mediaUri);
      Alert.alert('Saved', 'Media exported to your gallery.');
    } catch {
      Alert.alert('Export failed', 'Could not save media right now.');
    } finally {
      setDownloading(false);
      setActiveTool(null);
    }
  }, [mediaUri, setActiveTool]);

  return {
    downloading,
    handleToolPress,
    handleDownload,
  };
}
