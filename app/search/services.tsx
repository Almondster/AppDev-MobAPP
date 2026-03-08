import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Shadows } from '@/constants/theme';

// Categories and Subcategories
const CATEGORIES = [
  'Design & Creative',
  'Development & IT',
  'Writing & Translation',
  'Digital Marketing',
  'Video & Animation',
  'Music & Audio'
];

const SUBCATEGORY_MAP: Record<string, string[]> = {
  'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
  'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
  'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Proofreading', 'Scriptwriting'],
  'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
  'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
  'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

// Helper function to find parent category for a subcategory
const getCategoryForSubcategory = (subcategory: string): string | null => {
  for (const [category, subcategories] of Object.entries(SUBCATEGORY_MAP)) {
    if (subcategories.includes(subcategory)) {
      return category;
    }
  }
  return null;
};

// --- SKELETON LOADER COMPONENT ---
const SkeletonServiceCard = () => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
      {/* Image Skeleton */}
      <Animated.View style={{ height: 180, width: '100%', backgroundColor: theme.cardBorder, opacity }} />

      <View style={styles.cardContent}>
        {/* Category Label Skeleton */}
        <Animated.View style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: theme.cardBorder, marginBottom: 6, opacity }} />
        {/* Title Skeleton */}
        <Animated.View style={{ width: '90%', height: 20, borderRadius: 4, backgroundColor: theme.cardBorder, marginBottom: 12, opacity }} />

        {/* Creator Row Skeleton */}
        <View style={styles.creatorRow}>
          <Animated.View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.cardBorder, marginRight: 8, opacity }} />
          <Animated.View style={{ width: 100, height: 14, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
        </View>
      </View>
    </View>
  );
};

export default function AllServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const subcategory = params.subcategory as string | undefined;
  const { theme, isDark } = useTheme();
  const user = auth.currentUser;
  const { trackServiceClick } = useAnalytics();

  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // --- FILTER STATES ---
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // --- MODAL & ACTION STATES ---
  const [selectedService, setSelectedService] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // --- ALERT STATES ---
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorAlertMessage, setErrorAlertMessage] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successAlertMessage, setSuccessAlertMessage] = useState('');
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [showOwnServiceAlert, setShowOwnServiceAlert] = useState(false);

  // Auto-apply subcategory filter if coming from subcategory screen
  useEffect(() => {
    if (subcategory && services.length > 0) {
      setSelectedSubcategories([subcategory]);
      // Also select the parent category so the subcategory chips are visible in filter modal
      const parentCategory = getCategoryForSubcategory(subcategory);
      if (parentCategory) {
        setSelectedCategories([parentCategory]);
      }
    } else if (!subcategory && services.length > 0 && loading) {
      // If no subcategory param and data is loaded, we can stop loading
      setLoading(false);
    }
  }, [subcategory, services, loading]);

  // Apply filters when subcategory selection changes (only if from URL param)
  useEffect(() => {
    if (subcategory && selectedSubcategories.length > 0 && services.length > 0) {
      applyFilters();
      // Now that filters are applied, stop loading
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubcategories, subcategory]);

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          creator:users!services_creator_id_fkey (
            full_name,
            avatar_url,
            role,
            firebase_uid
          )
        `)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .or('is_public.is.null,is_public.eq.true')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch ratings for each creator
      const servicesWithRatings = await Promise.all(
        (data || []).map(async (service) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('reviewee_id', service.creator_id);

          const avgRating = reviews && reviews.length > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            : 0;

          return { ...service, creator_rating: avgRating };
        })
      );

      setServices(servicesWithRatings || []);
      setFilteredServices(servicesWithRatings || []);
    } catch (err) {
      console.error(err);
      setLoading(false); // Stop loading on error
    } finally {
      // Only stop loading here if there's no subcategory to filter
      // Otherwise, loading will stop after filters are applied
      if (!subcategory) {
        setLoading(false);
      }
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(text);
  };

  const applyFilters = (searchText: string = searchQuery) => {
    let filtered = [...services];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(searchText.toLowerCase()) ||
          s.label.toLowerCase().includes(searchText.toLowerCase()) ||
          s.creator?.full_name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(s => {
        // Find which category this service's label belongs to
        for (const category of selectedCategories) {
          if (SUBCATEGORY_MAP[category]?.includes(s.label)) {
            return true;
          }
        }
        return false;
      });
    }

    // Subcategory filter
    if (selectedSubcategories.length > 0) {
      filtered = filtered.filter(s => selectedSubcategories.includes(s.label));
    }

    // Price filter
    if (minPrice || maxPrice) {
      filtered = filtered.filter(s => {
        const price = parseFloat(s.price);
        if (isNaN(price)) return true; // Include "Negotiable" prices
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(s => (s.creator_rating || 0) >= minRating);
    }

    setFilteredServices(filtered);

    // Update active filters count
    let count = 0;
    if (selectedCategories.length > 0) count++;
    if (selectedSubcategories.length > 0) count++;
    if (minPrice || maxPrice) count++;
    if (minRating > 0) count++;
    setActiveFiltersCount(count);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setFilteredServices(services);
    setActiveFiltersCount(0);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleSubcategory = (subcategory: string) => {
    setSelectedSubcategories(prev =>
      prev.includes(subcategory)
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    );
  };

  // --- BOOKING LOGIC ---
  const handleBookService = async () => {
    if (!user) { setShowLoginAlert(true); return; }

    // Check if booking own service
    if (selectedService.creator_id === user.uid) {
      setShowOwnServiceAlert(true);
      return;
    }

    if (!selectedService) return;

    setBookingLoading(true);
    try {
      // Check for duplicates
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('client_id', user.uid)
        .eq('creator_id', selectedService.creator_id)
        .eq('service_title', selectedService.title)
        .in('status', ['pending', 'accepted', 'in_progress', 'delivered', 'active']);

      if (existingOrders && existingOrders.length > 0) {
        setShowDuplicateAlert(true);
        return;
      }

      const { data: clientData } = await supabase
        .from('users')
        .select('full_name')
        .eq('firebase_uid', user.uid)
        .single();

      const { error } = await supabase.from('orders').insert({
        client_id: user.uid,
        creator_id: selectedService.creator_id,
        service_title: selectedService.title,
        price: selectedService.price,
        status: 'pending',
        client_name: clientData?.full_name || 'Client',
        // NOTE: In services.tsx, creator info is inside selectedService.creator object
        creator_name: selectedService.creator?.full_name || 'Creator',
        image_url: selectedService.image_url,
        last_updated_by: user.uid,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      setSuccessAlertMessage(`Request sent successfully.`);
      setShowSuccessAlert(true);
      setSelectedService(null);

    } catch (err: any) {
      setErrorAlertMessage(err.message);
      setShowErrorAlert(true);
    } finally {
      setBookingLoading(false);
    }
  };

  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    input: { backgroundColor: theme.inputBackground, color: theme.text },
    placeholder: { backgroundColor: isDark ? '#222' : '#f1f5f9' },
    modalBg: { backgroundColor: theme.card },
    badge: { backgroundColor: theme.tint + '15' },
  };

  // --- MODERN ALERT COMPONENT ---
  const ModernAlertModal = ({ visible, onClose, title, message, type = 'info', showConfirm = false, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }: any) => {
    const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : theme.tint;
    const icon = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'close-circle' : type === 'warning' ? 'warning' : 'information-circle';

    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.modernAlertBackdrop}>
          <View style={[styles.modernAlertCard, themeStyles.modalBg]}>
            <View style={[styles.alertIconContainer, { backgroundColor: color + '15' }]}>
              <Ionicons name={icon} size={32} color={color} />
            </View>
            <Text style={[styles.modernAlertTitle, themeStyles.text]}>{title}</Text>
            <Text style={[styles.modernAlertMessage, themeStyles.textSecondary]}>{message}</Text>
            <View style={styles.modernAlertButtons}>
              {showConfirm ? (
                <>
                  <Pressable onPress={onClose} style={[styles.modernAlertBtn, styles.modernAlertBtnSecondary, { borderColor: theme.cardBorder }]}>
                    <Text style={[styles.modernAlertBtnText, themeStyles.text]}>{cancelText}</Text>
                  </Pressable>
                  <Pressable onPress={onConfirm} style={[styles.modernAlertBtn, { backgroundColor: color }]}>
                    <Text style={[styles.modernAlertBtnText, { color: '#fff' }]}>{confirmText}</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={onClose} style={[styles.modernAlertBtn, { backgroundColor: color, flex: 1 }]}>
                  <Text style={[styles.modernAlertBtnText, { color: '#fff' }]}>OK</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.card, themeStyles.card]}
      onPress={() => {
        trackServiceClick(item.creator_id);
        setSelectedService(item);
      }}
    >
      {/* Service Image */}
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, themeStyles.placeholder]}>
            <Ionicons name="briefcase-outline" size={32} color={theme.textSecondary} />
          </View>
        )}
        <View style={[styles.priceTag, { backgroundColor: theme.tint }]}>
          <Text style={styles.priceText}>
            {item.price && item.price !== 'Negotiable' ? `₱${item.price}` : 'Negotiable'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.categoryLabel, { color: theme.tint }]}>{item.label}</Text>
        <Text style={[styles.title, themeStyles.text]} numberOfLines={2}>{item.title}</Text>

        <View style={styles.creatorRow}>
          <Image
            source={{ uri: item.creator?.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <Text style={[styles.creatorName, themeStyles.textSecondary]} numberOfLines={1}>
            {item.creator?.full_name || 'Unknown Creator'}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, themeStyles.text]}>Explore Services</Text>
        <Pressable onPress={() => setFilterModalVisible(true)} style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color={theme.text} />
          {activeFiltersCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.tint }]}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, themeStyles.input]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        // SKELETON LOADER STATE
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonServiceCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, themeStyles.textSecondary]}>No services found.</Text>
            </View>
          }
        />
      )}

      {/* SERVICE DETAIL MODAL */}
      <Modal visible={!!selectedService} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedService(null)}>
        <View style={[styles.fullScreenModalContainer, themeStyles.container]}>
          {/* Header */}
          <View style={[styles.serviceModalHeader, { backgroundColor: theme.card }]}>
            <Pressable
              onPress={() => setSelectedService(null)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <Text style={[styles.serviceModalHeaderTitle, themeStyles.text]}>Service Details</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedService && (
            <ScrollView
              style={styles.fullScreenScrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Service Image */}
              <View style={styles.serviceImageFullContainer}>
                {selectedService.image_url ? (
                  <Image
                    source={{ uri: selectedService.image_url }}
                    style={styles.serviceImageFull}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.serviceImageFullPlaceholder, themeStyles.placeholder]}>
                    <Ionicons name="briefcase-outline" size={64} color={theme.textSecondary} />
                    <Text style={[styles.placeholderText, themeStyles.textSecondary]}>No Image</Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.serviceContentContainer}>
                {/* Creator Info (Clickable to go to profile) */}
                <Pressable
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                  onPress={() => {
                    setSelectedService(null);
                    router.push(`/creator/${selectedService.creator_id}`);
                  }}
                >
                  <Image source={{ uri: selectedService.creator?.avatar_url || 'https://via.placeholder.com/40' }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                  <View>
                    <Text style={[themeStyles.text, { fontWeight: '700' }]}>{selectedService.creator?.full_name}</Text>
                    <Text style={[themeStyles.textSecondary, { fontSize: 12 }]}>View Profile</Text>
                  </View>
                </Pressable>

                {/* Category Badge */}
                <View style={[styles.catBadge, themeStyles.badge]}>
                  <Text style={[styles.catBadgeText, { color: theme.tint }]}>{selectedService.label}</Text>
                </View>

                {/* Service Title */}
                <Text style={[styles.serviceTitleFull, themeStyles.text]}>{selectedService.title}</Text>

                {/* Price */}
                <Text style={[styles.servicePriceFull, { color: theme.tint }]}>
                  {selectedService.price && selectedService.price !== 'Negotiable' ? `₱${selectedService.price}` : 'Price Negotiable'}
                </Text>

                <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />

                {/* Description */}
                <Text style={[styles.sectionTitle, themeStyles.text]}>Description</Text>
                <Text style={[styles.serviceDescriptionFull, themeStyles.textSecondary]}>
                  {selectedService.description || "No description provided for this service."}
                </Text>

                <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />

                {/* Service Details */}
                <Text style={[styles.sectionTitle, themeStyles.text]}>Service Details</Text>

                <View style={styles.detailsGridFull}>
                  <View style={styles.detailItemFull}>
                    <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                    <View>
                      <Text style={[styles.detailLabel, themeStyles.textSecondary]}>Listed Date</Text>
                      <Text style={[styles.detailValue, themeStyles.text]}>
                        {new Date(selectedService.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItemFull}>
                    <Ionicons name="pricetag-outline" size={20} color={theme.textSecondary} />
                    <View>
                      <Text style={[styles.detailLabel, themeStyles.textSecondary]}>Pricing</Text>
                      <Text style={[styles.detailValue, themeStyles.text]}>
                        {selectedService.price && selectedService.price !== 'Negotiable' ? 'Fixed Price' : 'Negotiable'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItemFull}>
                    <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                    <View>
                      <Text style={[styles.detailLabel, themeStyles.textSecondary]}>Service Type</Text>
                      <Text style={[styles.detailValue, themeStyles.text]}>
                        {selectedService.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Floating Action Button */}
          {selectedService && (
            <View style={[styles.floatingActionContainer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
              <Pressable
                style={[styles.requestButton, { backgroundColor: theme.tint }]}
                onPress={handleBookService}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={20} color="#fff" />
                    <Text style={styles.requestButtonText}>Request Service</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* ALERTS */}
      <ModernAlertModal visible={showLoginAlert} onClose={() => setShowLoginAlert(false)} title="Login Required" message="Please log in to book." />
      <ModernAlertModal visible={showErrorAlert} onClose={() => setShowErrorAlert(false)} title="Error" message={errorAlertMessage} type="error" />
      <ModernAlertModal visible={showSuccessAlert} onClose={() => setShowSuccessAlert(false)} title="Success" message={successAlertMessage} type="success" />
      <ModernAlertModal visible={showDuplicateAlert} onClose={() => setShowDuplicateAlert(false)} title="Request Exists" message="You already have a pending request for this service." type="warning" />
      <ModernAlertModal visible={showOwnServiceAlert} onClose={() => setShowOwnServiceAlert(false)} title="Action Not Allowed" message="You cannot request your own service." type="warning" />

      {/* FILTER MODAL */}
      <Modal visible={filterModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFilterModalVisible(false)}>
        <SafeAreaView style={[styles.filterModalContainer, themeStyles.container]}>
          {/* Header with Gradient Effect */}
          <View style={[styles.filterModalHeader, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
            <Pressable onPress={() => setFilterModalVisible(false)} style={styles.closeButton}>
              <View style={[styles.closeButtonCircle, { backgroundColor: theme.cardBorder }]}>
                <Ionicons name="close" size={20} color={theme.text} />
              </View>
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.filterModalTitle, themeStyles.text]}>Filters</Text>
            </View>
            <Pressable onPress={clearFilters} style={styles.clearButton}>
              <Text style={[styles.clearText, { color: theme.tint }]}>Clear</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
            {/* Categories Section */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="grid-outline" size={20} color={theme.tint} />
                <Text style={[styles.filterSectionTitle, themeStyles.text]}>Main Categories</Text>
              </View>
              <Text style={[styles.sectionSubtitle, themeStyles.textSecondary]}>
                Select one or more categories
              </Text>
              <View style={styles.chipContainer}>
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => toggleCategory(category)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      selectedCategories.includes(category) && [styles.filterChipSelected, { backgroundColor: theme.tint }],
                      !selectedCategories.includes(category) && { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      pressed && styles.filterChipPressed,
                    ]}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedCategories.includes(category) ? '#fff' : theme.text }
                    ]}>
                      {category}
                    </Text>
                    {selectedCategories.includes(category) && (
                      <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Subcategories Section with Animation */}
            {selectedCategories.length > 0 && (
              <View style={styles.filterSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pricetags-outline" size={20} color={theme.tint} />
                  <Text style={[styles.filterSectionTitle, themeStyles.text]}>Service Types</Text>
                </View>
                <Text style={[styles.sectionSubtitle, themeStyles.textSecondary]}>
                  Refine by specific service types
                </Text>
                <View style={styles.chipContainer}>
                  {selectedCategories.map(category =>
                    SUBCATEGORY_MAP[category]?.map((subcategory) => (
                      <Pressable
                        key={subcategory}
                        onPress={() => toggleSubcategory(subcategory)}
                        style={({ pressed }) => [
                          styles.filterChip,
                          selectedSubcategories.includes(subcategory) && [styles.filterChipSelected, { backgroundColor: theme.tint }],
                          !selectedSubcategories.includes(subcategory) && { backgroundColor: theme.card, borderColor: theme.cardBorder },
                          pressed && styles.filterChipPressed,
                        ]}
                      >
                        <Text style={[
                          styles.filterChipText,
                          { color: selectedSubcategories.includes(subcategory) ? '#fff' : theme.text }
                        ]}>
                          {subcategory}
                        </Text>
                        {selectedSubcategories.includes(subcategory) && (
                          <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
                        )}
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* Price Range Section with Modern Input Design */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cash-outline" size={20} color={theme.tint} />
                <Text style={[styles.filterSectionTitle, themeStyles.text]}>Price Range</Text>
              </View>
              <Text style={[styles.sectionSubtitle, themeStyles.textSecondary]}>
                Set your budget range in Philippine Peso (₱)
              </Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceInputWrapper}>
                  <View style={[styles.priceInputContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.priceCurrency, { color: theme.tint }]}>₱</Text>
                    <TextInput
                      style={[styles.priceInput, { color: theme.text }]}
                      placeholder="Min"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={minPrice}
                      onChangeText={setMinPrice}
                    />
                  </View>
                  {minPrice ? (
                    <Text style={[styles.priceHint, themeStyles.textSecondary]}>
                      From ₱{parseInt(minPrice).toLocaleString()}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.priceSeparatorContainer}>
                  <View style={[styles.priceSeparatorLine, { backgroundColor: theme.cardBorder }]} />
                  <Ionicons name="arrow-forward" size={16} color={theme.textSecondary} />
                  <View style={[styles.priceSeparatorLine, { backgroundColor: theme.cardBorder }]} />
                </View>

                <View style={styles.priceInputWrapper}>
                  <View style={[styles.priceInputContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.priceCurrency, { color: theme.tint }]}>₱</Text>
                    <TextInput
                      style={[styles.priceInput, { color: theme.text }]}
                      placeholder="Max"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                    />
                  </View>
                  {maxPrice ? (
                    <Text style={[styles.priceHint, themeStyles.textSecondary]}>
                      Up to ₱{parseInt(maxPrice).toLocaleString()}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Star Rating Section with Modern Cards */}
            <View style={[styles.filterSection, { borderBottomWidth: 0, paddingBottom: 30 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={20} color={theme.tint} />
                <Text style={[styles.filterSectionTitle, themeStyles.text]}>Creator Rating</Text>
              </View>
              <Text style={[styles.sectionSubtitle, themeStyles.textSecondary]}>
                Filter by minimum creator rating
              </Text>
              <View style={styles.ratingContainer}>
                {[0, 1, 2, 3, 4, 5].map((rating) => (
                  <Pressable
                    key={rating}
                    onPress={() => setMinRating(rating)}
                    style={({ pressed }) => [
                      styles.ratingButton,
                      minRating === rating && [styles.ratingButtonSelected, { backgroundColor: theme.tint }],
                      minRating !== rating && { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      pressed && styles.ratingButtonPressed,
                    ]}
                  >
                    <View style={styles.ratingStars}>
                      {rating === 0 ? (
                        <Ionicons name="star-outline" size={18} color={theme.textSecondary} />
                      ) : (
                        [...Array(rating)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name="star"
                            size={14}
                            color={minRating === rating ? '#fff' : '#fbbf24'}
                          />
                        ))
                      )}
                    </View>
                    <Text style={[
                      styles.ratingText,
                      { color: minRating === rating ? '#fff' : theme.text }
                    ]}>
                      {rating === 0 ? 'Any Rating' : `${rating}+ Stars`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Modern Apply Button with Shadow */}
          <View style={[styles.filterFooter, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                { backgroundColor: theme.tint },
                pressed && styles.applyButtonPressed,
              ]}
              onPress={() => {
                applyFilters();
                setFilterModalVisible(false);
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              <Text style={styles.applyButtonText}>
                {activeFiltersCount > 0 ? `Apply ${activeFiltersCount} Filter${activeFiltersCount > 1 ? 's' : ''}` : 'Apply Filters'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700' },

  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  imageContainer: { height: 180, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },

  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  cardContent: { padding: 16 },
  categoryLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, lineHeight: 24 },

  creatorRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: '#ccc' },
  creatorName: { fontSize: 14, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16 },
  fullScreenModalContainer: { flex: 1 },
  serviceModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  serviceModalHeaderTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  fullScreenScrollView: { flex: 1 },
  serviceImageFullContainer: { height: 250, width: '100%' },
  serviceImageFull: { width: '100%', height: '100%' },
  serviceImageFullPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 16, marginTop: 8 },

  serviceContentContainer: { padding: 24 },
  serviceTitleFull: { fontSize: 28, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  servicePriceFull: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  separator: { height: 1, width: '100%', marginBottom: 16, opacity: 0.5 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  serviceDescriptionFull: { fontSize: 16, lineHeight: 24, marginBottom: 20 },

  detailsGridFull: { gap: 16 },
  detailItemFull: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailLabel: { fontSize: 14, marginBottom: 2 },
  detailValue: { fontSize: 16, fontWeight: '600' },

  floatingActionContainer: { padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  requestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  requestButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '700'
  },
  modernAlertBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modernAlertCard: { width: '100%', borderRadius: 26, padding: 30, alignItems: 'center', ...Shadows.xl },
  alertIconContainer: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modernAlertTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  modernAlertMessage: { fontSize: 16, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  modernAlertButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modernAlertBtn: { flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modernAlertBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1 },
  modernAlertBtnText: { fontSize: 16, fontWeight: '700' },

  // Filter Modal Styles - Modern & Aesthetic Design
  filterButton: { padding: 4, position: 'relative' },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xl,
  },
  filterBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  filterModalContainer: { flex: 1 },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    ...Shadows.md,
  },
  closeButton: { width: 40 },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  filterModalTitle: { fontSize: 22, fontWeight: '700' },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearText: { fontSize: 15, fontWeight: '700' },
  filterContent: { flex: 1 },
  filterScrollContent: { paddingBottom: 20 },
  filterSection: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  filterSectionTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 18,
    lineHeight: 20,
    opacity: 0.8,
  },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
  },
  filterChipSelected: {
    borderWidth: 0,
    ...Shadows.md,
  },
  filterChipPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  filterChipText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  priceInputWrapper: { flex: 1 },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    ...Shadows.sm,
  },
  priceCurrency: { fontSize: 18, fontWeight: '700', marginRight: 8 },
  priceInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    padding: 0,
  },
  priceHint: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  priceSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  priceSeparatorLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  ratingContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  ratingButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
    gap: 8,
    minWidth: 100,
    ...Shadows.sm,
  },
  ratingButtonSelected: {
    borderWidth: 0,
    ...Shadows.md,
  },
  ratingButtonPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  filterFooter: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    ...Shadows.sm,
    shadowOffset: { width: 0, height: -2 },
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    ...Shadows.xl,
  },
  applyButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.15,
  },
  applyButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});
