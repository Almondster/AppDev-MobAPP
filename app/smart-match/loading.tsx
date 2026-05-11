import SmartMatchProgressHeader from "@/components/SmartMatchProgressHeader";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { runSmartMatch } from "@/frontend/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Shadows } from '@/constants/theme';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function SmartMatchLoading() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage(); // Use translation hook

  // State
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);

  // Parse Params
  const { category, skills, description, budget, timeline } = params;
  const parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : [];

  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    matchBadge: { backgroundColor: theme.tint },
  };

  // --- HANDLE BACK BUTTON ---
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(tabs)');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const projectDescription = String(description || '').trim();
        const smartMatchResponse = await runSmartMatch({
          query: projectDescription || [category, ...parsedSkills].filter(Boolean).join(' '),
          category: String(category || ''),
          skills: parsedSkills,
          budget: String(budget || ''),
          timeline: String(timeline || ''),
          limit: 5,
        });

        setResults(smartMatchResponse?.results || []);

        // Fake delay for "AI" effect
        setTimeout(() => setLoading(false), 2000);

      } catch (err) {
        console.error("Match error:", err);
        setLoading(false);
      }
    };

    if (parsedSkills.length > 0 || description) {
      fetchMatches();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderResultItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.resultCard, themeStyles.card]}
      onPress={() => router.push(`/creator/${item.users.firebase_uid}`)}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.users.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, themeStyles.text]}>{item.users.full_name}</Text>
          <Text style={[styles.role, themeStyles.textSecondary]}>{item.users.role}</Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBadge}>
              <Ionicons name={item.isAIRanked ? "sparkles" : "checkmark-circle"} size={12} color="#fff" />
              <Text style={styles.scoreText}>{item.matchScore}% {t('matchScore')}</Text>
            </View>
            <Text style={[styles.expText, themeStyles.textSecondary]}>
              {item.experience_years ? `${item.experience_years}y exp` : 'New'}
            </Text>
          </View>
        </View>
      </View>

      {/* AI Analysis Section */}
      {item.isAIRanked && (
        <View style={styles.aiInsights}>
          {/* Match Reason */}
          <View style={[styles.insightCard, { backgroundColor: theme.tint + '08', borderLeftColor: theme.tint }]}>
            <View style={styles.insightHeader}>
              <Ionicons name="sparkles" size={14} color={theme.tint} />
              <Text style={[styles.insightLabel, { color: theme.tint }]}>{t('aiAnalysis')}</Text>
            </View>
            <Text style={[styles.insightText, themeStyles.text]} numberOfLines={3}>
              {item.matchReason}
            </Text>
          </View>

          {/* Strength */}
          {item.matchStrength && (
            <View style={[styles.insightCard, { backgroundColor: '#10B98108', borderLeftColor: '#10B981' }]}>
              <View style={styles.insightHeader}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={[styles.insightLabel, { color: '#10B981' }]}>{t('keyStrength')}</Text>
              </View>
              <Text style={[styles.insightText, themeStyles.text]} numberOfLines={2}>
                {item.matchStrength}
              </Text>
            </View>
          )}

          {/* Concern (if exists) */}
          {item.matchConcern && (
            <View style={[styles.insightCard, { backgroundColor: '#F5971508', borderLeftColor: '#F59E0B' }]}>
              <View style={styles.insightHeader}>
                <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                <Text style={[styles.insightLabel, { color: '#F59E0B' }]}>{t('consider')}</Text>
              </View>
              <Text style={[styles.insightText, themeStyles.text]} numberOfLines={2}>
                {item.matchConcern}
              </Text>
            </View>
          )}
        </View>
      )}

      <Text style={[styles.bio, themeStyles.textSecondary]} numberOfLines={2}>
        {item.bio || t('noBio')}
      </Text>

      <View style={styles.skillsRow}>
        {item.skills?.slice(0, 3).map((skill: string, index: number) => (
          <View key={index} style={[styles.skillTag, { borderColor: theme.cardBorder }]}>
            <Text style={[styles.skillText, themeStyles.textSecondary]}>{skill}</Text>
          </View>
        ))}
        {item.skills?.length > 3 && (
          <Text style={[styles.moreSkills, themeStyles.textSecondary]}>+{item.skills.length - 3}</Text>
        )}
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionBtn, { borderColor: theme.cardBorder }]}
          onPress={() => router.push(`/creator/${item.users.firebase_uid}`)}
        >
          <Text style={[styles.btnText, themeStyles.text]}>{t('viewProfile')}</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: theme.tint, borderColor: theme.tint }]}
          onPress={() => {
            const msg = Array.isArray(description) ? description[0] : description || '';
            router.push(`/chat/${item.users.firebase_uid}?prefilledMessage=${encodeURIComponent(msg)}&fromSmartMatch=true`);
          }}
        >
          <Text style={[styles.btnText, { color: '#fff' }]}>{t('message')}</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, themeStyles.container]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SmartMatchProgressHeader currentStep={5} maxStep={5} />

        <View style={styles.loadingContent}>
          <Ionicons name="sparkles" size={100} color={theme.tint} style={styles.sparkleIcon} />
          <Text style={[styles.mainText, themeStyles.text]}>{t('aiAnalyzingTitle')}</Text>
          <Text style={[styles.subText, themeStyles.textSecondary]}>
            {t('aiAnalyzingDesc')}
          </Text>
          <ActivityIndicator size="large" color={theme.tint} style={styles.spinner} />

          <View style={styles.aiSteps}>
            <View style={styles.aiStep}>
              <Ionicons name="document-text" size={16} color={theme.tint} />
              <Text style={[styles.aiStepText, themeStyles.textSecondary]}>{t('stepAnalyzing')}</Text>
            </View>
            <View style={styles.aiStep}>
              <Ionicons name="people" size={16} color={theme.tint} />
              <Text style={[styles.aiStepText, themeStyles.textSecondary]}>{t('stepEvaluating')}</Text>
            </View>
            <View style={styles.aiStep}>
              <Ionicons name="analytics" size={16} color={theme.tint} />
              <Text style={[styles.aiStepText, themeStyles.textSecondary]}>{t('stepCalculating')}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <Pressable onPress={() => router.push('/(tabs)')}>
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, themeStyles.text]}>{t('matchesFound')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.resultCount, themeStyles.textSecondary]}>
              {results.length > 0 && results[0]?.isAIRanked
                ? t('aiFoundMatches').replace('{count}', results.length.toString())
                : t('basicFoundMatches').replace('{count}', results.length.toString())}
            </Text>
          </View>
        }
        renderItem={renderResultItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, themeStyles.text]}>{t('noMatches')}</Text>
            <Text style={[styles.emptyText, themeStyles.textSecondary]}>
              {t('noServicesFound')}
            </Text>
            <Pressable
              style={[styles.retryBtn, { backgroundColor: theme.tint }]}
              onPress={() => router.push('/smart-match/match')}
            >
              <Text style={styles.retryText}>{t('adjustSkills')}</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center" },
  loadingContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  sparkleIcon: { marginBottom: 30 },
  mainText: { fontSize: 20, fontWeight: "700", marginBottom: 20, textAlign: 'center' },
  subText: { fontSize: 14, textAlign: "center", marginBottom: 30 },
  spinner: { marginBottom: 20 },
  statusText: { fontSize: 16, fontWeight: "600" },
  aiSteps: {
    marginTop: 30,
    gap: 12,
    alignSelf: 'stretch',
    paddingHorizontal: 40,
  },
  aiStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiStepText: {
    fontSize: 13,
    fontWeight: '500',
  },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  resultCount: { fontSize: 14 },

  resultCard: { borderRadius: 16, padding: 16, marginBottom: 16, ...Shadows.md },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#ccc' },
  name: { fontSize: 16, fontWeight: '700' },
  role: { fontSize: 12, marginBottom: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 4 },
  scoreText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  expText: { fontSize: 12 },

  bio: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  skillTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  skillText: { fontSize: 10 },
  moreSkills: { fontSize: 10, alignSelf: 'center' },

  aiInsights: {
    gap: 8,
    marginBottom: 12,
  },
  insightCard: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    gap: 6,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 14, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyText: { textAlign: 'center', marginTop: 8, marginBottom: 24, paddingHorizontal: 40 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700' }
});

