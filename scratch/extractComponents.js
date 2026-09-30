const { Project } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const file = project.addSourceFileAtPath('../native/components/media/NativePostImageEditor.tsx');

const componentsToExtract = [
  'EditorVisualLayer',
  'EditorTextLayer',
  'TextBackdrop',
  'StickerAssetSheet',
  'TextMiniSlider',
  'GradeSlider'
];

if (!fs.existsSync('../native/components/media/NativePostImageEditor/components')) {
  fs.mkdirSync('../native/components/media/NativePostImageEditor/components', { recursive: true });
}

componentsToExtract.forEach(compName => {
  const comp = file.getFunction(compName);
  if (!comp) return;
  
  const newFile = project.createSourceFile(`../native/components/media/NativePostImageEditor/components/${compName}.tsx`, '', { overwrite: true });
  
  // Need to add imports to the new file based on what it uses, but doing this robustly is tricky.
  // Instead, we just copy ALL imports from the main file for now to ensure it compiles, then we can clean up later (or just leave them).
  const imports = file.getImportDeclarations();
  imports.forEach(imp => {
    // skip relative imports that will break, but wait, they are one level deeper now.
    // Instead of copying all imports, let's just let it be and we can manually fix them or use simple regex.
  });
  
  // Actually a better way: Just write it to string and append necessary imports.
  let content = `import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';\n`;
  content += `import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput, ScrollView, Platform, Dimensions, Modal, KeyboardAvoidingView, SafeAreaView, PanResponder } from 'react-native';\n`;
  content += `import { Ionicons } from '@expo/vector-icons';\n`;
  content += `import FastImage from 'react-native-fast-image';\n`;
  content += `import Slider from '@react-native-community/slider';\n`;
  content += `import { LinearGradient } from 'expo-linear-gradient';\n`;
  content += `import { useEditorStore } from '../useEditorStore';\n`;
  content += `import type { EditorTab, TextAlignMode, TextVariant, TextAnimationOption, TextEffectOption, TextBackgroundOption, AssetPickerMode, TextComposerTool, TextLayer, VisualLayer, TextStyleState, VisualLayerKind } from '../types';\n`;
  content += `import { PRESETS, DEFAULT_TEXT_STYLE, FONTS, FONT_SIZES, COLORS, DEFAULT_TEXT_SIZE } from '../constants';\n`;
  content += `import type { GiphyGif } from '../../../../services/giphy.service';\n\n`;

  content += comp.getText();
  
  // We need to also extract the styles if they are used. But styles are currently in NativePostImageEditor.tsx at the bottom.
  // Let's just create NativePostImageEditor.styles.ts and import it everywhere!
  
  fs.writeFileSync(`../native/components/media/NativePostImageEditor/components/${compName}.tsx`, content);
  comp.remove();
});

project.saveSync();
console.log('Components extracted.');
