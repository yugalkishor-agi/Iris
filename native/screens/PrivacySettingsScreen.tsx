import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settings.service';
import { createSettingsScreen } from '../templates/SettingsTemplate';

const PrivacySettingsScreenComponent = createSettingsScreen({
  title: 'Privacy',
  sections: [
    {
      title: 'Account Privacy',
      items: [
        {
          label: 'Private Account',
          type: 'toggle',
          icon: 'lock-closed',
          value: false,
          onToggle: async (value) => {
            // Will be implemented with state management
            console.log('Private account:', value);
          },
        },
      ],
    },
    {
      title: 'Interactions',
      items: [
        {
          label: 'Who Can Message You',
          type: 'navigation',
          icon: 'chatbubble',
          navigateTo: 'MessagePrivacy',
        },
        {
          label: 'Who Can Comment',
          type: 'navigation',
          icon: 'chatbox',
          navigateTo: 'CommentPrivacy',
        },
        {
          label: 'Who Can Tag You',
          type: 'navigation',
          icon: 'pricetag',
          navigateTo: 'TagPrivacy',
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          label: 'Hide Story From',
          type: 'navigation',
          icon: 'eye-off',
          navigateTo: 'HideStory',
        },
        {
          label: 'Close Friends',
          type: 'navigation',
          icon: 'star',
          navigateTo: 'CloseFriends',
        },
      ],
    },
    {
      title: 'Blocked Accounts',
      items: [
        {
          label: 'Blocked Users',
          type: 'navigation',
          icon: 'ban',
          navigateTo: 'BlockedUsers',
        },
        {
          label: 'Muted Accounts',
          type: 'navigation',
          icon: 'volume-mute',
          navigateTo: 'MutedAccounts',
        },
      ],
    },
  ],
});

export default PrivacySettingsScreenComponent;
