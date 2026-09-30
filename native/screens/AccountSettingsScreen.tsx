import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

const AccountSettingsScreenComponent = createSettingsScreen({
  title: 'Account',
  sections: [
    {
      title: 'Account Information',
      items: [
        {
          label: 'Email & Phone',
          type: 'navigation',
          icon: 'mail',
          navigateTo: 'EmailPhone',
        },
        {
          label: 'Change Password',
          type: 'navigation',
          icon: 'key',
          navigateTo: 'ChangePassword',
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          label: 'Download Your Data',
          type: 'navigation',
          icon: 'download',
          navigateTo: 'DownloadData',
          badge: 'Coming soon',
          disabled: true,
        },
        {
          label: 'Storage Usage',
          type: 'navigation',
          icon: 'server',
          navigateTo: 'StorageUsage',
        },
        {
          label: 'Clear Cache',
          type: 'navigation',
          icon: 'trash',
          navigateTo: 'CacheManagement',
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          label: 'Deactivate Account',
          type: 'navigation',
          icon: 'pause-circle',
          navigateTo: 'DeactivateAccount',
          danger: true,
        },
        {
          label: 'Delete Account',
          type: 'navigation',
          icon: 'trash-bin',
          navigateTo: 'DeleteAccount',
          danger: true,
        },
      ],
    },
  ],
});

export default AccountSettingsScreenComponent;



