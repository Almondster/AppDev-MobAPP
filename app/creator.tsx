import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  Text,
  TextInput,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { styles } from '../styles/CreatorProfileScreen.styles';

const { height: _SCREEN_HEIGHT } = Dimensions.get('window');

const creatorId = 'mock-creator-id';
const user = { uid: 'mock-user-123' };

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
  const { theme, isDark } = useTheme();

  // ANALYTICS HOOK
  // const { trackProfileView, trackServiceClick } = useAnalytics();

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
  // useEffect(() => {
  //   if (creatorId) {
  //     // trackProfileView(creatorId);
  //   }
  // }, [creatorId]);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!creatorId) return;
    try {
      // 1. User Basic Info
      setCreator({
        firebase_uid: creatorId,
        full_name: 'Creator ' + creatorId,
        role: 'creator',
        avatar_url: 'https://via.placeholder.com/150'
      });

      // 2. Creator Details
      setDetails({
        bio: 'Expert in UI/UX Design and React Native.',
        skills: ['Figma', 'Sketch', 'React Native'],
        experience_years: 5,
        turnaround_time: '2-3 days',
        starting_price: 3000
      });

      // 3. Services (only public services visible to others)
      setServices([ // Mock
        { id: 's1', title: 'UI Design Mobile App', price: '5000', label: 'Design', image_url: 'https://via.placeholder.com/300' }
      ]);

      // 4. Reviews
      setReviews([ // Mock
        {
          id: 'r1',
          rating: 5,
          comment: 'Great work, fast turnaround!',
          created_at: new Date().toISOString(),
          reviewer: { full_name: 'Bob Client', avatar_url: 'https://via.placeholder.com/50' }
        }
      ]);

      // 5. Check Relationships
      if (user && !isOwnProfile) {
        setIsFollowing(false);
        setIsBlocked(false);
      }

      // 6. Followers Count
      setFollowersCount(83); // Mock
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

    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
  };

  const handleUnblock = async () => setShowUnblockModal(true);

  const confirmUnblock = async () => {
    if (!user) return;
    setIsBlocked(false);
    setShowUnblockModal(false);
    setSuccessAlertMessage("User unblocked successfully!");
    setShowSuccessAlert(true);
  };

  const confirmBlock = async () => {
    if (!user) return;
    setIsBlocked(true);
    setShowBlockModal(false);
    setSuccessAlertMessage("User blocked successfully.");
    setShowSuccessAlert(true);
    if (isFollowing) {
      setIsFollowing(false);
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
    setTimeout(() => {
      setSuccessAlertMessage(`Request sent to ${creator?.full_name || 'the creator'}.`);
      setShowSuccessAlert(true);
      setSelectedService(null);
      setBookingLoading(false);
    }, 1000);
  };

  const _handleGoToOrders = () => {
    setShowSuccessAlert(false);
    setShowDuplicateAlert(false);
    router.push('/order' as never);
  };

  const handleSubmitReport = async () => {
    if (!user) return;
    if (!reportReason.trim()) { setErrorAlertMessage("Please specify a reason."); setShowErrorAlert(true); return; }

    setTimeout(() => {
      setSuccessAlertMessage("We have received your report and will investigate.");
      setShowSuccessAlert(true);
      setShowReportModal(false);
      setReportReason('');
    }, 500);
  };

  const handleMessage = () => {
    if (selectedService) setSelectedService(null);
    if (creatorId) router.push(`/chat/${creatorId}` as never);
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
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
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
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
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={[styles.iconButton, { backgroundColor: theme.card }]}
        >
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
                      // trackServiceClick(creatorId);
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