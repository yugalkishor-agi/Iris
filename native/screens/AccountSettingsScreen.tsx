import React from 'react';
import { Alert } from 'react-native';
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
          navigateTo: 'EmailPhoneSettings',
        },
        {
          label: 'Change Password',
          type: 'navigation',
          icon: 'key',
          navigateTo: 'ChangePassword',
        },
        {
          label: 'Two-Factor Authentication',
          type: 'navigation',
          icon: 'shield-checkmark',
          navigateTo: 'TwoFactorAuth',
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
        },
        {
          label: 'Storage Usage',
          type: 'navigation',
          icon: 'server',
          navigateTo: 'StorageUsage',
        },
        {
          label: 'Clear Cache',
          type: 'action',
          icon: 'trash',
          onPress: () => Alert.alert('Cache Cleared', 'App cache has been cleared'),
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
