import React, { useState } from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Appearance',
  sections: [
    {
      title: 'Theme',
      items: [
        { label: 'Dark Mode', type: 'toggle', icon: 'moon', value: false, onToggle: (v) => console.log('Dark:', v) },
        { label: 'Auto Dark Mode', type: 'toggle', icon: 'partly-sunny', value: false, onToggle: (v) => console.log('Auto:', v) },
      ],
    },
    {
      title: 'Display',
      items: [
        { label: 'Font Size', type: 'navigation', icon: 'text', navigateTo: 'FontSize' },
        { label: 'Accent Color', type: 'navigation', icon: 'color-palette', navigateTo: 'AccentColor' },
        { label: 'App Icon', type: 'navigation', icon: 'apps', navigateTo: 'AppIcon' },
      ],
    },
    {
      title: 'Media',
      items: [
        { label: 'Auto-play Videos', type: 'toggle', icon: 'play-circle', value: true, onToggle: (v) => console.log('Autoplay:', v) },
        { label: 'High Quality Uploads', type: 'toggle', icon: 'image', value: true, onToggle: (v) => console.log('HQ:', v) },
        { label: 'Save to Camera Roll', type: 'toggle', icon: 'download', value: false, onToggle: (v) => console.log('Save:', v) },
      ],
    },
  ],
});
