import { auth } from '@/frontend/session';
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

// --- SKELETON LOADER COMPONENT ---
const SkeletonMatchItem = () => {
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
          <Animated.View style={{ width: 140, height: 16, borderRadius: 4, backgroundColor: theme.cardBorder, marginBottom: 8, opacity }} />
          {/* Skills Skeleton */}
          <Animated.View style={{ width: 100, height: 13, borderRadius: 4, backgroundColor: theme.cardBorder, marginBottom: 8, opacity }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginRight: 8 }}>
            {/* Rating Skeleton */}
            <Animated.View style={{ width: 60, height: 12, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
            {/* Date Skeleton */}
            <Animated.View style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default function MatchesScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const { theme, isDark } = useTheme();

  const [matches, setMatches] = useState<any[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMatches = async () => {
    if (!user) return;
    try {
      // 1. Get all matches for current user
      const { data: matchData, error } = await supabase
        .from('matches')
        .select('creator_id, created_at')
        .eq('client_id', user.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!matchData || matchData.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Get unique Creator IDs
      const uniqueCreatorIds = [...new Set(matchData.map(m => m.creator_id))];

      // 3. Fetch Creator Details
      const { data: creatorsData } = await supabase
        .from('users')
        .select(`
          firebase_uid,
          full_name,
          avatar_url,
          role,
          creators (
            bio,
            skills
          )
        `)
        .in('firebase_uid', uniqueCreatorIds);

      if (!creatorsData) {
        setLoading(false);
        return;
      }

      // 4. Fetch Reviews for Ratings
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('reviewee_id, rating')
        .in('reviewee_id', uniqueCreatorIds);

      // 5. Merge Data
      const formattedMatches = creatorsData.map((creator: any) => {
        const userReviews = reviewsData?.filter(r => r.reviewee_id === creator.firebase_uid) || [];
        const totalRating = userReviews.reduce((acc, curr) => acc + curr.rating, 0);
        const avgRating = userReviews.length > 0 ? (totalRating / userReviews.length).toFixed(1) : 'New';

        // Find latest match date for sorting
        const latestMatch = matchData.find(m => m.creator_id === creator.firebase_uid);

        const skills = creator.creators?.[0]?.skills || [];
        const skillsText = skills.length > 0 ? skills.slice(0, 2).join(' • ') : creator.role || 'Creator';

        return {
          ...creator,
          rating: avgRating,
          reviewCount: userReviews.length,
          skillsText,
          matchedAt: latestMatch ? new Date(latestMatch.created_at) : new Date(0)
        };
      });

      // Sort by most recently matched
      const sorted = formattedMatches.sort((a, b) => b.matchedAt.getTime() - a.matchedAt.getTime());

      setMatches(sorted);
      setFilteredMatches(sorted);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = matches.filter(
        (m) =>
          m.full_name.toLowerCase().includes(text.toLowerCase()) ||
          m.skillsText.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredMatches(filtered);
    } else {
      setFilteredMatches(matches);
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
      style={[styles.card, themeStyles.card]}
      onPress={() => router.push(`/creator/${item.firebase_uid}`)}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.name, themeStyles.text]} numberOfLines={1}>{item.full_name}</Text>
          <Text style={[styles.skills, { color: theme.tint }]} numberOfLines={1}>{item.skillsText}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={[styles.ratingText, themeStyles.text]}>
                {item.rating} <Text style={themeStyles.textSecondary}>({item.reviewCount})</Text>
              </Text>
            </View>
            <Text style={[styles.dateText, themeStyles.textSecondary]}>
              Matched {item.matchedAt.toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={[styles.arrowBtn, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </View>
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
        <Text style={[styles.headerTitle, themeStyles.text]}>Match History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, themeStyles.input]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search history..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        // SKELETON LOADER STATE
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonMatchItem key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderItem}
          keyExtractor={(item) => item.firebase_uid}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, themeStyles.textSecondary]}>No match history yet.</Text>
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

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Shadows.lg,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ccc' },
  headerInfo: { flex: 1, marginLeft: 14, justifyContent: 'center' },

  name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  skills: { fontSize: 13, fontWeight: '600', marginBottom: 6 },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: 8 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600' },
  dateText: { fontSize: 11 },

  arrowBtn: { padding: 8, borderRadius: 20 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16 },
});
