/**
 * WidgetQuiz.tsx - Unified Quiz Widget
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { WidgetStyleOptions } from './styles';

// Reuse style logic
function getStyles(styleOptions?: WidgetStyleOptions) {
    // Quiz defaults to DARK theme usually, or distinct style
    const theme = styleOptions?.theme || 'dark'; // Default to dark for quiz
    const stylePreset = (styleOptions as any)?.stylePreset as 'neon' | 'pastel' | 'dark' | 'minimal' | undefined;
    const opacity = styleOptions?.opacity ?? 1;
    const customBg = styleOptions?.backgroundColor;
    const customTextColor = styleOptions?.textColor;
    const borderRadius = styleOptions?.borderRadius ?? 16;

    let containerBg: string;
    let textColor: string;
    let optionBg: string;
    let optionTextColor: string;
    let isDark: boolean = true;

    if (stylePreset) {
        // Similar to others but Quiz defaults may vary
        switch (stylePreset) {
            case 'neon':
                containerBg = customBg || 'rgba(0,0,0,0.6)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                optionTextColor = '#FFFFFF';
                break;
            case 'minimal':
                containerBg = customBg || 'rgba(255,255,255,0.9)';
                textColor = customTextColor || '#111111';
                optionBg = 'rgba(0,0,0,0.08)';
                optionTextColor = '#111111';
                isDark = false;
                break;
            case 'dark':
            default:
                containerBg = customBg || 'rgba(0,0,0,0.75)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                optionTextColor = '#FFFFFF';
                break;
        }
    } else {
        if (theme === 'light') {
            containerBg = customBg || '#FFFFFF';
            textColor = customTextColor || '#111111';
            optionBg = '#F3F4F6';
            optionTextColor = '#111111';
            isDark = false;
        } else {
            containerBg = customBg || 'rgba(0,0,0,0.75)';
            textColor = customTextColor || '#FFFFFF';
            optionBg = 'rgba(255,255,255,0.15)';
            optionTextColor = '#FFFFFF';
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
            fontSize: 18,
            marginBottom: 12,
        } as TextStyle,
        optionText: {
            color: optionTextColor,
            fontWeight: '600' as const,
            fontSize: 15,
        } as TextStyle,
        optionBg,
        isDark,
    };
}

export interface WidgetQuizProps {
    data: {
        question?: string;
        options?: string[];
        correctIndex?: number;
    };
    style?: WidgetStyleOptions;

    // Interactive
    isInteractive?: boolean;
    onAnswer?: (index: number) => void;
    myAnswer?: number | null;
    results?: { counts: number[]; total: number };
}

function WidgetQuizComponent({ data, style, isInteractive = false, onAnswer, myAnswer, results }: WidgetQuizProps) {
    const question = data.question || 'Quiz';
    const options = (data.options || []).slice(0, 4);
    const correctIndex = data.correctIndex ?? -1;
    const styles = getStyles(style);

    const showResults = myAnswer != null;

    return (
        <View style={styles.container} onStartShouldSetResponderCapture={() => isInteractive}>
            <Text style={styles.title} numberOfLines={2}>{question}</Text>
            {options.map((option, index) => {
                // Determine color state
                let bg = styles.optionBg;
                let borderColor = 'transparent';
                let borderWidth = 0;

                if (showResults) {
                    if (index === correctIndex) {
                        bg = '#22c55e'; // Green
                    } else if (index === myAnswer && index !== correctIndex) {
                        bg = '#ef4444'; // Red
                    } else {
                        // slightly dim others
                        bg = styles.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                    }
                }

                return (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={isInteractive ? 0.8 : 1}
                        onPress={() => isInteractive && !showResults && onAnswer?.(index)}
                        disabled={!isInteractive || showResults}
                        style={{ marginBottom: 8 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg, padding: 12, borderRadius: 12, borderWidth, borderColor }}>
                            {/* Option bullet logic can go here if needed */}
                            <Text style={styles.optionText}>{option}</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const areEqual = (prev: WidgetQuizProps, next: WidgetQuizProps) => {
    try {
        if (prev.isInteractive !== next.isInteractive) return false;
        if (prev.myAnswer !== next.myAnswer) return false;
        const pr = prev.results; const nr = next.results;
        if ((pr?.total || 0) !== (nr?.total || 0)) return false;
        const pc = pr?.counts || []; const nc = nr?.counts || [];
        if (pc.length !== nc.length) return false;
        for (let i = 0; i < pc.length; i++) if (pc[i] !== nc[i]) return false;
        const pd = prev.data; const nd = next.data;
        const pOpts = (pd.options || []).join('|');
        const nOpts = (nd.options || []).join('|');
        if ((pd.question) !== (nd.question)) return false;
        if ((pd.correctIndex ?? -1) !== (nd.correctIndex ?? -1)) return false;
        if (pOpts !== nOpts) return false;
        const ps = prev.style ? JSON.stringify(prev.style) : '';
        const ns = next.style ? JSON.stringify(next.style) : '';
        return ps === ns;
    } catch { return false; }
};

export const WidgetQuiz = memo(WidgetQuizComponent, areEqual);

// Compatibility export
export const WidgetStaticQuiz = WidgetQuiz;
export default WidgetQuiz;
