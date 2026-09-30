import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Data Usage',
  sections: [
    {
      title: 'Data Saver',
      items: [
        { label: 'Data Saver Mode', type: 'toggle', icon: 'speedometer', value: false, settingKey: 'dataSaverMode', settingScope: 'settings' },
        { label: 'Only Load on WiFi', type: 'toggle', icon: 'wifi', value: false, settingKey: 'wifiOnlyLoad', settingScope: 'settings' },
      ],
    },
    {
      title: 'Media Quality',
      items: [
        { label: 'Auto Download Photos', type: 'toggle', icon: 'image', value: true, settingKey: 'autoDownloadPhotos', settingScope: 'settings' },
        { label: 'Auto Download Videos', type: 'toggle', icon: 'videocam', value: false, settingKey: 'autoDownloadVideos', settingScope: 'settings' },
        { label: 'HD on Cellular', type: 'toggle', icon: 'cellular', value: false, settingKey: 'hdOnCellular', settingScope: 'settings' },
      ],
    },
    {
      title: 'Storage',
      items: [
        { label: 'Storage Usage', type: 'navigation', icon: 'server', navigateTo: 'StorageUsage' },
        { label: 'Clear Cache', type: 'navigation', icon: 'trash', navigateTo: 'CacheManagement' },
      ],
    },
  ],
});
