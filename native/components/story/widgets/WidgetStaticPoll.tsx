/**
 * WidgetPoll.tsx - Unified Poll Widget
 * Supports both static (export/preview) and interactive (viewer) modes.
 * ALIGNMENT: Uses sharedWidgetStyles for 100% consistency.
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WidgetStyleOptions } from './styles';

// Helper to compute styles based on theme (using shared logic)
function getStyles(styleOptions?: WidgetStyleOptions) {
    const theme = styleOptions?.theme || 'light';
    const stylePreset = (styleOptions as any)?.stylePreset as 'neon' | 'pastel' | 'dark' | 'minimal' | undefined;
    const opacity = styleOptions?.opacity ?? 1;
    const customBg = styleOptions?.backgroundColor;
    const customTextColor = styleOptions?.textColor;
    const borderRadius = styleOptions?.borderRadius ?? 16;

    // Logic matched with StoryOverlayRenderer.getWidgetContainerStyle
    let containerBg: string;
    let textColor: string;
    let optionBg: string;
    let optionTextColor: string;
    let isDark: boolean = false;

    if (stylePreset) {
        switch (stylePreset) {
            case 'neon':
                containerBg = customBg || 'rgba(0,0,0,0.6)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                optionTextColor = '#FFFFFF';
                isDark = true;
                break;
            case 'dark':
                containerBg = customBg || 'rgba(0,0,0,0.75)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                optionTextColor = '#FFFFFF';
                isDark = true;
                break;
            case 'minimal':
                containerBg = customBg || 'rgba(255,255,255,0.85)';
                textColor = customTextColor || '#111111';
                optionBg = 'rgba(0,0,0,0.08)';
                optionTextColor = '#111111';
                isDark = false;
                break;
            case 'pastel':
            default:
                containerBg = customBg || 'rgba(0,0,0,0.55)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                optionTextColor = '#FFFFFF';
                isDark = true;
                break;
        }
    } else {
        switch (theme) {
            case 'dark':
                containerBg = customBg || 'rgba(0,0,0,0.75)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                optionTextColor = '#FFFFFF';
                isDark = true;
                break;
            case 'glass':
                containerBg = customBg || 'rgba(255,255,255,0.25)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.2)';
                optionTextColor = '#FFFFFF';
                isDark = true;
                break;
            case 'gradient':
                containerBg = customBg || 'transparent';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.2)';
                optionTextColor = '#FFFFFF';
                isDark = true;
                break;
            case 'light':
            default:
                containerBg = customBg || '#FFFFFF';
                textColor = customTextColor || '#111111';
                optionBg = '#F3F4F6';
                optionTextColor = '#111111';
                isDark = false;
                break;
        }
    }

    return {
        container: {
            backgroundColor: containerBg,
            borderRadius,
            padding: 12,
            minWidth: 220,
            opacity,
            ...(theme === 'glass' ? {
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
            } : {}),
            ...(!isDark ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
            } : {}),
        } as ViewStyle,
        title: {
            color: textColor,
            fontWeight: '700' as const,
            fontSize: 16,
            marginBottom: 10,
        } as TextStyle,
        optionContainer: {
            backgroundColor: optionBg,
            borderRadius: 12,
            overflow: 'hidden' as const,
        } as ViewStyle,
        optionText: {
            color: optionTextColor,
            fontWeight: '600' as const,
            fontSize: 14,
        } as TextStyle,
        subText: {
            color: isDark ? 'rgba(255,255,255,0.6)' : '#6B7280',
            fontSize: 12,
        } as TextStyle,
        isDark,
    };
}

export interface WidgetPollProps {
    data: {
        question?: string;
        text?: string;
        options?: string[];
        // Legacy
        optionA?: string;
        optionB?: string;
    };
    style?: WidgetStyleOptions;

    // Interactive Props
    isInteractive?: boolean;
    onVote?: (index: number) => void;
    myVote?: number | null;
    results?: { counts: number[]; total: number };
}

function WidgetPollComponent({ data, style, isInteractive = false, onVote, myVote, results }: WidgetPollProps) {
    const question = data.question || data.text || (data as any)?.toString?.().replace(/^Poll:\s*/i, '') || 'Poll';
    const options = (data.options || [data.optionA || 'Yes', data.optionB || 'No']).slice(0, 4);
    const widgetStyle = getStyles(style);

    const total = results?.total || 0;
    const counts = results?.counts || [];
    const showResults = myVote != null || total > 0;

    return (
        <View style={widgetStyle.container} onStartShouldSetResponderCapture={() => isInteractive}>
            <Text style={widgetStyle.title} numberOfLines={2}>{question}</Text>
            {options.map((option, index) => {
                const pct = total > 0 && counts[index] ? Math.round((counts[index] / total) * 100) : 0;

                return (
                    <View key={index} style={{ marginBottom: 8 }}>
                        <View style={widgetStyle.optionContainer}>
                            {/* Result Bar */}
                            {showResults && (
                                <LinearGradient
                                    colors={widgetStyle.isDark ? ['rgba(139,92,246,0.5)', 'rgba(139,92,246,0.3)'] : ['rgba(59,130,246,0.3)', 'rgba(59,130,246,0.2)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%` }}
                                />
                            )}

                            {/* Option Content */}
                            <TouchableOpacity
                                activeOpacity={isInteractive ? 0.7 : 1}
                                onPress={() => isInteractive && myVote == null && onVote?.(index)}
                                disabled={!isInteractive || myVote != null}
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14 }}
                            >
                                <Text style={widgetStyle.optionText}>{option}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    {index === myVote && <Text style={{ fontSize: 12 }}>✅</Text>}
                                    <Text style={[widgetStyle.subText, { opacity: 0.8 }]}>{showResults ? `${pct}%` : '—'}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
            <Text style={widgetStyle.subText}>{total} votes</Text>
        </View>
    );
}

const areEqual = (prev: WidgetPollProps, next: WidgetPollProps) => {
    try {
        if (prev.isInteractive !== next.isInteractive) return false;
        if (prev.myVote !== next.myVote) return false;
        const pr = prev.results; const nr = next.results;
        if ((pr?.total || 0) !== (nr?.total || 0)) return false;
        const pc = pr?.counts || []; const nc = nr?.counts || [];
        if (pc.length !== nc.length) return false;
        for (let i = 0; i < pc.length; i++) if (pc[i] !== nc[i]) return false;
        const pd = prev.data; const nd = next.data;
        const pOpts = (pd.options || [pd.optionA, pd.optionB]).join('|');
        const nOpts = (nd.options || [nd.optionA, nd.optionB]).join('|');
        if ((pd.question || pd.text) !== (nd.question || nd.text)) return false;
        if (pOpts !== nOpts) return false;
        const ps = prev.style ? JSON.stringify(prev.style) : '';
        const ns = next.style ? JSON.stringify(next.style) : '';
        return ps === ns;
    } catch { return false; }
};

export const WidgetPoll = memo(WidgetPollComponent, areEqual);

// Export as both names for compatibility
export const WidgetStaticPoll = WidgetPoll;
export default WidgetPoll;
