const fs = require('fs');
let content = fs.readFileSync('u:/i/NativePostImageEditor_backup.tsx', 'utf8');

// Revert the `H.` prefix
content = content.replace(/setH\.TextLayers/g, 'setTextLayers');
content = content.replace(/setH\.VisualLayers/g, 'setVisualLayers');
content = content.replace(/H\./g, '');

// The broken import block looks roughly like:
/*
import FastImage from 'react-native-fast-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
import Slider from '@react-native-community/slider';
...
export function NativePostImageEditor
*/
const match = content.match(/export function NativePostImageEditor/);
if (match) {
  const codeIndex = match.index;
  const goodImports = `import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, Pressable, TouchableOpacity, View, ImageBackground, useWindowDimensions, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import { giphyService } from '../../services/giphy.service';
import type { GiphyGif } from '../../services/giphy.service';
import { borderRadius, spacing, typography } from '../../styles/theme';

`;
  
  content = goodImports + content.substring(codeIndex);
}

fs.writeFileSync('u:/i/native/components/media/NativePostImageEditor.tsx', content, 'utf8');
console.log('Fixed syntax!');
