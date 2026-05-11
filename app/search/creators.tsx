import { supabase } from '@/frontend/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { Shadows } from '@/constants/theme';

const toSkillList = (skills: unknown) => {
  if (Array.isArray(skills)) return skills.filter(Boolean).map(String);
  if (typeof skills === 'string') {
    return skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  }
  return [];
};

// --- SKELETON LOADER COMPONENT ---
const SkeletonCreatorItem = () => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
      <View style={styles.cardHeader}>
        {/* Avatar Skeleton */}
        <Animated.View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.cardBorder, opacity }} />

        <View style={{ marginLeft: 14, flex: 1, justifyContent: 'center' }}>
          {/* Name Skeleton */}
          <Animated.View style={{ width: 120, height: 16, borderRadius: 4, backgroundColor: theme.cardBorder, marginBottom: 8, opacity }} />
          {/* Title Skeleton */}
          <Animated.View style={{ width: 100, height: 12, borderRadius: 4, backgroundColor: theme.cardBorder, marginBottom: 8, opacity }} />
          {/* Rating Skeleton */}
          <Animated.View style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      {/* Skills Skeleton */}
      <View style={styles.skillsContainer}>
        <Animated.View style={{ width: 60, height: 24, borderRadius: 8, backgroundColor: theme.cardBorder, opacity }} />
        <Animated.View style={{ width: 70, height: 24, borderRadius: 8, backgroundColor: theme.cardBorder, opacity }} />
        <Animated.View style={{ width: 50, height: 24, borderRadius: 8, backgroundColor: theme.cardBorder, opacity }} />
      </View>
    </View>
  );
};

export default function AllCreatorsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [creators, setCreators] = useState<any[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const { data: creatorRows, error } = await supabase
        .from('creators')
        .select('*');

      if (error) throw error;

      if (!creatorRows || creatorRows.length === 0) {
        setCreators([]);
        setFilteredCreators([]);
        setLoading(false);
        return;
      }

      const creatorIds = creatorRows.map((creator: any) => creator.user_id);
      const [{ data: reviewsData }, { data: servicesData }] = await Promise.all([
        supabase.from('reviews').select('reviewee_id, rating').in('reviewee_id', creatorIds),
        supabase.from('services').select('creator_id, image_url').in('creator_id', creatorIds),
      ]);

      const formattedCreators = creatorRows.map((creator: any) => {
        const user = creator.user || creator.users || {};
        const userReviews = reviewsData?.filter((review: any) => String(review.reviewee_id) === String(creator.user_id)) || [];
        const totalRating = userReviews.reduce((acc, curr) => acc + curr.rating, 0);
        const avgRating = userReviews.length > 0 ? (totalRating / userReviews.length).toFixed(1) : 'New';
        const skills = toSkillList(creator.skills);
        const serviceCover = servicesData?.find((service: any) => String(service.creator_id) === String(creator.user_id) && service.image_url)?.image_url;

        const primaryTitle = skills.length > 0 ? skills[0] : 'Professional Creator';

        return {
          id: creator.id,
          firebase_uid: String(creator.user_id),
          full_name: user.full_name || user.username || 'Creator',
          avatar_url: user.avatar_url || serviceCover || null,
          bio: creator.bio,
          experience_years: creator.experience_years,
          rating: avgRating,
          reviewCount: userReviews.length,
          primaryTitle,
          allSkills: skills
        };
      });

      // Sort: High rating first, then "New"
      const sorted = formattedCreators.sort((a, b) => {
        if (a.rating === 'New') return 1;
        if (b.rating === 'New') return -1;
        return parseFloat(b.rating) - parseFloat(a.rating);
      });

      setCreators(sorted);
      setFilteredCreators(sorted);

    } catch (err) {
      console.error('Error fetching creators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = creators.filter(
        (c) =>
          c.full_name.toLowerCase().includes(text.toLowerCase()) ||
          (c.allSkills && c.allSkills.some((s: string) => s.toLowerCase().includes(text.toLowerCase())))
      );
      setFilteredCreators(filtered);
    } else {
      setFilteredCreators(creators);
    }
  };

  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    input: { backgroundColor: theme.inputBackground, color: theme.text },
    pill: { backgroundColor: theme.tint + '15' },
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={({ pressed: _pressed }) => [styles.card, themeStyles.card]}
      onPress={() => router.push(`/creator/${item.firebase_uid}`)}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, themeStyles.text]} numberOfLines={1}>
              {item.full_name}
            </Text>
            <Ionicons name="checkmark-circle" size={16} color={theme.tint} style={{ marginLeft: 4 }} />
          </View>

          <Text style={[styles.title, { color: theme.tint }]}>{item.primaryTitle}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={[styles.ratingText, themeStyles.text]}>
              {item.rating} <Text style={themeStyles.textSecondary}>({item.reviewCount} reviews)</Text>
            </Text>
          </View>
        </View>

        <View style={[styles.arrowBtn, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      <View style={styles.skillsContainer}>
        {item.allSkills && item.allSkills.slice(0, 3).map((skill: string, index: number) => (
          <View key={index} style={[styles.skillPill, themeStyles.pill]}>
            <Text style={[styles.skillText, { color: theme.tint }]}>{skill}</Text>
          </View>
        ))}
        {item.allSkills && item.allSkills.length > 3 && (
          <Text style={[styles.moreSkills, themeStyles.textSecondary]}>+{item.allSkills.length - 3}</Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, themeStyles.text]}>Find Creators</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, themeStyles.input]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search creators..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        // SKELETON LOADER STATE
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCreatorItem key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredCreators}
          renderItem={renderItem}
          keyExtractor={(item) => item.firebase_uid}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, themeStyles.textSecondary]}>No creators found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700' },

  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Card Styles
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Shadows.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  title: { fontSize: 13, fontWeight: '600', marginBottom: 6 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600' },

  arrowBtn: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },

  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 14 },

  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  skillPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  skillText: { fontSize: 11, fontWeight: '600' },
  moreSkills: { fontSize: 11 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16 },
});
