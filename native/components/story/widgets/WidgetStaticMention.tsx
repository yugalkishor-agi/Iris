/**
 * Static Mention Widget - Display-only @username badge
 */
import React from 'react';
import { View, Text } from 'react-native';
import { sharedWidgetStyles } from './styles';

interface WidgetStaticMentionProps {
    data: {
        handle?: string;
        username?: string;
    };
}

export function WidgetStaticMention({ data }: WidgetStaticMentionProps) {
    const handle = data.handle || data.username || 'user';
    const text = handle.startsWith('@') ? handle : `@${handle}`;

    return (
        <View style={sharedWidgetStyles.badge}>
            <Text style={sharedWidgetStyles.badgeText}>{text}</Text>
        </View>
    );
}

export default WidgetStaticMention;
