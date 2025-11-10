import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Two-Factor Authentication',
  sections: [
    {
      title: 'Security Method',
      items: [
        { label: 'SMS Authentication', type: 'toggle', icon: 'phone-portrait', value: false, onToggle: (v) => console.log('SMS:', v) },
        { label: 'Authenticator App', type: 'toggle', icon: 'shield-checkmark', value: false, onToggle: (v) => console.log('Auth:', v) },
      ],
    },
    {
      title: 'Backup Codes',
      items: [
        { label: 'Generate Backup Codes', type: 'action', icon: 'key', onPress: () => console.log('Generate') },
        { label: 'View Saved Codes', type: 'navigation', icon: 'list', navigateTo: 'BackupCodes' },
      ],
    },
  ],
});
