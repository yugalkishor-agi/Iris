import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabConfig {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  Home: { name: 'Home', icon: 'home', iconOutline: 'home-outline' },
  Search: { name: 'Search', icon: 'search', iconOutline: 'search-outline' },
  NewPost: { name: 'Create', icon: 'add-circle', iconOutline: 'add-circle-outline' },
  Glimpses: { name: 'Glimpses', icon: 'film', iconOutline: 'film-outline' },
  Profile: { name: 'Profile', icon: 'person', iconOutline: 'person-outline' },
};

export function ModernTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;

  // Animation values for each tab
  const tabAnimations = useRef(
    state.routes.map(() => ({
      scale: useSharedValue(1),
      translateY: useSharedValue(0),
    }))
  ).current;

  const handleTabPress = (route: any, index: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      // Bounce animation
      const anim = tabAnimations[index];
      anim.translateY.value = withSequence(
        withSpring(-8, { damping: 10, stiffness: 400 }),
        withSpring(0, { damping: 10, stiffness: 400 }),
        withSpring(-3, { damping: 10, stiffness: 400 }),
        withSpring(0, { damping: 10, stiffness: 400 })
      );
      anim.scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 400 })
      );

      navigation.navigate(route.name);
    }
  };

  // Hide tab bar if specified in options
  if ((focusedOptions.tabBarStyle as { display?: string })?.display === 'none') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIGS[route.name] || {
            name: route.name,
            icon: 'help-circle',
            iconOutline: 'help-circle-outline',
          };

          const animatedIconStyle = useAnimatedStyle(() => ({
            transform: [
              { translateY: tabAnimations[index].translateY.value },
              { scale: tabAnimations[index].scale.value },
            ] as const,
          }));

          // Skip rendering the NewPost tab (center button) in this bar
          if (route.name === 'NewPost') {
            return (
              <View key={route.key} style={styles.centerButtonSpace}>
                <TouchableOpacity
                  style={styles.centerButton}
                  onPress={() => handleTabPress(route, index)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={32} color="#000000" />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.7}
              onPress={() => handleTabPress(route, index)}
              style={styles.tabItem}
            >
              <View style={styles.tabContent}>
                <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                  <Ionicons
                    name={isFocused ? config.icon : config.iconOutline}
                    size={24}
                    color={isFocused ? '#4DD0E1' : '#71717A'}
                  />
                </Animated.View>
                
                {isFocused && (
                  <Animated.View
                    entering={undefined}
                    style={styles.activeTextContainer}
                  >
                    <Text style={styles.activeText}>{config.name}</Text>
                    <View style={styles.underline} />
                  </Animated.View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 28,
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTextContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  activeText: {
    color: '#4DD0E1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  underline: {
    height: 2,
    backgroundColor: '#4DD0E1',
    width: '100%',
    marginTop: 2,
    borderRadius: 1,
  },
  centerButtonSpace: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4DD0E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
    shadowColor: '#4DD0E1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 15,
    borderWidth: 4,
    borderColor: '#1A1A1A',
  },
});
