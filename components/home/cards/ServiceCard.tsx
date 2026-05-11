import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Shadows } from '../../../constants/theme';

// Main categories with their icons
const MAIN_CATEGORIES = [
  { label: 'Design & Creative', icon: 'color-palette-outline' },
  { label: 'Development & IT', icon: 'code-slash-outline' },
  { label: 'Writing & Translation', icon: 'document-text-outline' },
  { label: 'Digital Marketing', icon: 'trending-up-outline' },
  { label: 'Video & Animation', icon: 'videocam-outline' },
  { label: 'Music & Audio', icon: 'musical-notes-outline' },
];

// Subcategory to Main Category mapping
const SUBCATEGORY_MAP: Record<string, string[]> = {
  'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
  'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
  'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Proofreading', 'Scriptwriting'],
  'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
  'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
  'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

// Helper function to get main category and icon from subcategory (label)
const getCategoryInfo = (subcategory: string): { label: string; icon: string } => {
  for (const [mainCategory, subcategories] of Object.entries(SUBCATEGORY_MAP)) {
    if (subcategories.includes(subcategory)) {
      const categoryInfo = MAIN_CATEGORIES.find(cat => cat.label === mainCategory);
      return categoryInfo || { label: 'Other', icon: 'folder-outline' };
    }
  }
  return { label: 'Other', icon: 'folder-outline' }; // Fallback if not found
};

const SUBCATEGORY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Logo Design': 'shapes-outline',
  'Brand Style Guides': 'book-outline',
  'Illustration': 'brush-outline',
  'UI/UX Design': 'layers-outline',
  'Portrait Drawing': 'person-outline',
  'Web Development': 'globe-outline',
  'Mobile App Development': 'phone-portrait-outline',
  'Game Development': 'game-controller-outline',
  'Support & IT': 'hardware-chip-outline',
  'Articles & Blog Posts': 'newspaper-outline',
  'Translation': 'language-outline',
  'Proofreading': 'checkmark-done-circle-outline',
  'Scriptwriting': 'document-text-outline',
  'Social Media Marketing': 'share-social-outline',
  'SEO': 'search-outline',
  'Content Marketing': 'megaphone-outline',
  'Video Marketing': 'play-circle-outline',
  'Video Editing': 'cut-outline',
  'Animation for Kids': 'happy-outline',
  '3D Product Animation': 'cube-outline',
  'Visual Effects': 'flash-outline',
  'Voice Over': 'mic-outline',
  'Mixing & Mastering': 'options-outline',
  'Producers & Composers': 'musical-notes-outline',
  'Singers & Vocalists': 'people-outline',
};

const getSubcategoryIcon = (subcategory: string): keyof typeof Ionicons.glyphMap => {
  return SUBCATEGORY_ICON_MAP[subcategory] || 'grid-outline';
};

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: string;
    image_url?: string;
    label: string;
    creator?: {
      full_name: string;
      avatar_url?: string;
    };
  };
  onPress: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress }) => {
  const { theme } = useTheme();
  const categoryInfo = getCategoryInfo(service.label);
  const subcategoryIcon = getSubcategoryIcon(service.label);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.serviceCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          borderWidth: 1,
        },
        pressed && styles.cardPressed
      ]}
      onPress={onPress}
    >
      <View style={styles.serviceImageContainer}>
        {service.image_url ? (
          <Image source={{ uri: service.image_url }} style={styles.serviceImage} resizeMode="cover" />
        ) : (
          <View style={[styles.serviceImagePlaceholder, { backgroundColor: theme.cardBorder }]}>
            <Ionicons name="briefcase-outline" size={28} color={theme.textSecondary} />
          </View>
        )}
        
        <View style={styles.categoryChip}>
          <Ionicons name={subcategoryIcon} size={11} color="#fff" />
          <Text style={styles.categoryChipText} numberOfLines={1}>{service.label}</Text>
        </View>
      </View>

      <View style={styles.serviceContent}>
        <Text style={[styles.serviceTitle, { color: theme.text }]} numberOfLines={1}>
          {service.title}
        </Text>

        <Text style={[styles.serviceDescription, { color: theme.textSecondary }]} numberOfLines={2}>
          {service.description}
        </Text>

        <View style={styles.creatorRow}>
          <Image 
            source={{ uri: service.creator?.avatar_url || 'https://via.placeholder.com/30' }} 
            style={styles.creatorAvatarSmall} 
          />
          <Text style={[styles.creatorNameSmall, { color: theme.textSecondary }]} numberOfLines={1}>
            {service.creator?.full_name || 'Creator'}
          </Text>
        </View>

        <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />

        <View style={styles.serviceFooter}>
          <View style={styles.categoryBadge}>
            <Ionicons name={categoryInfo.icon as any} size={14} color={theme.tint} />
            <Text style={[styles.categoryText, { color: theme.text }]} numberOfLines={1}>
              {categoryInfo.label}
            </Text>
          </View>
          
          <Text style={[styles.servicePrice, { color: theme.tint }]}>
            {service.price !== 'Negotiable' ? `₱${service.price}` : 'Negotiable'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  serviceCard: { 
    width: 260, 
    height: 280, 
    borderRadius: 16, 
    marginRight: 16, 
    overflow: 'hidden',
    ...Shadows.md,
  },
  serviceImageContainer: {
    height: 130,
    width: '100%',
    position: 'relative',
  },
  serviceImage: { width: '100%', height: '100%' },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 244,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryChipText: { color: '#fff', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', flexShrink: 1 },
  serviceContent: { padding: 12 },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  creatorAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: '#ccc',
  },
  creatorNameSmall: { fontSize: 12, fontWeight: '500' },
  separator: { height: 1, width: '100%', marginBottom: 8, opacity: 0.5 },
  serviceFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center'
  },
  servicePrice: { fontSize: 14, fontWeight: '700' },
  categoryBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardPressed: { 
    opacity: 0.8 
  },
});
