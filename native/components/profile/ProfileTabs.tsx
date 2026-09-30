import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';

interface ProfileTabsProps {
  activeTab: 'posts' | 'glimpses' | 'tagged';
  setActiveTab: (tab: 'posts' | 'glimpses' | 'tagged') => void;
}

export function ProfileTabs({ activeTab, setActiveTab }: ProfileTabsProps) {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
        onPress={() => setActiveTab('posts')}
      >
        <Ionicons
          name="grid-outline"
          size={24}
          color={activeTab === 'posts' ? colors.text.primary : colors.text.secondary}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'glimpses' && styles.activeTab]}
        onPress={() => setActiveTab('glimpses')}
      >
        <Ionicons
          name="film-outline"
          size={24}
          color={activeTab === 'glimpses' ? colors.text.primary : colors.text.secondary}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
        onPress={() => setActiveTab('tagged')}
      >
        <Ionicons
          name="pricetag-outline"
          size={24}
          color={activeTab === 'tagged' ? colors.text.primary : colors.text.secondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.text.primary,
  },
});
