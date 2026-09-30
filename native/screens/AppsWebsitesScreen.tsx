import React from 'react';
import ComingSoonScreen from '../components/ui/ComingSoonScreen';

export default function AppsWebsitesScreen() {
  return (
    <ComingSoonScreen
      title="Apps and Websites"
      description="Connected app management is intentionally disabled for now until the advanced security controls are completed."
      groups={[
        {
          title: 'Security',
          items: ['Advanced Security Features'],
        },
      ]}
    />
  );
}
