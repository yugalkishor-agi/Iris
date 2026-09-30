import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Mentions',
  sections: [
    {
      title: 'Allow Mentions From',
      items: [
        { label: 'Everyone', type: 'action', icon: 'globe', settingKey: 'mentionPermission', settingScope: 'privacy', settingValue: 'everyone' },
        { label: 'People You Follow', type: 'action', icon: 'people', settingKey: 'mentionPermission', settingScope: 'privacy', settingValue: 'following' },
        { label: 'No One', type: 'action', icon: 'close-circle', settingKey: 'mentionPermission', settingScope: 'privacy', settingValue: 'none' },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          label: 'Manual Mention Approval',
          type: 'toggle',
          icon: 'checkmark-done',
          value: false,
          settingKey: 'manualMentionApproval',
          settingScope: 'privacy',
        },
      ],
    },
  ],
});
