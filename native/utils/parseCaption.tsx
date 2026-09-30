import React from 'react';
import { Text } from 'react-native';

/**
 * Parse caption and convert @mentions and #hashtags to links
 */
export function ParsedCaption({ text }: { text: string }) {
  const parts = text.split(/(@[\w.]+|#[\w.]+)/g);

  return (
    <>
      {parts.map((part, index) => (
        <Text key={index}>{part}</Text>
      ))}
    </>
  );
}
