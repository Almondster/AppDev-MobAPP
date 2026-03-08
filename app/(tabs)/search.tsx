
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
  Text,
  TextInput,
  View
} from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { styles } from '../../styles/SearchScreen.styles';

const CARD_GAP = 12;
const HORIZONTAL_PADDING = 24;

export default function SearchScreen() {
  const { theme, isDark } = useTheme();
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
    setTimeout(() => {
      // Mock Categories
      setCategories([{ id: 1, label: 'UI/UX Design', icon: 'color-palette', color: theme.tint }]);
      setCreators([{ id: 1, full_name: 'John Doe', avatar_url: '' }]);
      setLoading(false);
    }, 500);
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
        <Text style={[styles.headerTitle, themeStyles.text]}>Search</Text>

        <View style={[styles.searchBar, themeStyles.input]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            placeholder='Search for services or creators'
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
              Services
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
              Creators
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
                        pathname: '/search/subcategory' as never,
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
                        pathname: '/search/subcategory' as never,
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
                  onPress={() => router.push(`/creator` as never)}
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
                    Creator
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



