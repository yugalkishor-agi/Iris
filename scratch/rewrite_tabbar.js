const fs = require('fs');

const code = `import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate,
  Extrapolation
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const TabBarItem = ({ 
  isFocused, 
  options, 
  onPress, 
  onLongPress, 
  routeName 
}: { 
  isFocused: boolean; 
  options: any; 
  onPress: () => void; 
  onLongPress: () => void; 
  routeName: string; 
}) => {
  const animatedFocus = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    animatedFocus.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 120,
      mass: 0.5,
    });
  }, [isFocused]);

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(animatedFocus.value, [0, 1], [0, 80], Extrapolation.CLAMP),
      opacity: interpolate(animatedFocus.value, [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP),
      marginLeft: interpolate(animatedFocus.value, [0, 1], [0, 8], Extrapolation.CLAMP),
    };
  });

  const animatedUnderlineStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(animatedFocus.value, [0, 1], [0, 40], Extrapolation.CLAMP),
      opacity: animatedFocus.value,
    };
  });

  let iconName = 'help-outline';
  let activeIconName = 'help';
  let label = options.tabBarLabel !== undefined ? options.tabBarLabel : routeName;

  if (routeName === 'Home') {
    iconName = 'home-outline';
    activeIconName = 'home';
  } else if (routeName === 'Search') {
    iconName = 'search-outline';
    activeIconName = 'search';
  } else if (routeName === 'Create') {
    iconName = 'add-circle-outline';
    activeIconName = 'add-circle';
  } else if (routeName === 'Notifications') {
    iconName = 'heart-outline';
    activeIconName = 'heart';
    label = 'Activity';
  } else if (routeName === 'Profile') {
    iconName = 'person-outline';
    activeIconName = 'person';
  }

  const activeColor = '#00D47E'; // Green from the image
  const inactiveColor = '#8E8E93';
  const iconColor = isFocused ? activeColor : inactiveColor;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.8}
    >
      <View style={styles.tabItemContainer}>
        <Ionicons name={isFocused ? activeIconName as any : iconName as any} size={24} color={iconColor} />
        
        <Animated.View style={[styles.textContainer, animatedTextStyle]}>
          <Text style={[styles.tabLabel, { color: iconColor }]} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      </View>
      
      {/* Animated Underline */}
      <Animated.View 
        style={[
          styles.underline, 
          { backgroundColor: activeColor },
          animatedUnderlineStyle
        ]} 
      />
    </TouchableOpacity>
  );
};

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarItem
            key={route.key}
            isFocused={isFocused}
            options={options}
            onPress={onPress}
            onLongPress={onLongPress}
            routeName={route.name}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    height: 70,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopColor: '#222222',
    borderTopWidth: 1,
    paddingBottom: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  tabItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  underline: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 6,
    alignSelf: 'center',
  },
});
`;

fs.writeFileSync('native/components/navigation/AnimatedTabBar.tsx', code, 'utf8');
console.log('Rewrote AnimatedTabBar.tsx with Reanimated');
