/**
 * WidgetQuestion.tsx - Unified Question Widget
 */
import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { WidgetStyleOptions } from './styles';
import { Image } from 'expo-image';

function getStyles(styleOptions?: WidgetStyleOptions) {
    const theme = styleOptions?.theme || 'light';
    const stylePreset = (styleOptions as any)?.stylePreset as 'neon' | 'pastel' | 'dark' | 'minimal' | undefined;
    const opacity = styleOptions?.opacity ?? 1;
    const customBg = styleOptions?.backgroundColor;
    const customTextColor = styleOptions?.textColor;
    const borderRadius = styleOptions?.borderRadius ?? 16;

    let containerBg: string;
    let textColor: string;
    let inputBg: string; // Used for the "Type something..." box
    let isDark: boolean = false;

    if (stylePreset) {
        switch (stylePreset) {
            case 'neon':
                containerBg = customBg || 'rgba(0,0,0,0.6)';
                textColor = customTextColor || '#FFFFFF';
                inputBg = 'rgba(255,255,255,0.15)';
                isDark = true;
                break;
            case 'dark':
                containerBg = customBg || 'rgba(0,0,0,0.75)';
                textColor = customTextColor || '#FFFFFF';
                inputBg = 'rgba(255,255,255,0.15)';
                isDark = true;
                break;
            case 'minimal':
                containerBg = customBg || 'rgba(255,255,255,0.85)';
                textColor = customTextColor || '#111111';
                inputBg = 'rgba(0,0,0,0.08)';
                isDark = false;
                break;
            case 'pastel':
            default:
                containerBg = customBg || 'rgba(0,0,0,0.55)';
                textColor = customTextColor || '#FFFFFF';
                inputBg = 'rgba(255,255,255,0.15)';
                isDark = true;
                break;
        }
    } else {
        switch (theme) {
            case 'dark':
                containerBg = customBg || 'rgba(0,0,0,0.75)';
                textColor = customTextColor || '#FFFFFF';
                inputBg = 'rgba(255,255,255,0.15)';
                isDark = true;
                break;
            case 'glass':
                containerBg = customBg || 'rgba(255,255,255,0.25)';
                textColor = customTextColor || '#FFFFFF';
                inputBg = 'rgba(255,255,255,0.2)';
                isDark = true;
                break;
            case 'gradient':
                containerBg = customBg || 'transparent';
                textColor = customTextColor || '#FFFFFF';
                inputBg = 'rgba(255,255,255,0.2)';
                isDark = true;
                break;
            case 'light':
            default:
                containerBg = customBg || '#FFFFFF';
                textColor = customTextColor || '#111111';
                inputBg = '#F3F4F6';
                isDark = false;
                break;
        }
    }

    return {
        container: {
            backgroundColor: containerBg,
            borderRadius,
            padding: 12,
            minWidth: 240,
            opacity,
            ...(theme === 'glass' ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' } : {}),
            ...(!isDark ? { shadowColor: '#000', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.1, elevation: 3 } : {}),
        } as ViewStyle,
        title: {
            color: textColor,
            fontWeight: '700' as const,
            fontSize: 16,
            flex: 1,
        } as TextStyle,
        input: {
            backgroundColor: inputBg,
            borderRadius: 10,
            paddingVertical: 8,
            paddingHorizontal: 12,
            marginTop: 8,
        } as ViewStyle,
        placeholder: {
            color: isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
        } as TextStyle,
        avatar: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
        } as ImageStyle,
        isDark,
    };
}

export interface WidgetQuestionProps {
    data: {
        text?: string;
        avatarUrl?: string; // Optional avatar of asker
    };
    style?: WidgetStyleOptions;

    // Interactive
    isInteractive?: boolean;
    questionCount?: number;
    isOwnStory?: boolean;
    onViewReplies?: () => void;
    onPress?: () => void;
}

export function WidgetQuestion({ data, style, isInteractive = false, questionCount = 0, isOwnStory = false, onViewReplies, onPress }: WidgetQuestionProps) {
    const text = data.text || 'Ask me anything';
    const styles = getStyles(style);

    return (
        <View style={styles.container} onStartShouldSetResponderCapture={() => isInteractive}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {data.avatarUrl ? (
                    <Image source={{ uri: data.avatarUrl }} style={[styles.avatar, { backgroundColor: 'transparent' }] as any} />
                ) : (
                    <View style={styles.avatar as any} />
                )}
                <Text style={styles.title} numberOfLines={2}>{text}</Text>
            </View>

            <TouchableOpacity
                activeOpacity={isInteractive ? 0.8 : 1}
                onPress={() => isInteractive && onPress && onPress()}
                disabled={!isInteractive}
            >
                <View style={styles.input}>
                    <Text style={styles.placeholder}>{isOwnStory ? 'View responses...' : 'Type your answer...'}</Text>
                </View>
            </TouchableOpacity>

            {isInteractive && isOwnStory && questionCount > 0 && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onViewReplies && onViewReplies()}
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                >
                    <Text style={{ color: styles.isDark ? 'rgba(255,255,255,0.85)' : '#2563EB', fontSize: 12, fontWeight: '700' }}>
                        ({questionCount}) View replies
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// Export for compatibility
export const WidgetStaticQuestion = WidgetQuestion;
export default WidgetQuestion;
