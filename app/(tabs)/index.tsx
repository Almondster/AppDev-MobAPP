import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { BookingModal, CreatorModal, ServiceModal } from '../../components/home/modals';
import {
    CategorySection,
    CreatorsSection,
    HomeHeader,
    HomeSkeleton,
    MatchesSection,
    ServicesSection
} from '../../components/home/sections';
import { useOrderUpdates } from '../../context/OrderContext';
import { useTheme } from '../../context/ThemeContext';
import { useUnread } from '../../context/UnreadContext';
import { auth } from '../../frontend/session';
import { handleBookService, isBlocked } from '../../hooks/home/useBooking';
import { useHomeData } from '../../hooks/home/useHomeData';
import { useAnalytics } from '../../hooks/useAnalytics';
import { supabase } from '../../frontend/store';
import AdminDashboardScreen from './AdminDashboardScreen';
import AnalyticsScreen from './AnalyticsScreen';

export default function HomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const { theme, isDark } = useTheme();
  const { trackServiceClick } = useAnalytics(); 
  
  const { unseenOrderCount } = useOrderUpdates();
  const { unreadCount } = useUnread();
  const totalNotifications = unseenOrderCount + unreadCount;

  // Use custom hook for data fetching
  const {
    userName,
    userAvatar,
    mainCategories,
    creators,
    recentMatches,
    creatorServices,
    blockedIds,
    loading,
    role,
    roleLoading,
    hasMatches,
  } = useHomeData();

  // MODAL STATE
  const [creatorModalVisible, setCreatorModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);

  // BOOKING MODAL STATES
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showBlockedServiceModal, setShowBlockedServiceModal] = useState(false);

  // --- BOOKING FUNCTIONALITY ---
  const onBookService = async (service: any) => {
    setBookingId(service.id);
    
    await handleBookService(service, user, blockedIds, {
      onBlocked: () => {
        setBookingId(null);
        setShowBlockedServiceModal(true);
      },
      onDuplicate: () => {
        setBookingId(null);
        setShowDuplicateModal(true);
      },
      onSuccess: () => {
        setBookingId(null);
        setShowSuccessModal(true);
        setServiceModalVisible(false);
      },
      onError: (message: string) => {
        setBookingId(null);
        alert(`Booking Failed: ${message}`);
      },
    });
  };

  const handleGoToOrders = () => {
    setShowSuccessModal(false);
    setShowDuplicateModal(false);
    router.push('/order');
  };

  const openCreatorModal = async (creator: any) => {
    try {
      const { data } = await supabase
        .from('creators')
        .select('bio, skills')
        .eq('user_id', creator.firebase_uid)
        .maybeSingle();
      
      setSelectedCreator({ ...creator, ...data });
    } catch {
      setSelectedCreator(creator);
    }
    setCreatorModalVisible(true);
  };

  const openServiceModal = (service: any) => {
    if (isBlocked(service.creator_id, blockedIds)) {
      setSelectedService(service);
      setShowBlockedServiceModal(true);
      return;
    }
    
    // TRACK ANALYTICS HERE
    trackServiceClick(service.creator_id);

    setSelectedService(service);
    setServiceModalVisible(true);
  };

  const goToProfile = (uid: string) => {
    setCreatorModalVisible(false);
    setServiceModalVisible(false);
    router.push(`/creator/${uid}`);
  };

  const isCurrentUser = selectedCreator?.firebase_uid === user?.uid;

  if (roleLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <HomeHeader 
          userName={userName} 
          userAvatar={userAvatar} 
          totalNotifications={totalNotifications} 
        />
        <HomeSkeleton />
      </View>
    );
  }

  if (role === 'creator') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <HomeHeader 
          userName={userName} 
          userAvatar={userAvatar} 
          totalNotifications={totalNotifications} 
        />
        <AnalyticsScreen />
      </View>
    );
  }

  if (role === 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <HomeHeader 
          userName={userName} 
          userAvatar={userAvatar} 
          totalNotifications={totalNotifications} 
        />
        <AdminDashboardScreen />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <HomeHeader 
        userName={userName} 
        userAvatar={userAvatar} 
        totalNotifications={totalNotifications} 
      />

      {loading ? (
        <HomeSkeleton />
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 20, backgroundColor: theme.background }}
          bounces={false}
          overScrollMode="never"
        >
          <CategorySection categories={mainCategories} />
          
          <MatchesSection matches={recentMatches} hasMatches={hasMatches} />
          
          <ServicesSection services={creatorServices} onServicePress={openServiceModal} />
          
          <CreatorsSection creators={creators} onCreatorPress={openCreatorModal} />
        </ScrollView>
      )}

      {/* MODALS */}
      <CreatorModal
        visible={creatorModalVisible}
        creator={selectedCreator}
        isBlocked={selectedCreator ? isBlocked(selectedCreator.firebase_uid, blockedIds) : false}
        isCurrentUser={isCurrentUser}
        onClose={() => setCreatorModalVisible(false)}
        onViewProfile={goToProfile}
      />

      <ServiceModal
        visible={serviceModalVisible}
        service={selectedService}
        isBlocked={selectedService ? isBlocked(selectedService.creator_id, blockedIds) : false}
        isOwnService={selectedService?.creator_id === user?.uid}
        bookingId={bookingId}
        onClose={() => setServiceModalVisible(false)}
        onBook={() => onBookService(selectedService)}
        onViewProfile={goToProfile}
      />

      {/* BLOCKED SERVICE ALERT MODAL */}
      <BookingModal
        visible={showBlockedServiceModal}
        type="blocked"
        onClose={() => setShowBlockedServiceModal(false)}
        onGoToOrders={() => {
          setShowBlockedServiceModal(false);
          if (selectedService) goToProfile(selectedService.creator_id);
        }}
      />

      {/* BOOKING MODALS */}
      <BookingModal
        visible={showSuccessModal}
        type="success"
        creatorName={selectedService?.creator?.full_name}
        onClose={() => setShowSuccessModal(false)}
        onGoToOrders={handleGoToOrders}
      />

      <BookingModal
        visible={showDuplicateModal}
        type="duplicate"
        onClose={() => setShowDuplicateModal(false)}
        onGoToOrders={handleGoToOrders}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
