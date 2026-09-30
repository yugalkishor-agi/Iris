import React from 'react';
import ComingSoonScreen from '../components/ui/ComingSoonScreen';

export default function AccountActivityScreen() {
  return (
    <ComingSoonScreen
      title="Account Activity"
      description="Account timeline and export tooling are intentionally disabled for now until the final audit and retention flow is ready."
      groups={[
        {
          title: 'Account & Data',
          items: ['Account Activity', 'Download Data'],
        },
      ]}
    />
  );
}
