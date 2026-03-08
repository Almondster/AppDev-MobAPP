import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Shadows } from '../../constants/theme';

interface NotificationSectionHeaderProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    theme: any;
    themeStyles: any;
    disabled?: boolean;
}

export const NotificationSectionHeader: React.FC<NotificationSectionHeaderProps> = ({
    icon,
    iconColor,
    title,
    description,
    enabled,
    onToggle,
    theme,
    themeStyles,
    disabled = false,
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
        <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.title, themeStyles.text]}>{title}</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 2,
    },
    description: {
        fontSize: 13,
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
