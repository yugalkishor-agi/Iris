import React from 'react';
import ComingSoonScreen from '../components/ui/ComingSoonScreen';

export default function LanguageSettingsScreen() {
  return (
    <ComingSoonScreen
      title="Language"
      description="Language controls are intentionally disabled for now so localization can ship in a stable production state later."
      groups={[
        {
          title: 'Personalization',
          items: ['Appearance', 'Language'],
        },
      ]}
    />
  );
}
