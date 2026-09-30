import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Who Can Comment',
  sections: [
    {
      title: 'Comment Access',
      items: [
        {
          label: 'Everyone',
          type: 'action',
          icon: 'globe',
          description: 'Anyone who can view your post can comment on it.',
          settingKey: 'whoCanComment',
          settingScope: 'privacy',
          settingValue: 'everyone',
        },
        {
          label: 'People You Follow',
          type: 'action',
          icon: 'people',
          description: 'Only accounts you follow can comment directly.',
          settingKey: 'whoCanComment',
          settingScope: 'privacy',
          settingValue: 'following',
        },
        {
          label: 'Your Followers',
          type: 'action',
          icon: 'person-add',
          description: 'Limit comments to people who follow you.',
          settingKey: 'whoCanComment',
          settingScope: 'privacy',
          settingValue: 'followers',
        },
        {
          label: 'No One',
          type: 'action',
          icon: 'chatbubble-ellipses',
          description: 'Turn off new comments without changing post visibility.',
          settingKey: 'whoCanComment',
          settingScope: 'privacy',
          settingValue: 'off',
        },
      ],
    },
  ],
});
