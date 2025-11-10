import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Language',
  sections: [
    {
      items: [
        { label: 'English', type: 'action', icon: 'checkmark-circle', onPress: () => console.log('EN') },
        { label: 'हिंदी (Hindi)', type: 'action', icon: 'radio-button-off', onPress: () => console.log('HI') },
        { label: 'Español', type: 'action', icon: 'radio-button-off', onPress: () => console.log('ES') },
        { label: 'Français', type: 'action', icon: 'radio-button-off', onPress: () => console.log('FR') },
        { label: '中文', type: 'action', icon: 'radio-button-off', onPress: () => console.log('ZH') },
        { label: '日本語', type: 'action', icon: 'radio-button-off', onPress: () => console.log('JA') },
        { label: 'العربية', type: 'action', icon: 'radio-button-off', onPress: () => console.log('AR') },
        { label: 'Português', type: 'action', icon: 'radio-button-off', onPress: () => console.log('PT') },
      ],
    },
  ],
});
