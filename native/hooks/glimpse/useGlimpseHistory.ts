// useGlimpseHistory.ts
// Purpose: Undo/redo history management for glimpse editor
// Extracted from: NativeGlimpseEditor.tsx — Session 001

import { useCallback, useEffect, useRef, useState } from 'react';
import { snapshotsEqual } from '../../utils/glimpse/glimpseEditorUtils';
import type { EditorHistorySnapshot } from '../../utils/glimpse/glimpseEditorTypes';

interface UseGlimpseHistoryProps {
  visible: boolean;
  createSnapshot: () => EditorHistorySnapshot;
  onApplySnapshot: (snapshot: EditorHistorySnapshot) => void;
}

export function useGlimpseHistory({
  visible,
  createSnapshot,
  onApplySnapshot,
}: UseGlimpseHistoryProps) {
  const historyRef = useRef<EditorHistorySnapshot[]>([]);
  const historyIndexRef = useRef(0);
  const historyReadyRef = useRef(false);
  const skipHistoryRef = useRef(false);

  const [history, setHistory] = useState<EditorHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const seedHistory = useCallback((initialSnapshot: EditorHistorySnapshot) => {
    historyRef.current = [initialSnapshot];
    historyIndexRef.current = 0;
    setHistory([initialSnapshot]);
    setHistoryIndex(0);
    historyReadyRef.current = true;
    skipHistoryRef.current = true;
  }, []);

  const commitSnapshot = useCallback((snapshot?: EditorHistorySnapshot) => {
    if (!visible || !historyReadyRef.current) return;

    const nextSnapshot = snapshot || createSnapshot();
    const base = historyRef.current.slice(0, historyIndexRef.current + 1);
    const previous = base[base.length - 1];

    if (snapshotsEqual(previous, nextSnapshot)) return;

    const nextHistory = [...base, nextSnapshot];
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }, [createSnapshot, visible]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;

    const nextIndex = historyIndexRef.current - 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;

    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    skipHistoryRef.current = true;
    onApplySnapshot(snapshot);
  }, [onApplySnapshot]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    const nextIndex = historyIndexRef.current + 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;

    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    skipHistoryRef.current = true;
    onApplySnapshot(snapshot);
  }, [onApplySnapshot]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    history,
    historyIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    commitSnapshot,
    seedHistory,
    skipHistoryRef,
  };
}
