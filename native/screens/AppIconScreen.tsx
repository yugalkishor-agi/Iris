import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

interface AppIcon {
  id: string;
  name: string;
  preview: string;
  description: string;
  isPremium?: boolean;
}

export default function AppIconScreen() {
  const [selectedIcon, setSelectedIcon] = useState('default');
  const navigation = useNavigation();

  const appIcons: AppIcon[] = [
    {
      id: 'default',
      name: 'Default',
      preview: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=120&h=120&fit=crop',
      description: 'Classic Iris icon',
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=120&h=120&fit=crop',
      description: 'Perfect for dark themes',
    },
    {
      id: 'gradient',
      name: 'Gradient',
      preview: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=120&h=120&fit=crop',
      description: 'Colorful gradient design',
      isPremium: true,
    },
    {
      id: 'minimal',
      name: 'Minimal',
      preview: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=120&h=120&fit=crop',
      description: 'Clean and simple',
    },
    {
      id: 'neon',
      name: 'Neon',
      preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=120&h=120&fit=crop',
      description: 'Vibrant neon style',
      isPremium: true,
    },
    {
      id: 'retro',
      name: 'Retro',
      preview: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=120&h=120&fit=crop',
      description: 'Vintage aesthetic',
      isPremium: true,
    },
    {
      id: 'pride',
      name: 'Pride',
      preview: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop',
      description: 'Show your support',
    },
    {
      id: 'seasonal',
      name: 'Holiday',
      preview: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=120&h=120&fit=crop',
      description: 'Festive seasonal design',
    },
  ];

  useEffect(() => {
    loadAppIcon();
  }, []);

  const loadAppIcon = async () => {
    try {
      const savedIcon = await AsyncStorage.getItem('appIcon');
      if (savedIcon) {
        setSelectedIcon(savedIcon);
      }
    } catch (error) {
      console.error('Failed to load app icon:', error);
    }
  };

  const handleIconChange = async (iconId: string) => {
    const icon = appIcons.find(i => i.id === iconId);
    
    if (icon?.isPremium) {
      Alert.alert(
        'Premium Feature',
        'This app icon is available for premium users only. Would you like to upgrade?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            // Navigate to premium upgrade
            Alert.alert('Coming Soon', 'Premium upgrade coming soon!');
          }},
        ]
      );
      return;
    }

    try {
      setSelectedIcon(iconId);
      await AsyncStorage.setItem('appIcon', iconId);
      
      Alert.alert(
        'App Icon Changed',
        'Your app icon has been updated! It may take a few moments to appear on your home screen.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to save app icon:', error);
      Alert.alert('Error', 'Failed to change app icon');
    }
  };

  const renderIconOption = (icon: AppIcon) => {
    const isSelected = selectedIcon === icon.id;
    
    return (
      <TouchableOpacity
        key={icon.id}
        style={[
          styles.iconOption,
          isSelected && styles.selectedIcon
        ]}
        onPress={() => handleIconChange(icon.id)}
        activeOpacity={0.8}
      >
        <View style={styles.iconPreview}>
          <Image source={{ uri: icon.preview }} style={styles.iconImage} />
          {icon.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={12} color="white" />
            </View>
          )}
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <Ionicons name="checkmark-circle" size={24} color={colors.accent.primary} />
            </View>
          )}
        </View>
        
        <Text style={styles.iconName}>{icon.name}</Text>
        <Text style={styles.iconDescription}>{icon.description}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Icon</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="apps" size={24} color={colors.accent.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Customize your app icon</Text>
            <Text style={styles.infoDescription}>
              Choose from a variety of app icons to personalize your home screen experience.
            </Text>
          </View>
        </View>

        <View style={styles.currentIconSection}>
          <Text style={styles.sectionTitle}>Current Icon</Text>
          <View style={styles.currentIconCard}>
            <Image 
              source={{ uri: appIcons.find(i => i.id === selectedIcon)?.preview }} 
              style={styles.currentIconImage} 
            />
            <View style={styles.currentIconInfo}>
              <Text style={styles.currentIconName}>
                {appIcons.find(i => i.id === selectedIcon)?.name}
              </Text>
              <Text style={styles.currentIconDescription}>
                {appIcons.find(i => i.id === selectedIcon)?.description}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.iconsSection}>
          <Text style={styles.sectionTitle}>Available Icons</Text>
          <View style={styles.iconsGrid}>
            {appIcons.map(renderIconOption)}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
          <Text style={styles.noteText}>
            App icon changes may take a few moments to appear on your device's home screen. Some icons require a premium subscription.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  currentIconSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  currentIconCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  currentIconImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  currentIconInfo: {
    flex: 1,
  },
  currentIconName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  currentIconDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  iconsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  iconOption: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIcon: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '10',
  },
  iconPreview: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  iconImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  selectedOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 2,
  },
  iconName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  iconDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
