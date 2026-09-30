import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Auto-Play',
  sections: [
    {
      title: 'Videos',
      items: [
        { label: 'Auto-Play Videos', type: 'toggle', icon: 'play-circle', value: true, settingKey: 'autoPlayVideos', settingScope: 'settings' },
        { label: 'Auto-Play on WiFi Only', type: 'toggle', icon: 'wifi', value: false, settingKey: 'autoplayWifiOnly', settingScope: 'settings' },
        { label: 'Mute Videos by Default', type: 'toggle', icon: 'volume-mute', value: true, settingKey: 'muteAutoplayVideos', settingScope: 'settings' },
      ],
    },
    {
      title: 'Stories',
      items: [
        { label: 'Auto-Play Stories', type: 'toggle', icon: 'play-forward', value: true, settingKey: 'autoPlayStories', settingScope: 'settings' },
        { label: 'Auto-Advance to Next Story', type: 'toggle', icon: 'chevron-forward', value: true, settingKey: 'autoAdvanceStories', settingScope: 'settings' },
      ],
    },
  ],
});
