import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Sound & Haptics',
  sections: [
    {
      title: 'Sounds',
      items: [
        { label: 'Message Sounds', type: 'toggle', icon: 'volume-high', value: true, settingKey: 'messageSounds', settingScope: 'settings' },
        { label: 'Notification Sounds', type: 'toggle', icon: 'notifications', value: true, settingKey: 'notificationSounds', settingScope: 'settings' },
        { label: 'Like Sounds', type: 'toggle', icon: 'heart', value: false, settingKey: 'likeSounds', settingScope: 'settings' },
      ],
    },
    {
      title: 'Haptics',
      items: [
        { label: 'Haptic Feedback', type: 'toggle', icon: 'phone-portrait', value: true, settingKey: 'hapticFeedback', settingScope: 'settings' },
        { label: 'Strong Vibration', type: 'toggle', icon: 'radio', value: false, settingKey: 'strongVibration', settingScope: 'settings' },
      ],
    },
  ],
});
