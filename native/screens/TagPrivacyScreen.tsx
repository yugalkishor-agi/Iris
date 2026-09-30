import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Who Can Tag You',
  sections: [
    {
      title: 'Tag Permissions',
      items: [
        {
          label: 'Everyone',
          type: 'action',
          icon: 'globe',
          description: 'Anyone can tag you in posts, stories, and glimpses.',
          settingKey: 'whoCanTag',
          settingScope: 'privacy',
          settingValue: 'everyone',
        },
        {
          label: 'People You Follow',
          type: 'action',
          icon: 'people',
          description: 'Only accounts you follow can tag you.',
          settingKey: 'whoCanTag',
          settingScope: 'privacy',
          settingValue: 'following',
        },
        {
          label: 'Your Followers',
          type: 'action',
          icon: 'person-add',
          description: 'Restrict tags to people already following you.',
          settingKey: 'whoCanTag',
          settingScope: 'privacy',
          settingValue: 'followers',
        },
      ],
    },
  ],
});
