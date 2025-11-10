import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Captions',
  sections: [
    {
      title: 'Display',
      items: [
        { label: 'Always Show Captions', type: 'toggle', icon: 'text', value: false, onToggle: (v) => console.log('Show:', v) },
        { label: 'Auto-Generated Captions', type: 'toggle', icon: 'sparkles', value: true, onToggle: (v) => console.log('Auto:', v) },
      ],
    },
    {
      title: 'Appearance',
      items: [
        { label: 'Caption Size', type: 'navigation', icon: 'resize', navigateTo: 'FontSize' },
        { label: 'Caption Style', type: 'navigation', icon: 'color-palette', navigateTo: 'CaptionStyle' },
      ],
    },
  ],
});
