import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Accessibility',
  sections: [
    {
      title: 'Visual',
      items: [
        { label: 'Increase Text Size', type: 'navigation', icon: 'text', navigateTo: 'FontSize' },
        { label: 'High Contrast', type: 'toggle', icon: 'contrast', value: false, onToggle: (v) => console.log('Contrast:', v) },
        { label: 'Reduce Motion', type: 'toggle', icon: 'swap-horizontal', value: false, onToggle: (v) => console.log('Motion:', v) },
        { label: 'Reduce Transparency', type: 'toggle', icon: 'layers', value: false, onToggle: (v) => console.log('Trans:', v) },
      ],
    },
    {
      title: 'Audio',
      items: [
        { label: 'Auto-play Videos', type: 'toggle', icon: 'play-circle', value: true, onToggle: (v) => console.log('Autoplay:', v) },
        { label: 'Captions', type: 'toggle', icon: 'text', value: false, onToggle: (v) => console.log('Captions:', v) },
        { label: 'Sound Effects', type: 'toggle', icon: 'volume-high', value: true, onToggle: (v) => console.log('Sound:', v) },
      ],
    },
    {
      title: 'Interaction',
      items: [
        { label: 'Tap to Show Full Caption', type: 'toggle', icon: 'hand-left', value: true, onToggle: (v) => console.log('Tap:', v) },
        { label: 'Haptic Feedback', type: 'toggle', icon: 'phone-portrait', value: true, onToggle: (v) => console.log('Haptic:', v) },
      ],
    },
  ],
});
