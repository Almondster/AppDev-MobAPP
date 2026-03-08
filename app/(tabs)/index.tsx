import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from '../../styles/HomeScreen.styles';

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
          <Pressable style={styles.avatarButton} onPress={() => router.push('/profile')}>
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