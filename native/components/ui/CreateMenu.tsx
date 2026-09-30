import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { toast } from '../../contexts/ToastContext';

interface CreateMenuProps {
  visible: boolean;
  onClose: () => void;
}

type CreateOption = {
  id: string;
  title: string;
  subtitle: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
};

const CREATE_OPTIONS: CreateOption[] = [
  {
    id: 'post',
    title: 'Post',
    subtitle: 'Photos, videos, carousel',
    hint: 'Best for feed moments',
    icon: 'images-outline',
    color: '#5EA1FF',
    route: 'CreatePost',
  },
  {
    id: 'glimpse',
    title: 'Glimpse',
    subtitle: 'Vertical short video',
    hint: 'Fast, immersive, full-screen',
    icon: 'film-outline',
    color: '#FF7A59',
    route: 'GlimpseCreate',
  },
  {
    id: 'story',
    title: 'Story',
    subtitle: '24-hour update',
    hint: 'Casual and lightweight',
    icon: 'radio-button-on-outline',
    color: '#5DD39E',
    route: 'StoryEditor',
  },
  {
    id: 'live',
    title: 'Live',
    subtitle: 'Start live stream',
    hint: 'Go real-time instantly',
    icon: 'videocam-outline',
    color: '#C084FC',
    route: 'LiveStream',
  },
];

export function CreateMenu({ visible, onClose }: CreateMenuProps) {
  const navigation = useNavigation();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(420)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 420,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, sheetTranslateY, sheetOpacity]);

  const handleOptionPress = (option: CreateOption) => {
    onClose();
    setTimeout(() => {
      if (option.id === 'live') {
        Alert.alert('Coming soon', 'Live streaming will be available in an upcoming update.');
        return;
      }
      try {
        (navigation as any).navigate(option.route);
      } catch (error) {
        console.error('Create navigation failed:', error);
        toast.error('Unable to open creator');
      }
    }, 120);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: sheetOpacity,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Create</Text>
            <Text style={styles.title}>Pick a format</Text>
            <Text style={styles.subtitle}>Posts hold detail. Glimpses feel faster. Stories stay light.</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color="#F8FAFC" />
          </TouchableOpacity>
        </View>

        <View style={styles.optionsWrap}>
          {CREATE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionRow}
              activeOpacity={0.88}
              onPress={() => handleOptionPress(option)}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${option.color}22` }]}>
                <Ionicons name={option.icon} size={22} color={option.color} />
              </View>

              <View style={styles.optionTextWrap}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={[styles.optionHint, { color: option.color }]}>{option.hint}</Text>
                </View>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>

              <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => {
              onClose();
              setTimeout(() => {
                try {
                  (navigation as any).navigate('Drafts');
                } catch (error) {
                  console.error('Draft navigation failed:', error);
                  toast.error('Unable to open drafts');
                }
              }, 120);
            }}
          >
            <Ionicons name="document-text-outline" size={16} color="#CBD5E1" />
            <Text style={styles.secondaryActionText}>Drafts</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2,6,23,0.7)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#081120',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -10 },
    elevation: 18,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.5)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#94A3B8',
    maxWidth: 280,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsWrap: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  optionHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  optionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  secondaryActionText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
});

