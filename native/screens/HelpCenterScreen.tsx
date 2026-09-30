import React from 'react';
import { createSettingsScreen } from '../templates/SettingsTemplate';

export default createSettingsScreen({
  title: 'Help Center',
  sections: [
    {
      title: 'Guides',
      items: [
        { label: 'FAQ', type: 'navigation', icon: 'help-circle', navigateTo: 'FAQ', description: 'Fast answers for the most common account and privacy questions.' },
        { label: 'Community Guidelines', type: 'navigation', icon: 'book', navigateTo: 'Guidelines', description: 'Review the rules for posts, messages, stories, and profile activity.' },
        { label: 'Privacy Policy', type: 'navigation', icon: 'shield-checkmark', navigateTo: 'PrivacyPolicy', description: 'See how Iris stores, protects, and uses account data.' },
      ],
    },
    {
      title: 'Account & Safety',
      items: [
        { label: 'Privacy Settings', type: 'navigation', icon: 'lock-closed', navigateTo: 'PrivacySettings', description: 'Manage who can message, comment, tag, and see your activity.' },
        { label: 'Account Security', type: 'navigation', icon: 'shield', navigateTo: 'SecuritySettings', description: 'Review passwords, login protection, and saved sessions.' },
        { label: 'Account Activity', type: 'navigation', icon: 'time', navigateTo: 'AccountActivity', description: 'Check recent account events and active device history.', badge: 'Coming soon', disabled: true },
        { label: 'Download Your Data', type: 'navigation', icon: 'download', navigateTo: 'DownloadData', description: 'Request an export without leaving the app.', badge: 'Coming soon', disabled: true },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Report a Problem', type: 'navigation', icon: 'flag', navigateTo: 'ReportProblem', description: 'Send bug details, broken flows, or upload issues in one submission.' },
        { label: 'Contact Support', type: 'navigation', icon: 'mail', navigateTo: 'ContactSupport', description: 'Reach support for account help, billing, or moderation follow-up.' },
        { label: 'Notification Settings', type: 'navigation', icon: 'notifications', navigateTo: 'NotificationSettings', description: 'Tune messages, follows, reminders, and product alerts.' },
        { label: 'Storage Usage', type: 'navigation', icon: 'server', navigateTo: 'StorageUsage', description: 'Review downloaded media and app storage footprint.' },
      ],
    },
  ],
});

