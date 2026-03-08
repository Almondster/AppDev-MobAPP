import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { Shadows } from '@/constants/theme';

// 1. DATA: Subcategory Mapping
const SUBCATEGORY_MAP: Record<string, string[]> = {
  'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
  'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
  'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Proofreading', 'Scriptwriting'],
  'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
  'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
  'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

// 2. ICON MAPPING: Helper to get relevant icon
const getSubcategoryIcon = (name: string): keyof typeof Ionicons.glyphMap => {
  switch (name) {
    // Design
    case 'Logo Design': return 'shapes-outline';
    case 'Brand Style Guides': return 'book-outline';
    case 'Illustration': return 'brush-outline';
    case 'UI/UX Design': return 'layers-outline';
    case 'Portrait Drawing': return 'person-outline';

    // Dev
    case 'Web Development': return 'globe-outline';
    case 'Mobile App Development': return 'phone-portrait-outline';
    case 'Game Development': return 'game-controller-outline';
    case 'Support & IT': return 'hardware-chip-outline';

    // Writing
    case 'Articles & Blog Posts': return 'newspaper-outline';
    case 'Translation': return 'language-outline';
    case 'Proofreading': return 'checkmark-done-circle-outline';
    case 'Scriptwriting': return 'document-text-outline';

    // Marketing
    case 'Social Media Marketing': return 'share-social-outline';
    case 'SEO': return 'search-outline';
    case 'Content Marketing': return 'megaphone-outline';
    case 'Video Marketing': return 'play-circle-outline';

    // Video
    case 'Video Editing': return 'cut-outline';
    case 'Animation for Kids': return 'happy-outline';
    case '3D Product Animation': return 'cube-outline';
    case 'Visual Effects': return 'flash-outline';

    // Audio
    case 'Voice Over': return 'mic-outline';
    case 'Mixing & Mastering': return 'options-outline';
    case 'Producers & Composers': return 'musical-notes-outline';
    case 'Singers & Vocalists': return 'people-outline';

    default: return 'grid-outline';
  }
};

export default function SubcategoryScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const mainCategory = params.mainCategory as string;

  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation for Skeleton
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Start pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Simulate Network Request
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (mainCategory && SUBCATEGORY_MAP[mainCategory]) {
        setSubcategories(SUBCATEGORY_MAP[mainCategory]);
      } else {
        setSubcategories(['General Services', 'Other']);
      }
      setIsLoading(false);
    }, 1000); // 1 second delay for skeleton demo

    return () => clearTimeout(timer);
  }, [mainCategory, fadeAnim]);

  const themeStyles = {
    container: { backgroundColor: theme.background },
    header: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    // UPDATED: Matches the Search Screen colors exactly (#1e293b for dark, tint + '20' for light)
    iconBg: { backgroundColor: isDark ? '#1e293b' : theme.tint + '20' },
    skeletonColor: { backgroundColor: isDark ? '#334155' : '#e2e8f0' }
  };

  // Skeleton Component
  const SkeletonItem = () => (
    <View style={[styles.card, themeStyles.card]}>
      {/* Icon Circle Skeleton */}
      <Animated.View style={[styles.iconCircle, themeStyles.skeletonColor, { opacity: fadeAnim }]} />

      <View style={styles.cardContent}>
        {/* Title Skeleton */}
        <Animated.View style={[{ height: 16, width: '60%', borderRadius: 4, marginBottom: 8 }, themeStyles.skeletonColor, { opacity: fadeAnim }]} />
        {/* Subtitle Skeleton */}
        <Animated.View style={[{ height: 12, width: '40%', borderRadius: 4 }, themeStyles.skeletonColor, { opacity: fadeAnim }]} />
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: string }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        themeStyles.card,
        pressed && styles.cardPressed
      ]}
      onPress={() => router.push({
        pathname: '/search/services',
        params: { subcategory: item }
      })}
    >
      {/* Dynamic Icon Circle */}
      <View style={[styles.iconCircle, themeStyles.iconBg]}>
        <Ionicons name={getSubcategoryIcon(item)} size={24} color={theme.tint} />
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, themeStyles.text]}>{item}</Text>
        <Text style={[styles.cardSubtitle, themeStyles.textSecondary]}>
          View available services
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.headerContainer, themeStyles.header]}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, themeStyles.text]}>{mainCategory}</Text>
            <Text style={[styles.headerSubtitle, themeStyles.textSecondary]}>
              Select a category
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {/* Render 5 skeleton items */}
          {[1, 2, 3, 4, 5].map((key) => <SkeletonItem key={key} />)}
        </View>
      ) : (
        <FlatList
          data={subcategories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header Styles
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.xl,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700'
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },

  listContent: {
    padding: 24,
    paddingTop: 32,
  },

  // Card Styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    ...Shadows.md,
  },
  cardPressed: {
    opacity: 0.8,
  },

  // Icon Circle
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
  }
});