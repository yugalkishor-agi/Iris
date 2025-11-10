import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Help Center',
  sections: [
    {
      title: 'Getting Started',
      items: [
        { label: 'Create Your First Post', type: 'navigation', icon: 'add-circle', navigateTo: 'HelpPost' },
        { label: 'Add Friends', type: 'navigation', icon: 'people', navigateTo: 'HelpFriends' },
        { label: 'Explore Features', type: 'navigation', icon: 'compass', navigateTo: 'HelpFeatures' },
      ],
    },
    {
      title: 'Account & Privacy',
      items: [
        { label: 'Privacy Settings', type: 'navigation', icon: 'lock-closed', navigateTo: 'HelpPrivacy' },
        { label: 'Account Security', type: 'navigation', icon: 'shield', navigateTo: 'HelpSecurity' },
        { label: 'Manage Notifications', type: 'navigation', icon: 'notifications', navigateTo: 'HelpNotifications' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Report a Problem', type: 'navigation', icon: 'flag', navigateTo: 'ReportProblem' },
        { label: 'Contact Support', type: 'navigation', icon: 'mail', navigateTo: 'ContactSupport' },
        { label: 'FAQ', type: 'navigation', icon: 'help-circle', navigateTo: 'FAQ' },
      ],
    },
  ],
});
