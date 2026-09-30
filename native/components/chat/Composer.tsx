import { InlineLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { memo, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Platform,
  Keyboard} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface ComposerProps {
  messageText: string;
  canMessage: boolean;
  sending: boolean;
  onChange: (text: string) => void;
  onSend: (text?: string) => void;
  onMore?: () => void;
  onCamera?: () => void;
  onSticker?: () => void;
  onFocus?: () => void;
  stylesRef: any;
  accentColor?: string;
}

const Composer: React.FC<ComposerProps> = ({
  messageText,
  canMessage,
  sending,
  onChange,
  onSend,
  onMore,
  onCamera,
  onSticker,
  onFocus,
  stylesRef,
  accentColor = '#38bdf8',
}) => {
  const s = stylesRef;
  const hasText = messageText.trim().length > 0;
  const actionVisibility = useRef(new Animated.Value(hasText ? 0 : 1)).current;
  const latestTextRef = useRef(messageText);

  useEffect(() => {
    latestTextRef.current = messageText;
  }, [messageText]);

  useEffect(() => {
    Animated.timing(actionVisibility, {
      toValue: hasText ? 0 : 1,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [actionVisibility, hasText]);

  const actionsOpacity = actionVisibility;
  const actionsTranslateX = actionVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const sendOpacity = actionVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const sendTranslateX = actionVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });
  const handleTextChange = useCallback((text: string) => {
    latestTextRef.current = text;
    onChange(text);
  }, [onChange]);

  const handleSend = useCallback(() => {
    if (sending || !hasText) return;
    
    // Haptic feedback on send
    if (Platform.OS === 'ios') {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onSend(latestTextRef.current);
    
    // Smooth keyboard dismiss animation
    Keyboard.dismiss();
  }, [sending, hasText, onSend]);

  return (
    <View style={s.inputContainer}>
      <View style={[s.textInputContainer, hasText && s.textInputContainerTyping]}>
        <TouchableOpacity style={s.leadingIconButton} onPress={onCamera} disabled={!canMessage || sending}>
          <Ionicons name={hasText ? 'search' : 'camera'} size={24} color={accentColor} />
        </TouchableOpacity>
        <TextInput
          style={s.textInput}
          placeholder={canMessage ? 'Message' : 'Cannot send'}
          placeholderTextColor="#9ca3af"
          value={messageText}
          onChangeText={handleTextChange}
          onFocus={onFocus}
          multiline
          textAlignVertical="top"
          blurOnSubmit={false}
          maxLength={1000}
          editable={canMessage}
        />
        <View style={s.inputActionsDock}>
          <Animated.View
            style={[s.inputActionsRow, { opacity: actionsOpacity, transform: [{ translateX: actionsTranslateX }] }]}
            pointerEvents={hasText ? 'none' : 'auto'}
          >
            <TouchableOpacity style={s.miniActionButton} onPress={onSticker} disabled={!canMessage || sending}>
              <Image source={require('../../../assets/icons/icons8-sticker-square-48.png')} style={[s.emojiIcon, { tintColor: accentColor }]} />
            </TouchableOpacity>
            <TouchableOpacity style={s.miniActionButton} onPress={onMore} disabled={!canMessage || sending}>
              <Ionicons name="add" size={24} color={accentColor} />
            </TouchableOpacity>
          </Animated.View>
          <Animated.View
            style={[s.inputSendRow, { opacity: sendOpacity, transform: [{ translateX: sendTranslateX }] }]}
            pointerEvents={hasText ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={[s.sendButton, sending && s.sendButtonDisabled]}
              onPress={handleSend}
              disabled={sending || !hasText}
              activeOpacity={0.8}
            >
              {sending ? <InlineLoadingSkeleton /> : <Ionicons name="send" size={22} color="#0b1220" />}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default memo(Composer);


