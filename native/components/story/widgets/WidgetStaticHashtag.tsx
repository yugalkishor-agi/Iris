/**
 * Static Hashtag Widget - Display-only #tag badge
 */
import React from 'react';
import { View, Text } from 'react-native';
import { sharedWidgetStyles } from './styles';

interface WidgetStaticHashtagProps {
    data: {
        tag?: string;
    };
}

export function WidgetStaticHashtag({ data }: WidgetStaticHashtagProps) {
    const tag = data.tag || 'tag';
    const text = tag.startsWith('#') ? tag : `#${tag}`;

    return (
        <View style={sharedWidgetStyles.badge}>
            <Text style={sharedWidgetStyles.badgeText}>{text}</Text>
        </View>
    );
}

export default WidgetStaticHashtag;
