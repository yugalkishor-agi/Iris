import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { BlurView } from 'expo-blur'; // Will be available after dependency installation
import { useNavigation } from '@react-navigation/native';
import { NavigationService } from '../../services/navigation.service';
import { styles } from './CreateMenuStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CreateMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

interface CreateOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string[];
  route: string;
}

export default function CreateMenuModal({ visible, onClose }: CreateMenuModalProps) {
  const navigation = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Create options like Iris web version
  const createOptions: CreateOption[] = [
    {
      id: 'glimpses',
      title: 'Glimpses',
      subtitle: 'Short videos up to 60s',
      icon: 'play-circle',
      color: '#FF6B6B',
      gradient: ['#FF6B6B', '#FF8E8E'],
      route: 'GlimpseCreate'
    },
    {
      id: 'post',
      title: 'Post',
      subtitle: 'Share photos & videos',
      icon: 'image',
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#6EE7E0'],
      route: 'CreatePost'
    },
    {
      id: 'story',
      title: 'Story',
      subtitle: '24h disappearing content',
      icon: 'radio-button-on',
      color: '#45B7D1',
      gradient: ['#45B7D1', '#67C3DB'],
      route: 'StoryEditor'
    },
    {
      id: 'live',
      title: 'Go Live',
      subtitle: 'Stream live video',
      icon: 'radio',
      color: '#F093FB',
      gradient: ['#F093FB', '#F5A3FF'],
      route: 'LiveStream'
    }
  ];

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOptionPress = (option: CreateOption) => {
    // Close animation first
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Navigate to respective screen using NavigationService
      setTimeout(() => {
        switch (option.id) {
          case 'glimpses':
            NavigationService.openGlimpseCreate();
            break;
          case 'post':
            NavigationService.openNewPost();
            break;
          case 'story':
            NavigationService.openStoryEditor();
            break;
          case 'live':
            Alert.alert('Coming soon', 'Live streaming will be available in an upcoming update.');
            break;
          default:
            (navigation as any).navigate(option.route);
        }
      }, 100);
    });
  };

  const handleBackdropPress = () => {
    onClose();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.8)" barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
      </Animated.View>

      {/* Main Content */}
      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create</Text>
            <Text style={styles.headerSubtitle}>Share your moment</Text>
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View
              style={{
                transform: [{ rotate: rotateInterpolate }],
              }}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Create Options */}
        <Animated.View
          style={[
            styles.optionsContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {createOptions.map((option, index) => (
            <Animated.View
              key={option.id}
              style={[
                styles.optionWrapper,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: Animated.add(
                        slideAnim,
                        new Animated.Value(index * 10)
                      ),
                    },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { borderColor: option.color }
                ]}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.8}
              >
                {/* Gradient Background */}
                <View
                  style={[
                    styles.optionGradient,
                    { backgroundColor: option.color }
                  ]}
                />

                {/* Icon */}
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                  <Ionicons name={option.icon as any} size={28} color="#FFFFFF" />
                </View>

                {/* Content */}
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>

                {/* Arrow */}
                <View style={styles.optionArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Bottom Actions */}
        <Animated.View
          style={[
            styles.bottomActions,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.draftButton}
            onPress={() => {
              onClose();
              setTimeout(() => NavigationService.navigate('Drafts'), 100);
            }}
          >
            <Ionicons name="document-text-outline" size={20} color="#8E8E93" />
            <Text style={styles.draftText}>Drafts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => {
              onClose();
              setTimeout(() => NavigationService.openNewPost(), 100);
            }}
          >
            <Ionicons name="grid-outline" size={20} color="#8E8E93" />
            <Text style={styles.templateText}>Templates</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Floating Create Button (Original Position) */}
        <Animated.View
          style={[
            styles.floatingButton,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.floatingButtonInner}
            onPress={onClose}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

