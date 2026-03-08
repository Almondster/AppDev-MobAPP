import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { CategoryCard, SeeAllCard } from '../cards';

interface CategorySectionProps {
  categories: any[];
}

export const CategorySection: React.FC<CategorySectionProps> = ({ categories }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <View style={{ paddingTop: 26 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text }}>{t('servicesCat')}</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, paddingVertical: 6 }}
        bounces={false}
        overScrollMode="never"
      >
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
        <SeeAllCard height={180} onPress={() => router.push('/search')} />
      </ScrollView>
    </View>
  );
};
