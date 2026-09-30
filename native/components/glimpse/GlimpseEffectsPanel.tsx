import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GLIMPSE_STYLE_PRESETS } from '../../utils/glimpse/glimpseEditorCalculations';
import { typography, spacing } from '../../styles/theme';

interface GlimpseEffectsPanelProps {
  styleId: string;
  setStyleId: (id: string) => void;
}

export function GlimpseEffectsPanel({ styleId, setStyleId }: GlimpseEffectsPanelProps) {
  return (
    <View style={styles.panelCard}>
      <View style={styles.panelHead}>
        <Text style={styles.panelTitle}>Effects</Text>
        <Text style={styles.panelMeta}>Sharper dark-first looks</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effectRail as any}>
        {GLIMPSE_STYLE_PRESETS.map((preset) => {
          const active = preset.id === styleId;
          return (
            <TouchableOpacity key={preset.id} style={[styles.effectCard, active && styles.effectCardActive]} onPress={() => setStyleId(preset.id)}>
              <LinearGradient colors={preset.gradient} style={styles.effectPreview} />
              <Text style={[styles.effectText, active && styles.effectTextActive]}>{preset.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panelCard: { backgroundColor: '#0A1220', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  panelTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: typography.fontWeight.semibold as any },
  panelMeta: { color: 'rgba(255,255,255,0.64)', fontSize: 13 },
  effectRail: { gap: 16, paddingBottom: 8 },
  effectCard: { alignItems: 'center', gap: 10, opacity: 0.6 },
  effectCardActive: { opacity: 1 },
  effectPreview: { width: 56, height: 72, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  effectText: { color: '#FFFFFF', fontSize: 12, fontWeight: typography.fontWeight.medium as any },
  effectTextActive: { fontWeight: typography.fontWeight.bold as any, color: '#FFFFFF' },
});
