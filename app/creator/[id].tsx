import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
import { useAnalytics } from '../../hooks/useAnalytics';
import { Shadows } from '@/constants/theme';

const { height: _SCREEN_HEIGHT } = Dimensions.get('window');

// --- SKELETON COMPONENT ---
const SkeletonItem = ({ style, isDark }: { style: any, isDark: boolean }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { opacity, backgroundColor: isDark ? '#333' : '#E1E9EE' },
        style
      ]}
    />
  );
};

export default function CreatorProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const creatorId = Array.isArray(id) ? id[0] : id;
  const { theme, isDark } = useTheme();
  const user = auth.currentUser;

  // ANALYTICS HOOK
  const { trackProfileView, trackServiceClick } = useAnalytics();

  // --- DATA STATE ---
  const [creator, setCreator] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);

  // --- INTERACTIVE STATE ---
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'about' | 'reviews'>('services');

  // --- MODAL STATES ---
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Service Detail & Booking State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // --- MODERN ALERT MODALS ---
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorAlertMessage, setErrorAlertMessage] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successAlertMessage, setSuccessAlertMessage] = useState('');
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [showFollowError, setShowFollowError] = useState(false);

  // Booking Specific Alerts
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [showOwnServiceAlert, setShowOwnServiceAlert] = useState(false);

  const isOwnProfile = user?.uid === creatorId;

  // --- ANALYTICS TRACKING ---
  useEffect(() => {
    if (creatorId) {
      trackProfileView(creatorId);
    }
  }, [creatorId, trackProfileView]);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!creatorId) return;
    try {
      // 1. User Basic Info
      const { data: userData } = await supabase.from('users').select('*').eq('firebase_uid', creatorId).single();
      setCreator(userData);

      // 2. Creator Details
      const { data: detailData } = await supabase.from('creators').select('*').eq('user_id', creatorId).maybeSingle();
      setDetails(detailData);

      // 3. Services (only public services visible to others)
      const { data: serviceData } = await supabase
        .from('services')
        .select('*')
        .eq('creator_id', creatorId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .or('is_public.is.null,is_public.eq.true');
      setServices(serviceData || []);

      // 4. Reviews
      const { data: reviewData } = await supabase
        .from('reviews')
        .select(`*, reviewer:users!reviews_reviewer_id_fkey(full_name, avatar_url)`)
        .eq('reviewee_id', creatorId)
        .order('created_at', { ascending: false });

      setReviews(reviewData || []);

      // 5. Check Relationships
      if (user && !isOwnProfile) {
        const { data: followData } = await supabase.from('follows').select('*').eq('follower_id', user.uid).eq('following_id', creatorId).single();
        setIsFollowing(!!followData);

        const { data: blockData } = await supabase.from('blocks').select('*').eq('blocker_id', user.uid).eq('blocked_id', creatorId).single();
        setIsBlocked(!!blockData);
      }

      // 6. Followers Count
      const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', creatorId);
      setFollowersCount(count || 0);

    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [creatorId, user, isOwnProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ACTIONS ---
  const handleFollow = async () => {
    if (!user) { setShowLoginAlert(true); return; }
    if (isOwnProfile) return;

    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.uid).eq('following_id', creatorId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('follows').insert({ follower_id: user.uid, following_id: creatorId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (_error) {
      setErrorAlertMessage("Failed to update follow status.");
      setShowFollowError(true);
    }
  };

  const handleUnblock = async () => setShowUnblockModal(true);

  const confirmUnblock = async () => {
    if (!user) return;
    try {
      await supabase.from('blocks').delete().eq('blocker_id', user.uid).eq('blocked_id', creatorId);
      setIsBlocked(false);
      setShowUnblockModal(false);
      setSuccessAlertMessage("User unblocked successfully!");
      setShowSuccessAlert(true);
    } catch (e: any) {
      setErrorAlertMessage(e.message);
      setShowErrorAlert(true);
    }
  };

  const confirmBlock = async () => {
    if (!user) return;
    try {
      await supabase.from('blocks').insert({ blocker_id: user.uid, blocked_id: creatorId });
      setIsBlocked(true);
      setShowBlockModal(false);
      setSuccessAlertMessage("User blocked successfully.");
      setShowSuccessAlert(true);
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.uid).eq('following_id', creatorId);
        setIsFollowing(false);
      }
    } catch (e: any) {
      setErrorAlertMessage(e.message);
      setShowErrorAlert(true);
    }
  };

  // --- BOOKING LOGIC ---
  const handleBookService = async () => {
    if (!user) { setShowLoginAlert(true); return; }
    if (isBlocked) {
      setErrorAlertMessage("You cannot request services from a blocked creator.");
      setShowErrorAlert(true);
      return;
    }
    if (isOwnProfile) { setShowOwnServiceAlert(true); return; }
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
        service_id: selectedService.id,
        client_id: user.uid,
        creator_id: selectedService.creator_id,
        service_title: selectedService.title,
        price: selectedService.price,
        status: 'pending',
        client_name: clientData?.full_name || 'Client',
        creator_name: creator?.full_name || 'Creator', // Use current creator profile data
        image_url: selectedService.image_url,
        last_updated_by: user.uid,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      setSuccessAlertMessage(`Request sent to ${creator?.full_name || 'the creator'}.`);
      setShowSuccessAlert(true);
      setSelectedService(null);

    } catch (err: any) {
      setErrorAlertMessage(err.message);
      setShowErrorAlert(true);
    } finally {
      setBookingLoading(false);
    }
  };

  const _handleGoToOrders = () => {
    setShowSuccessAlert(false);
    setShowDuplicateAlert(false);
    router.push('/order');
  };

  const handleSubmitReport = async () => {
    if (!user) return;
    if (!reportReason.trim()) { setErrorAlertMessage("Please specify a reason."); setShowErrorAlert(true); return; }

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.uid,
      reported_id: creatorId,
      reason: reportReason
    });

    if (error) {
      setErrorAlertMessage(error.message);
      setShowErrorAlert(true);
    } else {
      setSuccessAlertMessage("We have received your report and will investigate.");
      setShowSuccessAlert(true);
      setShowReportModal(false);
      setReportReason('');
    }
  };

  const handleMessage = () => {
    if (selectedService) setSelectedService(null);
    if (creatorId) router.push(`/chat/${creatorId}`);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'New';

  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      ...Shadows.lg,
    },
    placeholder: { backgroundColor: isDark ? '#222' : '#f8fafc' },
    modalBg: { backgroundColor: theme.card },
    input: { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder },
    badge: { backgroundColor: theme.tint + '15' },
  };

  if (loading) {
    return (
      <View style={[styles.container, themeStyles.container]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        {/* Header Skeleton */}
        <View style={styles.header}>
          <SkeletonItem isDark={isDark} style={{ width: 44, height: 44, borderRadius: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            {/* Avatar Skeleton with border */}
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: theme.background,
              padding: 5,
              marginBottom: 16,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SkeletonItem isDark={isDark} style={{ width: 110, height: 110, borderRadius: 55 }} />
            </View>

            {/* Name Skeleton */}
            <SkeletonItem isDark={isDark} style={{ width: 200, height: 28, borderRadius: 6, marginBottom: 8 }} />

            {/* Role Skeleton */}
            <SkeletonItem isDark={isDark} style={{ width: 100, height: 16, borderRadius: 4, marginBottom: 24 }} />

            {/* Stats Container Skeleton */}
            <View style={[styles.statsContainer, { backgroundColor: 'transparent', paddingVertical: 20, marginBottom: 20 }]}>
              {[1, 2, 3, 4].map((i, index) => (
                <React.Fragment key={i}>
                  <View style={styles.statItem}>
                    <SkeletonItem isDark={isDark} style={{ width: 40, height: 24, marginBottom: 8, borderRadius: 4 }} />
                    <SkeletonItem isDark={isDark} style={{ width: 60, height: 14, borderRadius: 4 }} />
                  </View>
                  {index < 3 && <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />}
                </React.Fragment>
              ))}
            </View>

            {/* Action Buttons Skeleton */}
            <View style={[styles.actionRow, { gap: 12 }]}>
              <SkeletonItem isDark={isDark} style={{ flex: 1, height: 48, borderRadius: 16 }} />
              <SkeletonItem isDark={isDark} style={{ flex: 1, height: 48, borderRadius: 16 }} />
            </View>
          </View>

          {/* Tabs Skeleton */}
          <View style={[styles.tabBar, { borderBottomColor: theme.cardBorder, paddingHorizontal: 24, marginTop: 10 }]}>
            <View style={{ flexDirection: 'row', gap: 32 }}>
              <SkeletonItem isDark={isDark} style={{ width: 80, height: 20, borderRadius: 4, marginBottom: 20 }} />
              <SkeletonItem isDark={isDark} style={{ width: 80, height: 20, borderRadius: 4, marginBottom: 20 }} />
            </View>
          </View>

          {/* Content List Skeleton */}
          <View style={[styles.tabContent, { paddingHorizontal: 24, paddingTop: 20 }]}>
            {[1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    flexDirection: 'row',
                    ...Shadows.md,
                  }
                ]}
              >
                <SkeletonItem isDark={isDark} style={{ width: 70, height: 70, borderRadius: 12, marginRight: 16 }} />
                <View style={{ flex: 1, gap: 10, justifyContent: 'center' }}>
                  <SkeletonItem isDark={isDark} style={{ width: '80%', height: 18, borderRadius: 4 }} />
                  <SkeletonItem isDark={isDark} style={{ width: '50%', height: 14, borderRadius: 4 }} />
                  <SkeletonItem isDark={isDark} style={{ width: '30%', height: 14, borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

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

  // --- BLOCKED VIEW ---
  const BlockedView = () => (
    <View style={[styles.blockedContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.blockedCard, { backgroundColor: theme.card }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.textSecondary + '10' }]}>
          <Ionicons name="ban" size={48} color={theme.textSecondary} />
        </View>
        <Text style={[styles.blockedTitle, themeStyles.text]}>Creator Blocked</Text>
        <Text style={[styles.blockedDesc, themeStyles.textSecondary]}>
          You have blocked this user. Unblock them to view their profile and services.
        </Text>
        <Pressable style={[styles.unblockBtnLarge, { borderColor: theme.cardBorder }]} onPress={handleUnblock}>
          <Text style={[styles.unblockTextLarge, themeStyles.text]}>Unblock Creator</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: theme.card }]}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        {!isBlocked && !isOwnProfile && (
          <Pressable onPress={() => setShowOptionsModal(true)} style={[styles.iconButton, { backgroundColor: theme.card }]}>
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
          </Pressable>
        )}
      </View>

      {isBlocked ? (
        <BlockedView />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >

          {/* --- PROFILE HEADER --- */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { borderColor: theme.background }]}>
              {creator?.avatar_url ? (
                <Image source={{ uri: creator.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{creator?.full_name?.charAt(0)}</Text>
              )}
            </View>

            <Text style={[styles.name, themeStyles.text]}>{creator?.full_name}</Text>
            <Text style={[styles.role, { color: theme.tint }]}>{creator?.role?.toUpperCase() || 'CREATOR'}</Text>

            {!isBlocked && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statText, themeStyles.text]}>{avgRating}</Text>
                  <Text style={[styles.statLabel, themeStyles.textSecondary]}>Rating</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statText, themeStyles.text]}>{followersCount}</Text>
                  <Text style={[styles.statLabel, themeStyles.textSecondary]}>Followers</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statText, themeStyles.text]}>{services.length}</Text>
                  <Text style={[styles.statLabel, themeStyles.textSecondary]}>Services</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statText, themeStyles.text]}>{reviews.length}</Text>
                  <Text style={[styles.statLabel, themeStyles.textSecondary]}>Reviews</Text>
                </View>
              </View>
            )}

            {!isBlocked && !isOwnProfile && (
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: isFollowing ? theme.inputBackground : theme.tint }]}
                  onPress={handleFollow}
                >
                  <Text style={[styles.actionBtnText, { color: isFollowing ? theme.text : '#fff' }]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.messageBtn, { borderColor: theme.cardBorder }]}
                  onPress={handleMessage}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
                  <Text style={[styles.messageBtnText, themeStyles.text]}>Message</Text>
                </Pressable>
              </View>
            )}
          </View>
          <View style={[styles.tabBar, { borderBottomColor: theme.cardBorder }]}>
            {['services', 'about', 'reviews'].map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.tint }]}
                onPress={() => setActiveTab(tab as any)}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === tab ? theme.tint : theme.textSecondary }
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* CONTENT: SERVICES */}
          {activeTab === 'services' && (
            <View style={styles.tabContent}>
              {services.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="briefcase-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                  <Text style={[styles.emptyText, themeStyles.textSecondary]}>No services listed yet.</Text>
                </View>
              ) : (
                services.map(service => (
                  <Pressable
                    key={service.id}
                    style={[styles.serviceCard, themeStyles.card]}
                    onPress={() => {
                      trackServiceClick(creatorId);
                      setSelectedService(service);
                    }}
                  >
                    {service.image_url ? (
                      <Image source={{ uri: service.image_url }} style={styles.serviceImageThumbnail} resizeMode="cover" />
                    ) : (
                      <View style={[styles.serviceIconPlaceholder, themeStyles.placeholder]}>
                        <Ionicons name="briefcase-outline" size={24} color={theme.textSecondary} />
                      </View>
                    )}
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceLabel, themeStyles.text]} numberOfLines={1}>{service.title || service.label}</Text>
                      <Text style={[styles.serviceCategory, themeStyles.textSecondary]}>{service.label}</Text>
                      <Text style={[styles.servicePrice, { color: theme.tint }]}>
                        {service.price && service.price !== 'Negotiable' ? `₱${service.price}` : 'Negotiable'}
                      </Text>
                    </View>
                    <View style={[styles.arrowBtn, { backgroundColor: theme.inputBackground }]}>
                      <Ionicons name="arrow-forward" size={16} color={theme.text} />
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* CONTENT: ABOUT */}
          {activeTab === 'about' && (
            <View style={styles.tabContent}>
              <View style={[styles.aboutCard, themeStyles.card]}>
                <Text style={[styles.sectionHeader, themeStyles.text]}>About Me</Text>
                <Text style={[styles.bioText, themeStyles.textSecondary]}>
                  {details?.bio || "This creator hasn't added a bio yet."}
                </Text>

                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, themeStyles.textSecondary]}>Experience</Text>
                    <Text style={[styles.metaValue, themeStyles.text]}>{details?.experience_years ? `${details.experience_years} Years` : 'N/A'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, themeStyles.textSecondary]}>Avg. Turnaround</Text>
                    <Text style={[styles.metaValue, themeStyles.text]}>{details?.turnaround_time || 'N/A'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaLabel, themeStyles.textSecondary]}>Starting Price</Text>
                    <Text style={[styles.metaValue, themeStyles.text]}>{details?.starting_price ? `₱${details.starting_price}` : 'N/A'}</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionHeader, themeStyles.text, { marginTop: 24, marginBottom: 12, paddingHorizontal: 4 }]}>Skills</Text>
              <View style={styles.skillsRow}>
                {details?.skills && details.skills.length > 0 ? (
                  details.skills.map((skill: string, index: number) => (
                    <View key={index} style={[styles.skillChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      <Text style={[styles.skillText, themeStyles.text]}>{skill}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[themeStyles.textSecondary, { fontStyle: 'italic', paddingHorizontal: 4 }]}>No skills listed.</Text>
                )}
              </View>
            </View>
          )}

          {/* CONTENT: REVIEWS */}
          {activeTab === 'reviews' && (
            <View style={styles.tabContent}>
              {reviews.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbox-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                  <Text style={[styles.emptyText, themeStyles.textSecondary]}>No reviews yet.</Text>
                </View>
              ) : (
                reviews.map(review => (
                  <View key={review.id} style={[styles.reviewCard, themeStyles.card]}>
                    <View style={styles.reviewHeader}>
                      <Image source={{ uri: review.reviewer?.avatar_url || 'https://via.placeholder.com/50' }} style={styles.reviewerAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reviewerName, themeStyles.text]}>{review.reviewer?.full_name || 'Anonymous'}</Text>
                        <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Ionicons key={s} name="star" size={12} color={s <= review.rating ? "#fbbf24" : theme.cardBorder} />
                          ))}
                        </View>
                      </View>
                      <Text style={[styles.reviewDate, themeStyles.textSecondary]}>{new Date(review.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={[styles.reviewText, themeStyles.text]}>{review.comment}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* --- MODALS --- */}

      {/* OPTIONS MODAL */}
      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowOptionsModal(false)}>
          <View style={[styles.modalCard, themeStyles.modalBg, { padding: 0, overflow: 'hidden' }]}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.cardBorder }}>
              <Text style={[styles.modalTitle, themeStyles.text, { marginBottom: 0 }]}>More Options</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.optionButton, pressed && { backgroundColor: theme.inputBackground }]} onPress={() => { setShowOptionsModal(false); setShowReportModal(true); }}>
              <Ionicons name="flag-outline" size={22} color={theme.text} style={{ marginRight: 12 }} />
              <Text style={[styles.optionButtonText, themeStyles.text]}>Report User</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.optionButton, pressed && { backgroundColor: theme.inputBackground }]} onPress={() => { setShowOptionsModal(false); setShowBlockModal(true); }}>
              <Ionicons name="ban-outline" size={22} color={theme.danger} style={{ marginRight: 12 }} />
              <Text style={[styles.optionButtonText, { color: theme.danger }]}>Block User</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
          {selectedService && !isOwnProfile && !isBlocked && (
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

      {/* REPORT MODAL */}
      <Modal visible={showReportModal} animationType="slide" transparent onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, themeStyles.modalBg]}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Report User</Text>
            <Text style={[styles.modalSubtitle, themeStyles.textSecondary]}>Why are you reporting this user?</Text>
            <TextInput style={[styles.modalInput, themeStyles.input]} placeholder="Describe the issue..." placeholderTextColor={theme.textSecondary} multiline value={reportReason} onChangeText={setReportReason} />
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setShowReportModal(false)} style={styles.modalBtn}><Text style={[styles.modalBtnText, themeStyles.text]}>Cancel</Text></Pressable>
              <Pressable onPress={handleSubmitReport} style={[styles.modalBtn, { backgroundColor: theme.danger }]}><Text style={[styles.modalBtnText, { color: '#fff' }]}>Report</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ALERTS */}
      <ModernAlertModal visible={showLoginAlert} onClose={() => setShowLoginAlert(false)} title="Login Required" message="Please log in to follow." />
      <ModernAlertModal visible={showErrorAlert} onClose={() => setShowErrorAlert(false)} title="Error" message={errorAlertMessage} type="error" />
      <ModernAlertModal visible={showSuccessAlert} onClose={() => setShowSuccessAlert(false)} title="Success" message={successAlertMessage} type="success" />
      <ModernAlertModal visible={showDuplicateAlert} onClose={() => setShowDuplicateAlert(false)} title="Request Exists" message="You already have a pending request for this service." type="warning" />
      <ModernAlertModal visible={showOwnServiceAlert} onClose={() => setShowOwnServiceAlert(false)} title="Action Not Allowed" message="You cannot request your own service." type="warning" />
      <ModernAlertModal visible={showUnblockModal} onClose={() => setShowUnblockModal(false)} onConfirm={confirmUnblock} title="Unblock User" message="Are you sure?" type="warning" showConfirm={true} confirmText="Unblock" />
      <ModernAlertModal visible={showBlockModal} onClose={() => setShowBlockModal(false)} onConfirm={confirmBlock} title="Block User" message="You won't see their content." type="warning" showConfirm={true} confirmText="Block" cancelText="Cancel" />
      <ModernAlertModal visible={showFollowError} onClose={() => setShowFollowError(false)} title="Error" message={errorAlertMessage} type="error" />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24,
  },
  iconButton: {
    padding: 10, borderRadius: 24,
    ...Shadows.md
  },

  scrollContent: { paddingTop: 110, paddingBottom: 40 },

  profileHeader: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 24 },
  avatarContainer: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', marginBottom: 16, borderWidth: 4,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '700' },
  name: { fontSize: 26, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  role: { fontSize: 13, letterSpacing: 1.2, marginBottom: 24, fontWeight: '600' },

  statsContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
    width: '100%', marginBottom: 24
  },
  statItem: { alignItems: 'center', minWidth: 60 },
  statText: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: 24 },

  actionRow: { flexDirection: 'row', gap: 12, width: '100%', paddingHorizontal: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center'
  },
  actionBtnText: { fontSize: 16, fontWeight: '600' },
  messageBtn: {
    flexDirection: 'row', gap: 8, borderWidth: 1, backgroundColor: 'transparent'
  },
  messageBtnText: { fontSize: 16, fontWeight: '600' },

  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  blockedCard: {
    width: '100%',
    maxWidth: 400,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  blockedTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center'
  },
  blockedDesc: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10
  },
  unblockBtnLarge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1
  },
  unblockTextLarge: {
    fontSize: 16,
    fontWeight: '700'
  },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 24, marginBottom: 20 },
  tabItem: { paddingVertical: 14, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 16, fontWeight: '600' },
  tabContent: { paddingHorizontal: 24 },
  sectionHeader: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  bioText: { fontSize: 15, lineHeight: 24 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 10, fontStyle: 'italic' },
  aboutCard: { borderRadius: 20, padding: 24, marginBottom: 20 },
  divider: { height: 1, width: '100%', marginVertical: 16 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { alignItems: 'center', flex: 1 },
  metaLabel: { fontSize: 12, marginBottom: 4 },
  metaValue: { fontSize: 15, fontWeight: '600' },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  skillText: { fontSize: 14, fontWeight: '500' },
  serviceCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 16,
    ...Shadows.lg
  },
  serviceImageThumbnail: { width: 70, height: 70, borderRadius: 12, marginRight: 16 },
  serviceIconPlaceholder: { width: 70, height: 70, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  serviceInfo: { flex: 1, gap: 4 },
  serviceLabel: { fontSize: 16, fontWeight: '700' },
  serviceCategory: { fontSize: 12, opacity: 0.7 },
  servicePrice: { fontSize: 15, fontWeight: '600' },
  arrowBtn: { padding: 8, borderRadius: 20 },
  reviewCard: { padding: 20, borderRadius: 20, marginBottom: 16 },
  reviewHeader: { flexDirection: 'row', marginBottom: 10 },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#ccc' },
  reviewerName: { fontSize: 15, fontWeight: '700' },
  reviewDate: { fontSize: 12 },
  reviewText: { fontSize: 15, lineHeight: 22 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  modalInput: { borderRadius: 16, padding: 16, fontSize: 16, height: 100, textAlignVertical: 'top', borderWidth: 1, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: '600' },
  optionButton: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  optionButtonText: { fontSize: 16, fontWeight: '600' },
  modernAlertBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modernAlertCard: { width: '100%', borderRadius: 26, padding: 30, alignItems: 'center', elevation: 10 },
  alertIconContainer: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modernAlertTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  modernAlertMessage: { fontSize: 16, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  modernAlertButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modernAlertBtn: { flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modernAlertBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1 },
  modernAlertBtnText: { fontSize: 16, fontWeight: '700' },
  fullScreenModalContainer: { flex: 1 },
  serviceModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  backButton: { padding: 8 },
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
});
