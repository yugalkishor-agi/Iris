import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Who Can Message You',
  sections: [
    {
      title: 'Message Requests',
      items: [
        {
          label: 'Everyone',
          type: 'action',
          icon: 'globe',
          description: 'People outside your network can still message or request.',
          settingKey: 'whoCanMessage',
          settingScope: 'privacy',
          settingValue: 'everyone',
        },
        {
          label: 'Followers',
          type: 'action',
          icon: 'people',
          description: 'Only followers can reach your inbox directly.',
          settingKey: 'whoCanMessage',
          settingScope: 'privacy',
          settingValue: 'followers',
        },
      ],
    },
  ],
});
