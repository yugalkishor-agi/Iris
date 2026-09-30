const fs = require('fs');

const prefix = `import React from 'react';
import {
  Group,
  Text as SkiaText,
  matchFont,
  Path,
  Image,
  useImage,
} from '@shopify/react-native-skia';
import type { EditorElement } from '../../../stores/editorStore';

interface ElementRendererProps {
  element: EditorElement;
}

export function ElementRenderer({ element }: ElementRendererProps) {
`;

const file = 'native/components/editor/SkiaCanvas/ElementRenderer.tsx';
const content = fs.readFileSync(file, 'utf8');
const startIdx = content.indexOf('  switch (element.type) {');

if (startIdx !== -1) {
  fs.writeFileSync(file, prefix + content.substring(startIdx), 'utf8');
  console.log('Fixed ElementRenderer.tsx');
} else {
  console.log('Could not find start index in ElementRenderer.tsx');
}
