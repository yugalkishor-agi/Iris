/**
 * Static Time Widget - Display-only time badge
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { sharedWidgetStyles } from './styles';

interface WidgetStaticTimeProps {
    data: {
        format?: string;
        timestamp?: any;
    };
}

export function WidgetStaticTime({ data }: WidgetStaticTimeProps) {
    const now = new Date();
    const h = now.getHours() % 12 || 12;
    const m = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const timeStr = `${h}:${m} ${ampm}`;

    return (
        <View style={sharedWidgetStyles.label}>
            <Text style={[sharedWidgetStyles.labelText, { color: '#fff' }]}>{timeStr}</Text>
        </View>
    );
}

export default WidgetStaticTime;
