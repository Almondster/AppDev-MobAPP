import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { Shadows } from '../../../constants/theme';

interface HomeHeaderProps {
  userName: string;
  userAvatar: string | null;
  totalNotifications: number;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ userName, userAvatar, totalNotifications }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.logo, { color: theme.text }]}>
            CREA<Text style={styles.logoBlue}>TECH</Text>
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable 
              onPress={() => router.push('/notifications')} 
              style={styles.iconButton}
            >
              <Ionicons name="notifications-outline" size={26} color={theme.text} />
              {totalNotifications > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {totalNotifications > 9 ? '9+' : totalNotifications}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable onPress={() => router.push('/profile')} hitSlop={10} style={styles.profileButton}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatarPlaceholder, { backgroundColor: theme.cardBorder }]}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>
                    {userName.charAt(0)}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <Text style={[styles.greeting, { color: theme.textSecondary }]}>
          {t('greeting')}, {userName} — {t('welcomeBack')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 0,
    ...Shadows.lg,
    zIndex: 10,
  },
  header: { 
    paddingHorizontal: 24, 
    paddingTop: 60, 
    paddingBottom: 24
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logo: { fontSize: 22, fontWeight: '700' },
  logoBlue: { color: '#3b82f6' },
  greeting: { fontSize: 14 },
  profileButton: { padding: 2 },
  headerAvatar: { width: 32, height: 32, borderRadius: 16 },
  headerAvatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
  },
  iconButton: { padding: 4 },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff' 
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
});
