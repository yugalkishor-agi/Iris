import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Data Usage',
  sections: [
    {
      title: 'Data Saver',
      items: [
        { label: 'Data Saver Mode', type: 'toggle', icon: 'speedometer', value: false, onToggle: (v) => console.log('Saver:', v) },
        { label: 'Only Load on WiFi', type: 'toggle', icon: 'wifi', value: false, onToggle: (v) => console.log('WiFi:', v) },
      ],
    },
    {
      title: 'Media Quality',
      items: [
        { label: 'Auto Download Photos', type: 'toggle', icon: 'image', value: true, onToggle: (v) => console.log('Photos:', v) },
        { label: 'Auto Download Videos', type: 'toggle', icon: 'videocam', value: false, onToggle: (v) => console.log('Videos:', v) },
        { label: 'HD on Cellular', type: 'toggle', icon: 'cellular', value: false, onToggle: (v) => console.log('HD:', v) },
      ],
    },
    {
      title: 'Storage',
      items: [
        { label: 'Storage Usage', type: 'navigation', icon: 'server', navigateTo: 'StorageUsage' },
        { label: 'Clear Cache', type: 'action', icon: 'trash', onPress: () => console.log('Clear cache') },
      ],
    },
  ],
});
