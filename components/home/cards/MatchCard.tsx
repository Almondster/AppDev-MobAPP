import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Shadows } from '../../../constants/theme';

interface MatchCardProps {
  match: {
    id: string;
    full_name: string;
    role: string;
    rating: string;
    skillsText: string;
    description: string;
    avatar_url?: string;
  };
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.matchCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          borderWidth: 1,
        },
        pressed && styles.cardPressed
      ]}
      onPress={() => router.push(`/creator/${match.id}`)}
    >
      <View style={[styles.matchImagePlaceholder, { backgroundColor: theme.cardBorder }]}>
        {match.avatar_url ? (
          <Image source={{ uri: match.avatar_url }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Ionicons name="person" size={40} color={theme.textSecondary} />
        )}
      </View>

      <View style={styles.matchInfo}>
        <View style={styles.matchHeaderRow}>
          <View style={[styles.matchAvatarPlaceholder, { backgroundColor: theme.cardBorder }]}>
            <Text style={[styles.avatarText, { color: theme.text }]}>{match.full_name.charAt(0)}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.matchName, { color: theme.text }]} numberOfLines={1}>
              {match.full_name}
            </Text>
            <Text style={[styles.matchTitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {match.role}
            </Text>
          </View>
        </View>

        <Text style={[styles.matchDesc, { color: theme.text }]} numberOfLines={2}>
          {match.description}
        </Text>

        <View style={styles.matchFooterRow}>
          <View style={styles.cardRatingBadge}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={[styles.ratingText, { color: theme.text }]}>{match.rating}</Text>
          </View>

          <Text style={[styles.matchSkills, { color: theme.tint }]} numberOfLines={1}>
            {match.skillsText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  matchCard: { 
    width: 260, 
    height: 280, 
    marginRight: 16, 
    borderRadius: 16, 
    overflow: 'hidden',
    ...Shadows.md,
  },
  matchImagePlaceholder: { 
    height: 140, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  matchInfo: { 
    padding: 12,
    flex: 1,
    justifyContent: 'space-between'
  },
  matchHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  matchAvatarPlaceholder: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    marginRight: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    fontWeight: '700' 
  },
  matchName: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  matchTitle: { 
    fontSize: 12 
  },
  matchDesc: { 
    fontSize: 13, 
    lineHeight: 18,
    marginBottom: 12,
    flex: 1
  },
  matchFooterRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto'
  },
  cardRatingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchSkills: {
    fontSize: 12, 
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8
  },
  cardPressed: { 
    opacity: 0.8 
  },
});
