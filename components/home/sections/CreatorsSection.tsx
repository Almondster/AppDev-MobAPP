import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { CreatorCard, SeeAllCard } from '../cards';

interface CreatorsSectionProps {
  creators: any[];
  onCreatorPress: (creator: any) => void;
}

export const CreatorsSection: React.FC<CreatorsSectionProps> = ({ creators, onCreatorPress }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <View style={{ paddingTop: 26 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text }}>{t('topCreators')}</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, paddingVertical: 6 }}
        bounces={false}
        overScrollMode="never"
      >
        {creators.map((creator) => (
          <CreatorCard key={creator.firebase_uid} creator={creator} onPress={() => onCreatorPress(creator)} />
        ))}
        <SeeAllCard height={170} onPress={() => router.push('/search/creators')} />
      </ScrollView>
    </View>
  );
};
