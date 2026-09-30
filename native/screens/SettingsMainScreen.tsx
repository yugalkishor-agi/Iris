import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Settings',
  sections: [
    {
      title: 'Account',
      items: [
        { label: 'Edit Profile', type: 'navigation', icon: 'person', navigateTo: 'EditProfile' },
        { label: 'Account', type: 'navigation', icon: 'key', navigateTo: 'AccountSettings' },
        { label: 'Privacy', type: 'navigation', icon: 'lock-closed', navigateTo: 'PrivacySettings' },
        { label: 'Security', type: 'navigation', icon: 'shield', navigateTo: 'SecuritySettings' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Notifications', type: 'navigation', icon: 'notifications', navigateTo: 'NotificationSettings' },
        { label: 'Appearance', type: 'navigation', icon: 'color-palette', navigateTo: 'AppearanceSettings', badge: 'Coming soon', disabled: true },
        { label: 'Language', type: 'navigation', icon: 'language', navigateTo: 'LanguageSettings', badge: 'Coming soon', disabled: true },
        { label: 'Accessibility', type: 'navigation', icon: 'accessibility', navigateTo: 'Accessibility' },
        { label: 'Data Usage', type: 'navigation', icon: 'cellular', navigateTo: 'DataUsage' },
      ],
    },
    {
      title: 'Content',
      items: [
        { label: 'Saved', type: 'navigation', icon: 'bookmark', navigateTo: 'SavedPosts' },
        { label: 'Archive', type: 'navigation', icon: 'archive', navigateTo: 'Archive' },
        { label: 'Liked Posts', type: 'navigation', icon: 'heart', navigateTo: 'LikedPosts' },
        { label: 'Close Friends', type: 'navigation', icon: 'star', navigateTo: 'CloseFriends' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', type: 'navigation', icon: 'help-circle', navigateTo: 'HelpCenter' },
        { label: 'About', type: 'navigation', icon: 'information-circle', navigateTo: 'About' },
        { label: 'Terms', type: 'navigation', icon: 'document-text', navigateTo: 'Terms' },
        { label: 'Privacy Policy', type: 'navigation', icon: 'shield-checkmark', navigateTo: 'PrivacyPolicy' },
        { label: 'Guidelines', type: 'navigation', icon: 'list', navigateTo: 'Guidelines' },
      ],
    },
    {
      title: 'Actions',
      items: [
        { label: 'Log Out', type: 'action', icon: 'log-out', danger: true, onPress: () => console.log('Logout') },
      ],
    },
  ],
});

