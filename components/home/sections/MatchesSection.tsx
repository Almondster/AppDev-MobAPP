import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { MatchCard, SeeAllCard } from '../cards';

interface MatchesSectionProps {
  matches: any[];
  hasMatches: boolean;
}

export const MatchesSection: React.FC<MatchesSectionProps> = ({ matches, hasMatches }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  if (!hasMatches || matches.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingTop: 26 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text }}>{t('recentlyMatched')}</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, paddingVertical: 6 }}
        bounces={false}
        overScrollMode="never"
      >
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
        <SeeAllCard height={280} onPress={() => router.push('/search/recentmatch')} />
      </ScrollView>
    </View>
  );
};
