import React from 'react';
import ComingSoonScreen from '../components/ui/ComingSoonScreen';

export default function DownloadDataScreen() {
  return (
    <ComingSoonScreen
      title="Download Your Data"
      description="Data export is intentionally disabled for now until the final export pipeline and privacy verification are complete."
      groups={[
        {
          title: 'Account & Data',
          items: ['Account Activity', 'Download Data'],
        },
      ]}
    />
  );
}
