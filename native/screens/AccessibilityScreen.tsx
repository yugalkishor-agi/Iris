import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Accessibility',
  sections: [
    {
      title: 'Visual',
      items: [
        { label: 'Increase Text Size', type: 'navigation', icon: 'text', navigateTo: 'FontSize' },
        { label: 'High Contrast', type: 'toggle', icon: 'contrast', value: false, settingKey: 'highContrastMode', settingScope: 'settings' },
        { label: 'Reduce Motion', type: 'toggle', icon: 'swap-horizontal', value: false, settingKey: 'reduceMotion', settingScope: 'settings' },
        { label: 'Reduce Transparency', type: 'toggle', icon: 'layers', value: false, settingKey: 'reduceTransparency', settingScope: 'settings' },
      ],
    },
    {
      title: 'Audio',
      items: [
        { label: 'Auto-play Videos', type: 'toggle', icon: 'play-circle', value: true, settingKey: 'accessibilityAutoplayVideos', settingScope: 'settings' },
        { label: 'Captions', type: 'navigation', icon: 'text', navigateTo: 'CaptionsSettings' },
        { label: 'Sound Effects', type: 'navigation', icon: 'volume-high', navigateTo: 'SoundSettings' },
      ],
    },
    {
      title: 'Interaction',
      items: [
        { label: 'Tap to Show Full Caption', type: 'toggle', icon: 'hand-left', value: true, settingKey: 'tapToExpandCaption', settingScope: 'settings' },
        { label: 'Haptic Feedback', type: 'toggle', icon: 'phone-portrait', value: true, settingKey: 'hapticFeedback', settingScope: 'settings' },
      ],
    },
  ],
});
