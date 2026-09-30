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
          badge: 'Coming soon',
          disabled: true,
        },
        {
          label: 'Saved Login Info',
          type: 'navigation',
          icon: 'save',
          navigateTo: 'SavedLogin',
          badge: 'Coming soon',
          disabled: true,
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
          settingKey: 'requireFaceId',
          settingScope: 'settings',
        },
        {
          label: 'App Lock',
          type: 'toggle',
          icon: 'lock-closed',
          value: false,
          settingKey: 'appLockEnabled',
          settingScope: 'settings',
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
          badge: 'Coming soon',
          disabled: true,
        },
        {
          label: 'Account Activity',
          type: 'navigation',
          icon: 'analytics',
          navigateTo: 'AccountActivity',
          badge: 'Coming soon',
          disabled: true,
        },
      ],
    },
  ],
});

export default SecuritySettingsScreenComponent;



