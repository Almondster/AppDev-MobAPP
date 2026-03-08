import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from '../../styles/ProfileScreen.styles';

export default function ProfileScreen() {
    const { theme } = useTheme();
    const router = useRouter();

    const handleLogout = () => {
        router.replace('/login');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={[styles.profileCard, styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.avatarImage} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.userName, { color: theme.text }]}>Mock User</Text>
                        <Text style={[styles.userRole, { color: theme.tint }]}>CLIENT</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account</Text>

                <Pressable style={[styles.menuItem, styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.menuLeft}>
                        <Ionicons name="person-outline" size={20} color={theme.text} />
                        <Text style={[styles.menuText, { color: theme.text }]}>My Details</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>

                <Pressable style={[styles.menuItem, styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.menuLeft}>
                        <Ionicons name="settings-outline" size={20} color={theme.text} />
                        <Text style={[styles.menuText, { color: theme.text }]}>Settings</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                    onPress={handleLogout}
                    style={[styles.menuItem, styles.card, { backgroundColor: theme.card, borderColor: 'rgba(239, 68, 68, 0.2)' }]}
                >
                    <View style={styles.menuLeft}>
                        <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
                        <Text style={[styles.menuText, { color: '#ef4444' }]}>Logout</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#ef4444" />
                </Pressable>

            </ScrollView>
        </View>
    );
}
