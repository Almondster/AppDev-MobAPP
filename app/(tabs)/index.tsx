import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function HomeScreen() {
  const { theme, isDark, mode, setMode } = useTheme();
  const router = useRouter();

  const toggleDarkMode = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode as 'light' | 'dark' | 'system');
  };

  const renderCategory = (icon: any, label: string) => (
    <View style={styles.categoryItem}>
      <View style={[styles.categoryIcon, { backgroundColor: theme.card }]}>
        <Ionicons name={icon} size={24} color={theme.tint} />
      </View>
      <Text style={[styles.categoryLabel, { color: theme.text }]}>{label}</Text>
    </View>
  );

  const renderCreator = (name: string, rating: string, role: string) => (
    <View style={[styles.creatorCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.creatorAvatar} />
      <Text style={[styles.creatorName, { color: theme.text }]}>{name}</Text>
      <Text style={[styles.creatorRole, { color: theme.textSecondary }]}>{role}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color="#fbbf24" />
        <Text style={styles.ratingText}>{rating}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Hello,</Text>
          <Text style={[styles.userName, { color: theme.text }]}>Mock User 👋</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={toggleDarkMode} style={styles.themeToggleButton}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={theme.text}
            />
          </Pressable>
          <Pressable style={styles.avatarButton}>
            <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.avatarImage} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
            <Text style={[styles.seeAll, { color: theme.tint }]}>See All</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {renderCategory("color-palette-outline", "Design")}
            {renderCategory("code-slash-outline", "Development")}
            {renderCategory("videocam-outline", "Video")}
            {renderCategory("musical-notes-outline", "Audio")}
            {renderCategory("megaphone-outline", "Marketing")}
          </ScrollView>
        </View>

        {/* Top Creators */}
        <View style={[styles.section, { marginTop: 10 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Creators</Text>
            <Text style={[styles.seeAll, { color: theme.tint }]}>See All</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {renderCreator("Sarah Jenkins", "4.9", "UI/UX Designer")}
            {renderCreator("Mike Ross", "4.8", "Web Developer")}
            {renderCreator("Anna Smith", "5.0", "Video Editor")}
          </ScrollView>
        </View>

        {/* Recent Services */}
        <View style={[styles.section, { marginTop: 10, paddingBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Services</Text>
            <Text style={[styles.seeAll, { color: theme.tint }]}>See All</Text>
          </View>
          {/* Mock Service Card */}
          <View style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.serviceImage} />
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceCategory, { color: theme.tint }]}>Web Development</Text>
              <Text style={[styles.serviceTitle, { color: theme.text }]}>Full Stack React App Frontend & Backend</Text>
              <Text style={[styles.servicePrice, { color: theme.text }]}>From $500</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, borderBottomWidth: 1 },
  greeting: { fontSize: 14, fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: 'bold' },
  avatarButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeToggleButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  scrollContent: {},
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  seeAll: { fontSize: 14, fontWeight: '500' },
  horizontalScroll: { gap: 16, paddingRight: 20 },
  categoryItem: { alignItems: 'center', gap: 8 },
  categoryIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  categoryLabel: { fontSize: 13, fontWeight: '500' },
  creatorCard: { width: 140, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  creatorAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e2e8f0', marginBottom: 12 },
  creatorName: { fontSize: 15, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  creatorRole: { fontSize: 12, marginBottom: 8, textAlign: 'center' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  serviceCard: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12 },
  serviceImage: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#e2e8f0', marginRight: 16 },
  serviceInfo: { flex: 1, justifyContent: 'center' },
  serviceCategory: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  serviceTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  servicePrice: { fontSize: 16, fontWeight: 'bold' },
});