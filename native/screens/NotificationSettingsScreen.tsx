import React, { useState } from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

const NotificationSettingsScreenComponent = createSettingsScreen({
  title: 'Notifications',
  sections: [
    {
      title: 'Push Notifications',
      items: [
        {
          label: 'Push Notifications',
          type: 'toggle',
          icon: 'notifications',
          value: true,
          onToggle: (value) => console.log('Push:', value),
        },
      ],
    },
    {
      title: 'Posts & Stories',
      items: [
        {
          label: 'Likes',
          type: 'toggle',
          icon: 'heart',
          value: true,
          onToggle: (value) => console.log('Likes:', value),
        },
        {
          label: 'Comments',
          type: 'toggle',
          icon: 'chatbubble',
          value: true,
          onToggle: (value) => console.log('Comments:', value),
        },
        {
          label: 'Mentions',
          type: 'toggle',
          icon: 'at',
          value: true,
          onToggle: (value) => console.log('Mentions:', value),
        },
      ],
    },
    {
      title: 'Following',
      items: [
        {
          label: 'New Followers',
          type: 'toggle',
          icon: 'person-add',
          value: true,
          onToggle: (value) => console.log('Followers:', value),
        },
        {
          label: 'Follow Requests',
          type: 'toggle',
          icon: 'mail',
          value: true,
          onToggle: (value) => console.log('Requests:', value),
        },
      ],
    },
    {
      title: 'Messages',
      items: [
        {
          label: 'Message Notifications',
          type: 'toggle',
          icon: 'chatbubbles',
          value: true,
          onToggle: (value) => console.log('Messages:', value),
        },
        {
          label: 'Group Messages',
          type: 'toggle',
          icon: 'people',
          value: true,
          onToggle: (value) => console.log('Groups:', value),
        },
      ],
    },
  ],
});

export default NotificationSettingsScreenComponent;
