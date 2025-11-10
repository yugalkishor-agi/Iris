import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

const SecuritySettingsScreenComponent = createSettingsScreen({
  title: 'Security',
  sections: [
    {
      title: 'Login Security',
      items: [
        {
          label: 'Two-Factor Authentication',
          type: 'navigation',
          icon: 'shield-checkmark',
          navigateTo: 'TwoFactorAuth',
        },
        {
          label: 'Login Activity',
          type: 'navigation',
          icon: 'time',
          navigateTo: 'LoginActivity',
        },
        {
          label: 'Saved Login Info',
          type: 'navigation',
          icon: 'save',
          navigateTo: 'SavedLoginInfo',
        },
      ],
    },
    {
      title: 'App Security',
      items: [
        {
          label: 'Require Face ID',
          type: 'toggle',
          icon: 'scan',
          value: false,
          onToggle: (value) => console.log('FaceID:', value),
        },
        {
          label: 'App Lock',
          type: 'toggle',
          icon: 'lock-closed',
          value: false,
          onToggle: (value) => console.log('AppLock:', value),
        },
      ],
    },
    {
      title: 'Data & Permissions',
      items: [
        {
          label: 'Apps and Websites',
          type: 'navigation',
          icon: 'globe',
          navigateTo: 'AppsWebsites',
        },
        {
          label: 'Account Activity',
          type: 'navigation',
          icon: 'analytics',
          navigateTo: 'AccountActivity',
        },
      ],
    },
  ],
});

export default SecuritySettingsScreenComponent;
