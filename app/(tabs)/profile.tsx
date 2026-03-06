import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
    const { theme } = useTheme();

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

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, borderBottomWidth: 1 },
    headerTitle: { fontSize: 24, fontWeight: '700' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
    profileCard: { flexDirection: 'row', alignItems: 'center' },
    avatarWrapper: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e2e8f0', marginRight: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    profileInfo: { flex: 1 },
    userName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    userRole: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    menuText: { fontSize: 16, fontWeight: '500' },
});
