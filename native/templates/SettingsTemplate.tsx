import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface SettingItem {
  label: string;
  type: 'toggle' | 'navigation' | 'action';
  icon: string;
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  navigateTo?: string;
  danger?: boolean;
}

interface SettingsTemplateProps {
  title: string;
  sections: {
    title?: string;
    items: SettingItem[];
  }[];
}

export function createSettingsScreen(config: SettingsTemplateProps) {
  return function SettingsScreen() {
    const navigation = useNavigation();

    const renderItem = (item: SettingItem) => {
      const iconName = item.icon as any;
      
      return (
        <TouchableOpacity
          key={item.label}
          style={styles.settingItem}
          onPress={() => {
            if (item.type === 'navigation' && item.navigateTo) {
              navigation.navigate(item.navigateTo as never);
            } else if (item.onPress) {
              item.onPress();
            }
          }}
          disabled={item.type === 'toggle'}
        >
          <View style={styles.settingLeft}>
            <Ionicons
              name={iconName}
              size={22}
              color={item.danger ? '#ef4444' : '#6b7280'}
              style={styles.settingIcon}
            />
            <Text style={[styles.settingLabel, item.danger && styles.dangerText]}>
              {item.label}
            </Text>
          </View>
          
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={item.value ? '#3b82f6' : '#f3f4f6'}
            />
          )}
          
          {item.type === 'navigation' && (
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          )}
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {config.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              {section.title && (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              <View style={styles.settingsGroup}>
                {section.items.map(renderItem)}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  settingsGroup: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
  },
  dangerText: {
    color: '#ef4444',
  },
});
