import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_OPTIONS, TEXT_COLORS, TEXT_ANIMATIONS, TEXT_EFFECTS, TEXT_BACKGROUNDS } from '../../utils/glimpse/glimpseEditorConstants';
import { spacing } from '../../styles/theme';

interface GlimpseTextComposerProps {
  composerVisible: boolean;
  composerTool: string;
  setComposerTool: (tool: string) => void;
  overlayFont: string;
  setOverlayFont: (font: string) => void;
  overlayColor: string;
  setOverlayColor: (color: string) => void;
  overlayAnimation: string;
  setOverlayAnimation: (animation: any) => void;
  overlayEffect: string;
  setOverlayEffect: (effect: any) => void;
  overlayBackground: string;
  setOverlayBackground: (bg: any) => void;
  overlayAlign: 'left' | 'center' | 'right';
  setOverlayAlign: (align: 'left' | 'center' | 'right') => void;
  cycleAlign: (align: 'left' | 'center' | 'right') => 'left' | 'center' | 'right';
  closeComposer: () => void;
  keyboardVisible: boolean;
  keyboardHeight: number;
}

export function GlimpseTextComposer({
  composerVisible,
  composerTool,
  setComposerTool,
  overlayFont,
  setOverlayFont,
  overlayColor,
  setOverlayColor,
  overlayAnimation,
  setOverlayAnimation,
  overlayEffect,
  setOverlayEffect,
  overlayBackground,
  setOverlayBackground,
  overlayAlign,
  setOverlayAlign,
  cycleAlign,
  closeComposer,
  keyboardVisible,
  keyboardHeight,
}: GlimpseTextComposerProps) {
  if (!composerVisible) return null;

  return (
    <>
      <View style={styles.composerTopRow}>
        <TouchableOpacity style={styles.composerTopButton} onPress={closeComposer}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.composerDone} onPress={closeComposer}>
          <Text style={styles.composerDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.composerWrap, { bottom: keyboardVisible ? (Platform.OS === 'ios' ? keyboardHeight + 4 : 0) : spacing.sm }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRail as any}>
          {composerTool === 'font' && FONT_OPTIONS.map((font) => (
            <TouchableOpacity key={font.id} style={[styles.choiceChip, overlayFont === font.value && styles.choiceChipActive]} onPress={() => setOverlayFont(font.value)}>
              <Text style={[styles.choiceText, { fontFamily: font.value }, overlayFont === font.value && styles.choiceTextActive]}>{font.label}</Text>
            </TouchableOpacity>
          ))}
          {composerTool === 'color' && TEXT_COLORS.map((color) => (
            <TouchableOpacity key={color} style={[styles.colorChip, { backgroundColor: color }, overlayColor === color && styles.colorChipActive]} onPress={() => setOverlayColor(color)} />
          ))}
          {composerTool === 'animation' && TEXT_ANIMATIONS.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.choiceChip, overlayAnimation === item.id && styles.choiceChipActive]} onPress={() => setOverlayAnimation(item.id)}>
              <Text style={[styles.choiceText, overlayAnimation === item.id && styles.choiceTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          {composerTool === 'effect' && TEXT_EFFECTS.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.choiceChip, overlayEffect === item.id && styles.choiceChipActive]} onPress={() => setOverlayEffect(item.id)}>
              <Text style={[styles.choiceText, overlayEffect === item.id && styles.choiceTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          {composerTool === 'background' && TEXT_BACKGROUNDS.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.choiceChip, overlayBackground === item.id && styles.choiceChipActive]} onPress={() => setOverlayBackground(item.id)}>
              <Text style={[styles.choiceText, overlayBackground === item.id && styles.choiceTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.composerToolbar}>
          <TouchableOpacity style={[styles.toolbarIcon, composerTool === 'font' && styles.toolbarIconActive]} onPress={() => setComposerTool('font')}>
            <Text style={[styles.ffText, composerTool === 'font' && styles.ffTextActive]}>Ff</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toolbarIcon, composerTool === 'color' && styles.toolbarIconActive]} onPress={() => setComposerTool('color')}>
            <Ionicons name="color-palette-outline" size={18} color={composerTool === 'color' ? '#08111F' : '#FFFFFF'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toolbarIcon, composerTool === 'animation' && styles.toolbarIconActive]} onPress={() => setComposerTool('animation')}>
            <Ionicons name="pulse-outline" size={18} color={composerTool === 'animation' ? '#08111F' : '#FFFFFF'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toolbarIcon, composerTool === 'effect' && styles.toolbarIconActive]} onPress={() => setComposerTool('effect')}>
            <Ionicons name="sparkles-outline" size={18} color={composerTool === 'effect' ? '#08111F' : '#FFFFFF'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarIcon} onPress={() => setOverlayAlign(cycleAlign(overlayAlign))}>
            <Ionicons name={overlayAlign === 'left' ? 'reorder-three-outline' : overlayAlign === 'center' ? 'menu-outline' : 'reorder-four-outline'} size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toolbarIcon, composerTool === 'background' && styles.toolbarIconActive]} onPress={() => setComposerTool('background')}>
            <Ionicons name="color-fill-outline" size={18} color={composerTool === 'background' ? '#08111F' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  composerTopRow: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 120 },
  composerTopButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  composerDone: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  composerDoneText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  composerWrap: { position: 'absolute', left: 0, right: 0, zIndex: 100 },
  choiceRail: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  choiceChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  choiceChipActive: { backgroundColor: '#FFFFFF' },
  choiceText: { color: '#FFFFFF', fontSize: 14 },
  choiceTextActive: { color: '#08111F', fontWeight: '700' },
  colorChip: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorChipActive: { borderColor: '#FFFFFF', transform: [{ scale: 1.1 }] },
  composerToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: Platform.OS === 'ios' ? 12 : 8 },
  toolbarIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  toolbarIconActive: { backgroundColor: '#FFFFFF' },
  ffText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  ffTextActive: { color: '#08111F' },
});
