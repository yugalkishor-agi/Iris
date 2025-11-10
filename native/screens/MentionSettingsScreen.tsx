import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Mentions',
  sections: [
    {
      title: 'Allow Mentions From',
      items: [
        { label: 'Everyone', type: 'action', icon: 'globe', onPress: () => console.log('Everyone') },
        { label: 'People You Follow', type: 'action', icon: 'people', onPress: () => console.log('Following') },
        { label: 'No One', type: 'action', icon: 'close-circle', onPress: () => console.log('None') },
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'Manual Mention Approval', type: 'toggle', icon: 'checkmark-done', value: false, onToggle: (v) => console.log('Manual:', v) },
      ],
    },
  ],
});
