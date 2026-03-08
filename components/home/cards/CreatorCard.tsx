import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { Shadows } from '../../../constants/theme';

interface CreatorCardProps {
  creator: {
    firebase_uid: string;
    full_name: string;
    avatar_url?: string;
    calculated_rating?: string;
  };
  onPress: () => void;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator, onPress }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.creatorCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          borderWidth: 1,
        },
        pressed && styles.cardPressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.creatorTopPlaceholder, { backgroundColor: theme.cardBorder }]}>
        {creator.avatar_url ? (
          <Image source={{uri: creator.avatar_url}} style={{width: '100%', height: '100%'}} />
        ) : (
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
            {creator.full_name?.charAt(0)}
          </Text>
        )}
        
        <View style={styles.ratingOverlay}>
          <Ionicons name="star" size={10} color="#fbbf24" />
          <Text style={styles.ratingOverlayText}>{creator.calculated_rating}</Text>
        </View>
      </View>

      <View style={styles.creatorInfo}>
        <Text style={[styles.creatorName, { color: theme.text }]} numberOfLines={1}>
          {creator.full_name}
        </Text>
        <Text style={[styles.creatorRole, { color: theme.textSecondary }]}>
          {t('creatorRole')}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  creatorCard: { 
    width: 180, 
    height: 170, 
    marginRight: 16, 
    borderRadius: 16, 
    overflow: 'hidden',
    ...Shadows.md,
  },
  creatorTopPlaceholder: { 
    height: 110, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
  },
  ratingOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingOverlayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  creatorInfo: { 
    padding: 12,
  },
  creatorName: { 
    fontSize: 14, 
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorRole: { 
    fontSize: 12,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
  },
  cardPressed: { 
    opacity: 0.8 
  },
});
