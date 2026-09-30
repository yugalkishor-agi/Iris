import React from 'react';
import ComingSoonScreen from '../components/ui/ComingSoonScreen';

export default function SavedLoginScreen() {
  return (
    <ComingSoonScreen
      title="Saved Login Info"
      description="Advanced saved-login controls are intentionally disabled for now while the security flow is being hardened."
      groups={[
        {
          title: 'Security',
          items: ['Advanced Security Features'],
        },
      ]}
    />
  );
}
