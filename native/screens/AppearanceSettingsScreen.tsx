import React from 'react';
import ComingSoonScreen from '../components/ui/ComingSoonScreen';

export default function AppearanceSettingsScreen() {
  return (
    <ComingSoonScreen
      title="Appearance"
      description="Personalization settings are intentionally disabled for now while the production-ready theming system is being rebuilt."
      groups={[
        {
          title: 'Personalization',
          items: ['Appearance', 'Language'],
        },
      ]}
    />
  );
}
