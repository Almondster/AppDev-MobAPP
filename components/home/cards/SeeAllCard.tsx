import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';

interface SeeAllCardProps {
  onPress: () => void;
  height: number;
}

export const SeeAllCard: React.FC<SeeAllCardProps> = ({ onPress, height }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Pressable 
      style={[
        styles.seeAllCard, 
        { 
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          height: height 
        }
      ]} 
      onPress={onPress}
    >
      <View style={[styles.seeAllCircle, { backgroundColor: theme.tint }]}>
        <Ionicons name="arrow-forward" size={24} color="#fff" />
      </View>
      <Text style={[styles.seeAllText, { color: theme.text }]}>{t('seeAll')}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  seeAllCard: { 
    width: 80, 
    borderRadius: 16, 
    marginRight: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderStyle: 'dashed' 
  },
  seeAllCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  seeAllText: { 
    fontSize: 12, 
    fontWeight: '600' 
  },
});
