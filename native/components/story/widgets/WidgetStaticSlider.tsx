/**
 * WidgetSlider.tsx - Unified Slider Widget
 * Supports both static and interactive modes.
 */
import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WidgetStyleOptions, widgetColors } from './styles';

// Reuse the same centralized style logic as Poll
function getStyles(styleOptions?: WidgetStyleOptions) {
    const theme = styleOptions?.theme || 'light';
    const stylePreset = (styleOptions as any)?.stylePreset as 'neon' | 'pastel' | 'dark' | 'minimal' | undefined;
    const opacity = styleOptions?.opacity ?? 1;
    const customBg = styleOptions?.backgroundColor;
    const customTextColor = styleOptions?.textColor;
    const borderRadius = styleOptions?.borderRadius ?? 16;

    let containerBg: string;
    let textColor: string;
    let optionBg: string;
    let isDark: boolean = false;

    if (stylePreset) {
        switch (stylePreset) {
            case 'neon':
                containerBg = customBg || 'rgba(0,0,0,0.6)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                isDark = true;
                break;
            case 'dark':
                containerBg = customBg || 'rgba(0,0,0,0.75)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                isDark = true;
                break;
            case 'minimal': // Minimal
                containerBg = customBg || 'rgba(255,255,255,0.85)';
                textColor = customTextColor || '#111111';
                optionBg = 'rgba(0,0,0,0.08)';
                isDark = false;
                break;
            case 'pastel':
            default:
                containerBg = customBg || 'rgba(0,0,0,0.55)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                isDark = true;
                break;
        }
    } else {
        switch (theme) {
            case 'dark':
                containerBg = customBg || 'rgba(0,0,0,0.75)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.15)';
                isDark = true;
                break;
            case 'glass':
                containerBg = customBg || 'rgba(255,255,255,0.25)';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.2)';
                isDark = true;
                break;
            case 'gradient':
                containerBg = customBg || 'transparent';
                textColor = customTextColor || '#FFFFFF';
                optionBg = 'rgba(255,255,255,0.2)';
                isDark = true;
                break;
            case 'light':
            default:
                containerBg = customBg || '#FFFFFF';
                textColor = customTextColor || '#111111';
                optionBg = '#F3F4F6';
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
            ...(theme === 'glass' ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' } : {}),
            ...(!isDark ? { shadowColor: '#000', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.1, elevation: 3 } : {}),
        } as ViewStyle,
        title: {
            color: textColor,
            fontWeight: '700' as const,
            fontSize: 16,
            marginBottom: 10,
        } as TextStyle,
        track: {
            height: 40,
            borderRadius: 20,
            backgroundColor: optionBg,
            justifyContent: 'center',
            paddingHorizontal: 8,
            width: '100%',
        } as ViewStyle,
        subText: {
            color: isDark ? 'rgba(255,255,255,0.8)' : '#6B7280',
            fontSize: 12,
        } as TextStyle,
        isDark,
    };
}

export interface WidgetSliderProps {
    data: {
        question?: string;
        text?: string;
        emoji?: string;
    };
    style?: WidgetStyleOptions;

    // Interactive
    isInteractive?: boolean;
    value?: number; // 0-1
    onValueChange?: (val: number) => void;
    stats?: { avg: number; count: number };
}

export function WidgetSlider({ data, style, isInteractive = false, value = 0, onValueChange, stats }: WidgetSliderProps) {
    const question = data.question || data.text || (data as any)?.toString?.().replace(/^.*?\s/, '') || 'Rate';
    const emoji = data.emoji || '😍';
    const styles = getStyles(style);

    const [trackW, setTrackW] = React.useState(0);
    const [localVal, setLocalVal] = React.useState<number | null>(null);
    const draggingRef = React.useRef(false);
    React.useEffect(() => { if (!draggingRef.current) setLocalVal(null); }, [value]);
    const effective = typeof localVal === 'number' ? Math.max(0, Math.min(1, localVal)) : Math.max(0, Math.min(1, value));
    const percent = Math.round(effective * 100);

    return (
        <View style={styles.container} onStartShouldSetResponderCapture={() => isInteractive}>
            <Text style={styles.title} numberOfLines={2}>{question}</Text>

            <View
                style={styles.track}
                onLayout={(e) => { try { setTrackW(e.nativeEvent.layout.width); } catch {} }}
                onStartShouldSetResponder={() => isInteractive}
                onResponderGrant={(e) => {
                    if (!isInteractive) return;
                    draggingRef.current = true;
                    const x = e?.nativeEvent?.locationX ?? 0;
                    const w = trackW || 0;
                    const r = w > 0 ? Math.max(0, Math.min(1, x / w)) : 0;
                    setLocalVal(r);
                }}
                onResponderMove={(e) => {
                    if (!isInteractive || !draggingRef.current) return;
                    const x = e?.nativeEvent?.locationX ?? 0;
                    const w = trackW || 0;
                    const r = w > 0 ? Math.max(0, Math.min(1, x / w)) : 0;
                    setLocalVal(r);
                }}
                onResponderRelease={(e) => {
                    if (!isInteractive) return;
                    draggingRef.current = false;
                    const x = e?.nativeEvent?.locationX ?? 0;
                    const w = trackW || 0;
                    const r = w > 0 ? Math.max(0, Math.min(1, x / w)) : (localVal ?? 0);
                    if (typeof onValueChange === 'function') onValueChange(r);
                }}
                onResponderTerminationRequest={() => true}
            >
                <View style={{ height: 8, backgroundColor: styles.isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB', borderRadius: 4 }} />

                {/* Fill Bar */}
                <LinearGradient
                    colors={widgetColors.sliderGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percent}%`, borderRadius: 4, height: 8 }}
                />

                {/* Thumb */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#fff',
                        borderWidth: 2,
                        borderColor: styles.isDark ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                        alignItems: 'center',
                        justifyContent: 'center',
                        left: `${percent}%`,
                        marginLeft: -16, // Center thumb
                    }}
                >
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                </View>
            </View>

            {stats && (
                <Text style={styles.subText}>Avg: {Math.round(stats.avg * 100) / 100}</Text>
            )}
        </View>
    );
}

export const WidgetStaticSlider = WidgetSlider;
export default WidgetSlider;
