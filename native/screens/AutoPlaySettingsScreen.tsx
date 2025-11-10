import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Auto-Play',
  sections: [
    {
      title: 'Videos',
      items: [
        { label: 'Auto-Play Videos', type: 'toggle', icon: 'play-circle', value: true, onToggle: (v) => console.log('Videos:', v) },
        { label: 'Auto-Play on WiFi Only', type: 'toggle', icon: 'wifi', value: false, onToggle: (v) => console.log('WiFi:', v) },
        { label: 'Mute Videos by Default', type: 'toggle', icon: 'volume-mute', value: true, onToggle: (v) => console.log('Mute:', v) },
      ],
    },
    {
      title: 'Stories',
      items: [
        { label: 'Auto-Play Stories', type: 'toggle', icon: 'play-forward', value: true, onToggle: (v) => console.log('Stories:', v) },
        { label: 'Auto-Advance to Next Story', type: 'toggle', icon: 'chevron-forward', value: true, onToggle: (v) => console.log('Advance:', v) },
      ],
    },
  ],
});
