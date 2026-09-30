/**
 * Shared Widget Styles
 * 
 * This module provides consistent styling across all story widgets to ensure
 * visual parity between editor preview, story viewer, and static export.
 * 
 * ALIGNMENT NOTE: Styles here are based on DraggableSticker.tsx (Editor)
 * to ensure "Visual-First" consistency.
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// === WIDGET STYLE OPTIONS ===
// Style customization options for widgets - used by both static and interactive renderers
export interface WidgetStyleOptions {
    theme?: 'light' | 'dark' | 'glass' | 'gradient';
    opacity?: number; // 0-1
    stylePreset?: 'default' | 'minimal' | 'bold' | 'neon' | 'pastel';
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
    hideBadge?: boolean;
    isAnonymous?: boolean;
    isPublic?: boolean;
}

// === COLORS ===
export const widgetColors = {
    // Themes
    bgWhite: '#FFFFFF',
    bgDark: 'rgba(0,0,0,0.55)',

    // Element backgrounds
    elementBgLight: '#F3F4F6',
    elementBgDark: 'rgba(255,255,255,0.15)',

    // Text
    textDark: '#111111',
    textLight: '#FFFFFF',
    textMutedLight: 'rgba(255,255,255,0.6)',
    textMutedDark: '#6B7280',

    // Interactions
    accentBlue: '#3b82f6',
    accentPink: '#ec4899',
    accentGreen: '#22c55e',

    sliderGradient: ['#f97316', '#ec4899', '#3b82f6'] as const,
};

// === SPECIFIC WIDGET STYLES ===

// Poll / Slider / Question (Light Theme)
export const lightWidgetStyle = {
    container: {
        backgroundColor: widgetColors.bgWhite,
        borderRadius: 16,
        padding: 12,
        minWidth: 220,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    } as ViewStyle,

    title: {
        color: widgetColors.textDark,
        fontWeight: '700' as const,
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'left' as const,
    } as TextStyle,

    option: {
        backgroundColor: widgetColors.elementBgLight,
        borderRadius: 12,
        overflow: 'hidden',
    } as ViewStyle,

    optionText: {
        color: widgetColors.textDark,
        fontWeight: '600' as const,
        fontSize: 14,
    } as TextStyle,

    subText: {
        color: widgetColors.textMutedDark,
        fontSize: 12,
    } as TextStyle,
};

// Quiz (Dark Theme)
export const darkWidgetStyle = {
    container: {
        backgroundColor: widgetColors.bgDark,
        borderRadius: 12,
        padding: 10,
        minWidth: 240,
    } as ViewStyle,

    title: {
        color: widgetColors.textLight,
        fontWeight: '700' as const,
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'left' as const,
    } as TextStyle,

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    } as ViewStyle,

    optionText: {
        color: widgetColors.textLight,
        fontSize: 14,
    } as TextStyle,
};

// Common Elements
export const commonStyles = {
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.25)',
    } as ViewStyle,

    dotSelected: {
        backgroundColor: widgetColors.accentGreen,
    } as ViewStyle,

    label: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    } as ViewStyle,

    labelText: {
        color: '#000',
        fontWeight: '600' as const,
        fontSize: 24,
    } as TextStyle,

    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 999,
    } as ViewStyle,

    badgeText: {
        color: '#111',
        fontWeight: '600' as const,
        fontSize: 16,
    } as TextStyle,
};

// Interaction Styles
export const interactionStyles = {
    sliderTrack: {
        height: 40,
        borderRadius: 20,
        backgroundColor: widgetColors.elementBgLight,
        justifyContent: 'center',
        paddingHorizontal: 8,
        width: '100%',
    } as ViewStyle,

    sliderBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
    } as ViewStyle,

    sliderThumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    } as ViewStyle,

    questionInput: {
        backgroundColor: widgetColors.elementBgLight,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
    } as ViewStyle,
};


export const sharedWidgetStyles = StyleSheet.create({
    // Mapped for compatibility with my previous references, but using aligned values

    // Use for Poll, Slider, Question
    container: lightWidgetStyle.container,
    title: lightWidgetStyle.title,

    // Use for Quiz
    containerDark: darkWidgetStyle.container,
    titleDark: darkWidgetStyle.title,

    option: lightWidgetStyle.option,
    optionText: lightWidgetStyle.optionText,

    // Quiz specifics
    quizOption: darkWidgetStyle.option as ViewStyle,
    quizOptionText: darkWidgetStyle.optionText,

    // Badges (Location, Mention, etc)
    badge: commonStyles.badge,
    badgeText: commonStyles.badgeText,
    label: commonStyles.label,
    labelText: commonStyles.labelText,

    // Slider
    sliderTrack: interactionStyles.sliderTrack as ViewStyle,
    sliderBar: interactionStyles.sliderBar,
    sliderThumb: interactionStyles.sliderThumb as ViewStyle,

    // Questions
    questionInput: interactionStyles.questionInput,

    // Misc
    emoji: {
        fontSize: 60,
        textAlign: 'center',
    },

    containerInteractive: lightWidgetStyle.container, // Default to light
});

export default sharedWidgetStyles;
