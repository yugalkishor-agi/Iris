import React from 'react';
import GlimpseViewerScreenEnhanced from './GlimpseViewerScreenEnhanced';

// Legacy alias: always route all glimpse viewing through the enhanced viewer
// so every entry point gets the same UI/behavior.
export default function GlimpseViewerScreen() {
  return <GlimpseViewerScreenEnhanced />;
}

