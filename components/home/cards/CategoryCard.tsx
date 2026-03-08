import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Shadows } from '../../../constants/theme';

interface CategoryCardProps {
  category: {
    id: number;
    label: string;
    icon: string;
    color?: string;
  };
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.categoryCard, 
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          borderWidth: 1,
        },
        pressed && styles.cardPressed
      ]}
      onPress={() => router.push({ 
        pathname: '/search/subcategory', 
        params: { mainCategory: category.label } 
      })}
    >
      <View style={[
        styles.categoryHeader,
        { 
          backgroundColor: isDark 
            ? '#1e293b' 
            : (category.color || '#3b82f6') + '20' 
        }
      ]}>
        <View style={[styles.categoryIconCircle, { backgroundColor: theme.card }]}>
          <Ionicons name={category.icon as any} size={32} color={category.color || theme.tint} />
        </View>
      </View>

      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryLabelText, { color: theme.text }]} numberOfLines={2}>
          {category.label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  categoryCard: { 
    width: 220, 
    height: 180, 
    borderRadius: 16, 
    marginRight: 16, 
    overflow: 'hidden',
    ...Shadows.lg,
  },
  categoryHeader: { 
    height: 100, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: { 
    padding: 12,
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  categoryLabelText: { 
    fontSize: 15, 
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center'
  },
  cardPressed: { 
    opacity: 0.8 
  },
});
