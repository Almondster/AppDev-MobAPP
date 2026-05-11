import { supabase } from '@/frontend/store';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Shadows } from '@/constants/theme';

const CARD_GAP = 12;
const HORIZONTAL_PADDING = 24;

const toSkillList = (skills: unknown) => {
  if (Array.isArray(skills)) return skills.filter(Boolean).map(String);
  if (typeof skills === 'string') {
    return skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  }
  return [];
};

export default function SearchScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('services');
  const [searchQuery, setSearchQuery] = useState('');

  // DATA STATE
  const [categories, setCategories] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - (HORIZONTAL_PADDING * 2) - CARD_GAP) / 2;

  useFocusEffect(
    useCallback(() => {
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, searchQuery])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'services') {
        // 1. Fetch Categories from Supabase
        let query = supabase.from('categories').select('*').order('id', { ascending: true });

        const { data: catsData } = await query;

        if (catsData) {
          if (searchQuery) {
            const filtered = catsData.filter(c =>
              c.label.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setCategories(filtered);
          } else {
            setCategories(catsData);
          }
        }

      } else {
        const { data: creatorRows, error } = await supabase
          .from('creators')
          .select('*');

        if (error) throw error;

        const creatorIds = (creatorRows || []).map((creator: any) => creator.user_id);
        const [{ data: reviewsData }, { data: servicesData }] = await Promise.all([
          supabase.from('reviews').select('reviewee_id, rating').in('reviewee_id', creatorIds),
          supabase.from('services').select('creator_id, image_url').in('creator_id', creatorIds),
        ]);

        const formattedCreators = (creatorRows || [])
          .map((creator: any) => {
            const user = creator.user || creator.users || {};
            const skills = toSkillList(creator.skills);
            const creatorReviews = reviewsData?.filter((review: any) => String(review.reviewee_id) === String(creator.user_id)) || [];
            const averageRating = creatorReviews.length > 0
              ? creatorReviews.reduce((total: number, review: any) => total + Number(review.rating || 0), 0) / creatorReviews.length
              : 0;
            const serviceCover = servicesData?.find((service: any) => String(service.creator_id) === String(creator.user_id) && service.image_url)?.image_url;

            return {
              id: creator.id,
              firebase_uid: String(creator.user_id),
              full_name: user.full_name || user.username || 'Creator',
              avatar_url: user.avatar_url || serviceCover || null,
              primaryTitle: skills[0] || 'Professional Creator',
              allSkills: skills,
              rating: creatorReviews.length > 0 ? averageRating.toFixed(1) : 'New',
              reviewCount: creatorReviews.length,
            };
          })
          .filter((creator: any) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return creator.full_name.toLowerCase().includes(query)
              || creator.primaryTitle.toLowerCase().includes(query)
              || creator.allSkills.some((skill: string) => skill.toLowerCase().includes(query));
          });

        setCreators(formattedCreators);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const themeStyles = {
    container: { backgroundColor: theme.background },
    header: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    input: { backgroundColor: theme.inputBackground, color: theme.text },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    placeholder: { backgroundColor: isDark ? '#222' : '#f1f5f9' },
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.headerContainer, themeStyles.header]}>
        <Text style={[styles.headerTitle, themeStyles.text]}>{t('searchTitle')}</Text>

        <View style={[styles.searchBar, themeStyles.input]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            style={styles.tabButton}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' ? { color: theme.tint } : { color: theme.textSecondary }]}>
              {t('tabServices')}
            </Text>
            {activeTab === 'services' && (
              <View style={[styles.activeIndicator, { backgroundColor: theme.tint }]} />
            )}
          </Pressable>
          <Pressable
            style={styles.tabButton}
            onPress={() => setActiveTab('creators')}
          >
            <Text style={[styles.tabText, activeTab === 'creators' ? { color: theme.tint } : { color: theme.textSecondary }]}>
              {t('tabCreators')}
            </Text>
            {activeTab === 'creators' && (
              <View style={[styles.activeIndicator, { backgroundColor: theme.tint }]} />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {loading && activeTab === 'creators' ? (
          <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.gridContainer}>
            {activeTab === 'services' ? (
              categories.map((cat) => {

                // --- CONDITIONAL RENDERING BASED ON THEME ---
                if (isDark) {
                  // DARK MODE: Old "Centered" Layout
                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.gridCard,
                        styles.centeredCard, // Use centered layout
                        themeStyles.card,
                        { width: cardWidth }
                      ]}
                      onPress={() => router.push({
                        pathname: '/search/subcategory',
                        params: { mainCategory: cat.label }
                      })}
                    >
                      <View style={[
                        styles.iconPlaceholder,
                        { backgroundColor: '#1e293b' }
                      ]}>
                        <Ionicons name={cat.icon as any} size={28} color={cat.color || theme.tint} />
                      </View>

                      <Text style={[styles.cardTitle, themeStyles.text]} numberOfLines={2}>
                        {cat.label}
                      </Text>
                      <Text style={[styles.cardSubtitle, themeStyles.textSecondary]} numberOfLines={1}>
                        Services
                      </Text>
                    </Pressable>
                  );
                } else {
                  // LIGHT MODE: New "Header" Layout
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.gridCard, themeStyles.card, { width: cardWidth }]}
                      onPress={() => router.push({
                        pathname: '/search/subcategory',
                        params: { mainCategory: cat.label }
                      })}
                    >
                      {/* Styled Header */}
                      <View style={[
                        styles.cardHeader,
                        { backgroundColor: (cat.color || theme.tint) + '20' }
                      ]}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
                          <Ionicons name={cat.icon as any} size={28} color={cat.color || theme.tint} />
                        </View>
                      </View>

                      {/* Content Section */}
                      <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, themeStyles.text]} numberOfLines={2}>
                          {cat.label}
                        </Text>
                        <Text style={[styles.cardSubtitle, themeStyles.textSecondary]} numberOfLines={1}>
                          Services
                        </Text>
                      </View>
                    </Pressable>
                  );
                }
              })
            ) : (
              creators.map((creator) => (
                <Pressable
                  key={creator.id}
                  style={[styles.gridCard, styles.centeredCard, themeStyles.card, { width: cardWidth }]}
                  onPress={() => router.push(`/creator/${creator.firebase_uid}`)}
                >
                  <View style={[styles.avatarPlaceholder, themeStyles.placeholder]}>
                    {creator.avatar_url ? (
                      <Image source={{ uri: creator.avatar_url }} style={styles.avatarImage} />
                    ) : (
                      <Text style={[styles.avatarText, themeStyles.text]}>
                        {creator.full_name?.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.cardTitle, themeStyles.text]} numberOfLines={1}>
                    {creator.full_name}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.tint }]} numberOfLines={1}>
                    {creator.primaryTitle || t('creatorRole')}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.xl,
    zIndex: 10,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', paddingHorizontal: 24, marginBottom: 16 },
  searchBar: {
    marginHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 50,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, height: '100%' },
  tabsContainer: { flexDirection: 'row' },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative'
  },
  tabText: { fontSize: 16, fontWeight: '600' },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    width: 40,
    borderRadius: 4,
  },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 24 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // --- UPDATED CARD STYLES ---
  gridCard: {
    borderRadius: 16,
    height: 180,
    marginBottom: 12,
    ...Shadows.md,
    overflow: 'hidden'
  },
  // Used for Creators AND Dark Mode Services
  centeredCard: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Used for Dark Mode Services (Legacy Style)
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },

  // --- NEW STYLES (Light Mode Services) ---
  cardHeader: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  // Creator specific styles
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 24, fontWeight: '700' },

  // Shared Text Styles
  cardTitle: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, textAlign: 'center' },
});
