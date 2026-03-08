import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Shadows } from '../../constants/theme';

interface NotificationToggleProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
    theme: any;
    themeStyles: any;
}

export const NotificationToggle: React.FC<NotificationToggleProps> = ({
    icon,
    label,
    description,
    enabled,
    onToggle,
    disabled = false,
    theme,
    themeStyles,
}) => {
    const translateX = useRef(new Animated.Value(enabled ? 20 : 0)).current;
    const backgroundColor = useRef(new Animated.Value(enabled ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateX, {
                toValue: enabled ? 20 : 0,
                useNativeDriver: true,
                speed: 50,
                bounciness: 8,
            }),
            Animated.timing(backgroundColor, {
                toValue: enabled ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    }, [enabled, translateX, backgroundColor]);

    const interpolatedColor = backgroundColor.interpolate({
        inputRange: [0, 1],
        outputRange: ['#cbd5e1', theme.tint],
    });

    return (
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                    <Ionicons name={icon} size={20} color={theme.text} style={{ marginRight: 8 }} />
                    <Text style={[styles.label, themeStyles.text]}>{label}</Text>
                </View>
                <Text style={[styles.description, themeStyles.textSecondary]}>{description}</Text>
            </View>
            <Pressable
                style={[styles.toggle, { opacity: disabled ? 0.4 : 1 }]}
                onPress={onToggle}
                disabled={disabled}
            >
                <Animated.View style={[styles.toggleTrack, { backgroundColor: interpolatedColor }]}>
                    <Animated.View
                        style={[
                            styles.toggleKnob,
                            { transform: [{ translateX }] },
                        ]}
                    />
                </Animated.View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
    },
    description: {
        fontSize: 13,
        marginTop: 2,
    },
    toggle: {
        padding: 4,
    },
    toggleTrack: {
        width: 48,
        height: 28,
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        ...Shadows.xl,
    },
});
