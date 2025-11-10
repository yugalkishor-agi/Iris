import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Sound & Haptics',
  sections: [
    {
      title: 'Sounds',
      items: [
        { label: 'Message Sounds', type: 'toggle', icon: 'volume-high', value: true, onToggle: (v) => console.log('Message:', v) },
        { label: 'Notification Sounds', type: 'toggle', icon: 'notifications', value: true, onToggle: (v) => console.log('Notif:', v) },
        { label: 'Like Sounds', type: 'toggle', icon: 'heart', value: false, onToggle: (v) => console.log('Like:', v) },
      ],
    },
    {
      title: 'Haptics',
      items: [
        { label: 'Haptic Feedback', type: 'toggle', icon: 'phone-portrait', value: true, onToggle: (v) => console.log('Haptic:', v) },
        { label: 'Strong Vibration', type: 'toggle', icon: 'radio', value: false, onToggle: (v) => console.log('Vibration:', v) },
      ],
    },
  ],
});
