import { useEffect, useCallback } from 'react';
import { useGlimpseEditorStore } from '@/stores/glimpseEditorStore';

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: ShortcutHandler;
  preventDefault?: boolean;
  description?: string;
}

export function useKeyboardShortcuts() {
  const {
    setActiveTool,
    isPlaying,
    togglePlayback,
    seekToTime,
    currentTime,
    duration,
    zoomLevel,
    setZoomLevel,
    selectedTextId,
    selectedStickerId,
    deleteTextLayer,
    deleteStickerLayer,
    addHistoryEntry,
    undoAction,
    redoAction,
    saveProject,
  } = useGlimpseEditorStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      return;
    }

    const shortcuts: ShortcutConfig[] = [
      // General shortcuts
      {
        key: 's',
        ctrlKey: true,
        handler: () => saveProject(),
        preventDefault: true,
        description: 'Save project'
      },
      {
        key: 'z',
        ctrlKey: true,
        handler: () => undoAction(),
        preventDefault: true,
        description: 'Undo'
      },
      {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        handler: () => redoAction(),
        preventDefault: true,
        description: 'Redo'
      },
      {
        key: 'Escape',
        handler: () => setActiveTool('none'),
        description: 'Close current panel'
      },

      // Playback shortcuts
      {
        key: ' ',
        handler: () => togglePlayback(),
        description: 'Play/Pause'
      },
      {
        key: 'ArrowLeft',
        handler: () => seekToTime(Math.max(0, currentTime - 1)),
        description: 'Step backward'
      },
      {
        key: 'ArrowRight',
        handler: () => seekToTime(Math.min(duration, currentTime + 1)),
        description: 'Step forward'
      },
      {
        key: 'Home',
        handler: () => seekToTime(0),
        description: 'Go to start'
      },
      {
        key: 'End',
        handler: () => seekToTime(duration),
        description: 'Go to end'
      },

      // Timeline shortcuts
      {
        key: '+',
        ctrlKey: true,
        handler: () => setZoomLevel(Math.min(10, zoomLevel + 0.5)),
        preventDefault: true,
        description: 'Zoom in'
      },
      {
        key: '-',
        ctrlKey: true,
        handler: () => setZoomLevel(Math.max(0.5, zoomLevel - 0.5)),
        preventDefault: true,
        description: 'Zoom out'
      },
      {
        key: '0',
        ctrlKey: true,
        handler: () => setZoomLevel(1),
        preventDefault: true,
        description: 'Reset zoom'
      },

      // Tool shortcuts
      {
        key: 't',
        handler: () => setActiveTool('text'),
        description: 'Text tool'
      },
      {
        key: 's',
        handler: () => setActiveTool('sticker'),
        description: 'Sticker tool'
      },
      {
        key: 'f',
        handler: () => setActiveTool('filter'),
        description: 'Filter tool'
      },
      {
        key: 'a',
        handler: () => setActiveTool('audio'),
        description: 'Audio tool'
      },

      // Element shortcuts
      {
        key: 'Delete',
        handler: () => {
          if (selectedTextId) {
            deleteTextLayer(selectedTextId);
          } else if (selectedStickerId) {
            deleteStickerLayer(selectedStickerId);
          }
        },
        description: 'Delete selected'
      },
      {
        key: 'd',
        ctrlKey: true,
        handler: () => {
          // Duplicate functionality would be implemented here
          console.log('Duplicate selected element');
        },
        preventDefault: true,
        description: 'Duplicate selected'
      },
    ];

    // Find and execute matching shortcut
    for (const shortcut of shortcuts) {
      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!shortcut.ctrlKey === (e.ctrlKey || e.metaKey) &&
        !!shortcut.shiftKey === e.shiftKey &&
        !!shortcut.altKey === e.altKey
      ) {
        if (shortcut.preventDefault) {
          e.preventDefault();
        }
        shortcut.handler(e);
        break;
      }
    }
  }, [
    setActiveTool,
    isPlaying,
    togglePlayback,
    seekToTime,
    currentTime,
    duration,
    zoomLevel,
    setZoomLevel,
    selectedTextId,
    selectedStickerId,
    deleteTextLayer,
    deleteStickerLayer,
    addHistoryEntry,
    undoAction,
    redoAction,
    saveProject,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Return all available shortcuts for documentation
  const getAvailableShortcuts = () => {
    return [
      { keys: ['Ctrl', 'S'], description: 'Save project' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Esc'], description: 'Close current panel' },
      { keys: ['Space'], description: 'Play/Pause' },
      { keys: ['←'], description: 'Step backward' },
      { keys: ['→'], description: 'Step forward' },
      { keys: ['Home'], description: 'Go to start' },
      { keys: ['End'], description: 'Go to end' },
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Reset zoom' },
      { keys: ['T'], description: 'Text tool' },
      { keys: ['S'], description: 'Sticker tool' },
      { keys: ['F'], description: 'Filter tool' },
      { keys: ['A'], description: 'Audio tool' },
      { keys: ['Delete'], description: 'Delete selected' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selected' },
    ];
  };

  return { getAvailableShortcuts };
}