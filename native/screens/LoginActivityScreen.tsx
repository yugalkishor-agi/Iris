import React from 'react';
import ComingSoonScreen from '../components/ui/ComingSoonScreen';

export default function LoginActivityScreen() {
  return (
    <ComingSoonScreen
      title="Login Activity"
      description="Advanced login monitoring is intentionally disabled for now while the security event system is finalized."
      groups={[
        {
          title: 'Security',
          items: ['Advanced Security Features'],
        },
      ]}
    />
  );
}
