import { useLanguage } from '@/context/LanguageContext';
import { useOrderUpdates } from '@/context/OrderContext';
import { useTheme } from '@/context/ThemeContext';
import { useUnread } from '@/context/UnreadContext';
import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { clearAllNotifications, fetchOrderNotifications, markNotificationRead } from '@/frontend/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadows } from '@/constants/theme';

type NotificationItem = {
  type: 'order' | 'message';
  id: string;
  itemId: number;
  title: string;
  desc: string;
  time: string;
  icon: string;
  color: string;
};

// --- SKELETON LOADER COMPONENT ---
const SkeletonNotificationItem = () => {
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

  const bgStyle = { backgroundColor: theme.cardBorder, opacity };

  return (
    <View style={{ flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, alignItems: 'flex-start' }}>
      {/* Icon Circle Skeleton */}
      <Animated.View style={[{ width: 48, height: 48, borderRadius: 24, marginRight: 16 }, bgStyle]} />

      <View style={{ flex: 1 }}>
        {/* Title Skeleton */}
        <Animated.View style={[{ width: '40%', height: 16, borderRadius: 4, marginBottom: 8 }, bgStyle]} />
        {/* Description Skeleton (Line 1) */}
        <Animated.View style={[{ width: '90%', height: 12, borderRadius: 4, marginBottom: 6 }, bgStyle]} />
        {/* Description Skeleton (Line 2) */}
        <Animated.View style={[{ width: '70%', height: 12, borderRadius: 4, marginBottom: 8 }, bgStyle]} />
        {/* Time Skeleton */}
        <Animated.View style={[{ width: '20%', height: 10, borderRadius: 4 }, bgStyle]} />
      </View>
    </View>
  );
};

export default function NotificationScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { t: _t } = useLanguage();
  const user = auth.currentUser;

  // Context Data
  const { unseenOrders, markOrdersAsSeen } = useOrderUpdates();
  const { unreadMessages, markAllAsRead } = useUnread();

  // State
  const [role, setRole] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Messages' | 'Orders'>('All');
  const [showClearModal, setShowClearModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendNotifications, setBackendNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const { data } = await supabase.from('users').select('role').eq('firebase_uid', user.uid).single();
        if (data) setRole(data.role);
        try {
          const notifications = await fetchOrderNotifications({ user_id: user.uid, is_read: false });
          setBackendNotifications(notifications?.results || notifications || []);
        } catch (err) {
          console.warn('Order notification feed unavailable:', err);
        }
      }
      setLoading(false);
    };
    fetchRole();
  }, [user]);

  // --- COMBINE & SORT DATA ---
  const getNotifications = () => {
    const list: NotificationItem[] = [];

    backendNotifications.forEach((notification) => {
      list.push({
        type: 'order',
        id: String(notification.id),
        itemId: notification.order_id,
        title: notification.title || 'Order Update',
        desc: notification.message || notification.notification_type || 'Order notification',
        time: notification.created_at,
        icon: 'notifications',
        color: notification.is_read ? '#6b7280' : '#3b82f6',
      });
    });

    // 1. Orders - Detailed descriptions based on status and role
    unseenOrders.forEach(o => {
      let title = "Order Update";
      let desc = `Order #${o.id}: ${o.service_title}`;
      let icon = "clipboard";
      let color = "#3b82f6";

      const isCreator = o.creator_id === user?.uid;
      const isClient = o.client_id === user?.uid;

      // Status-based notifications with proper context
      if (o.status === 'pending') {
        if (isCreator) {
          title = "New Request";
          desc = `${o.client_name || 'A client'} requested: ${o.service_title}`;
          icon = "mail";
          color = "#10b981";
        } else {
          title = "Request Sent";
          desc = `Your request for "${o.service_title}" is pending creator approval`;
          icon = "time";
          color = "#f59e0b";
        }
      } else if (o.status === 'accepted') {
        if (isClient) {
          title = "Request Accepted";
          desc = `${o.creator_name || 'Creator'} accepted your request! Proceed with payment to start.`;
          icon = "checkmark-circle";
          color = "#10b981";
        } else {
          title = "Waiting for Payment";
          desc = `You accepted "${o.service_title}". Waiting for client payment.`;
          icon = "time";
          color = "#f59e0b";
        }
      } else if (o.status === 'in_progress') {
        if (isCreator) {
          title = "Payment Received";
          desc = `Client paid for "${o.service_title}". Start working now!`;
          icon = "cash";
          color = "#10b981";
        } else {
          title = "Work in Progress";
          desc = `${o.creator_name || 'Creator'} is working on "${o.service_title}"`;
          icon = "construct";
          color = "#3b82f6";
        }
      } else if (o.status === 'delivered') {
        if (isClient) {
          title = "Work Delivered";
          desc = `${o.creator_name || 'Creator'} submitted "${o.service_title}". Review to release payment.`;
          icon = "cube";
          color = "#8b5cf6";
        } else {
          title = "Awaiting Review";
          desc = `You delivered "${o.service_title}". Waiting for client approval.`;
          icon = "time";
          color = "#f59e0b";
        }
      } else if (o.status === 'completed') {
        if (isCreator) {
          title = "Payment Released";
          desc = `Client approved "${o.service_title}". Payment released to you!`;
          icon = "checkmark-circle";
          color = "#10b981";
        } else {
          title = "Order Completed";
          desc = `"${o.service_title}" is complete. Payment released to creator.`;
          icon = "checkmark-circle";
          color = "#10b981";
        }
      } else if (o.status === 'cancelled') {
        title = "Order Cancelled";
        desc = `Order "${o.service_title}" was cancelled`;
        if ((o as any).escrow_status === 'refunded_to_client') {
          desc += isClient ? ". Refund processed." : ". Client refunded.";
        }
        icon = "close-circle";
        color = "#ef4444";
      } else if (o.status === 'rejected') {
        if (isClient) {
          title = "Request Rejected";
          desc = `${o.creator_name || 'Creator'} declined your request for "${o.service_title}"`;
          icon = "close-circle";
          color = "#ef4444";
        } else {
          title = "Request Declined";
          desc = `You rejected the request for "${o.service_title}"`;
          icon = "close-circle";
          color = "#6b7280";
        }
      }

      // Extension request notifications (overlay on top of status)
      // Only show extension notifications if an extension was actually requested
      if ((o as any).deadline_extension_requested_at && (o as any).deadline_extension_approved === null) {
        if (isClient) {
          title = "Extension Request";
          // deadline_extension_days is stored as total minutes (integer)
          const totalMinutes = (o as any).deadline_extension_days || 0;
          const days = Math.floor(totalMinutes / 1440);
          const remainingMinutes = totalMinutes % 1440;
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;

          let timeText = '';
          if (days > 0) timeText += `${days}d `;
          if (hours > 0) timeText += `${hours}h `;
          if (minutes > 0) timeText += `${minutes}m`;
          if (!timeText) timeText = '0m';

          desc = `${o.creator_name || 'Creator'} wants ${timeText.trim()} more time for "${o.service_title}"`;
          icon = "hourglass";
          color = "#f59e0b";
        }
      } else if ((o as any).deadline_extension_requested_at && (o as any).deadline_extension_approved === true) {
        if (isCreator) {
          title = "Extension Approved";
          // Decode the extension time to show what was approved
          const totalMinutes = (o as any).deadline_extension_days || 0;
          const days = Math.floor(totalMinutes / 1440);
          const remainingMinutes = totalMinutes % 1440;
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;

          let timeText = '';
          if (days > 0) timeText += `${days}d `;
          if (hours > 0) timeText += `${hours}h `;
          if (minutes > 0) timeText += `${minutes}m`;
          if (!timeText) timeText = '0m';

          desc = `Client approved +${timeText.trim()} extension for "${o.service_title}"`;
          icon = "checkmark-circle";
          color = "#10b981";
        }
      } else if ((o as any).deadline_extension_requested_at && (o as any).deadline_extension_approved === false) {
        if (isCreator) {
          title = "Extension Denied";
          desc = `Client denied your extension request for "${o.service_title}"`;
          icon = "close-circle";
          color = "#ef4444";
        }
      }

      // Refund request notifications
      if ((o as any).refund_requested_at && (o as any).refund_approved === null) {
        if (isCreator) {
          title = "Refund Requested";
          desc = `Client requested a refund for "${o.service_title}". Deliver within 24h to avoid automatic refund.`;
          icon = "warning";
          color = "#ef4444";
        }
      } else if ((o as any).refund_requested_at && (o as any).refund_approved === true) {
        if (isClient) {
          title = "Refund Approved";
          desc = `Your refund for "${o.service_title}" has been processed.`;
          icon = "checkmark-circle";
          color = "#10b981";
        } else {
          title = "Refund Processed";
          desc = `Refund approved for "${o.service_title}". Order cancelled.`;
          icon = "close-circle";
          color = "#ef4444";
        }
      } else if ((o as any).refund_requested_at && (o as any).refund_approved === false) {
        if (isClient) {
          title = "Refund Denied";
          desc = `Your refund request for "${o.service_title}" was denied. Work has been delivered.`;
          icon = "close-circle";
          color = "#ef4444";
        }
      }

      list.push({
        type: 'order',
        id: o.creator_id === user?.uid ? o.client_id : o.creator_id,
        itemId: o.id,
        title,
        desc,
        time: o.updated_at,
        icon,
        color
      });
    });

    // 2. Messages
    const senderMap = new Map();
    unreadMessages.forEach(m => {
      if (!senderMap.has(m.sender_id)) {
        senderMap.set(m.sender_id, { count: 0, lastMsg: m });
      }
      senderMap.get(m.sender_id).count++;
    });

    senderMap.forEach((val, key) => {
      const msg = val.lastMsg;
      let contentPreview = msg.content;

      // --- LOGIC TO HANDLE PHOTOS ---
      if (!contentPreview || contentPreview.trim() === '') {
        if (msg.media_url) {
          contentPreview = "Sent a photo";
        } else {
          contentPreview = "Sent a message";
        }
      }

      list.push({
        type: 'message',
        id: key,
        itemId: msg.id,
        title: msg.sender_name || "New Message",
        desc: val.count === 1 ? contentPreview : `${val.count} new messages`, // Use the smart preview
        time: msg.created_at,
        icon: "chatbubble-ellipses",
        color: theme.tint
      });
    });

    // Sort by time
    return list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

  // --- FILTER LOGIC ---
  const allNotifications = getNotifications();
  const filteredNotifications = allNotifications.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Messages') return item.type === 'message';
    if (activeFilter === 'Orders') return item.type === 'order';
    return true;
  });

  // --- HANDLERS ---
  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setBackendNotifications([]);
    } catch (err) {
      console.warn('Failed to clear backend notifications:', err);
    }
    await markOrdersAsSeen();
    await markAllAsRead();
    setShowClearModal(false);
    router.back();
  };

  const handlePress = async (item: NotificationItem) => {
    if (item.type === 'order') {
      const notification = backendNotifications.find((entry) => String(entry.id) === item.id);
      if (notification) {
        try {
          await markNotificationRead(notification.id);
          setBackendNotifications((current) => current.filter((entry) => entry.id !== notification.id));
        } catch (err) {
          console.warn('Failed to mark notification read:', err);
        }
      }
      router.push(`/(tabs)/order?orderId=${item.itemId}`);
    } else {
      router.push(`/chat/${item.id}`);
    }
  };

  // --- THEME ---
  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderBottomColor: theme.cardBorder },
    pillActive: { backgroundColor: theme.text, borderColor: theme.text },
    pillInactive: { backgroundColor: theme.card, borderColor: theme.cardBorder },
    pillTextActive: { color: theme.background },
    pillTextInactive: { color: theme.text },
    modalBg: { backgroundColor: theme.card },
  };

  const orderLabel = role === 'creator' ? 'My Gigs' : 'Orders';

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, themeStyles.text]}>Notifications</Text>
        {allNotifications.length > 0 && (
          <Pressable onPress={() => setShowClearModal(true)} style={styles.trashBtn}>
            <Ionicons name="trash-outline" size={22} color={theme.text} />
          </Pressable>
        )}
      </View>

      {/* PILL FILTERS */}
      <View style={styles.pillContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {['All', 'Messages', 'Orders'].map((filter) => {
            const label = filter === 'Orders' ? orderLabel : filter;
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                style={[
                  styles.pill,
                  isActive ? themeStyles.pillActive : themeStyles.pillInactive
                ]}
                onPress={() => setActiveFilter(filter as any)}
              >
                <Text style={[styles.pillText, isActive ? themeStyles.pillTextActive : themeStyles.pillTextInactive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* LIST */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {loading ? (
          // SKELETON LOADER STATE
          <View>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonNotificationItem key={i} />
            ))}
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, themeStyles.textSecondary]}>No notifications found</Text>
          </View>
        ) : (
          filteredNotifications.map((item, index) => (
            <Pressable
              key={index}
              style={[styles.notifItem, themeStyles.card]}
              onPress={() => handlePress(item)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemTitle, themeStyles.text]}>{item.title}</Text>
                <Text style={[styles.itemDesc, themeStyles.textSecondary]} numberOfLines={2}>
                  {item.desc}
                </Text>
                <Text style={[styles.itemTime, themeStyles.textSecondary]}>
                  {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.blueDot} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* CUSTOM CLEAR ALL MODAL */}
      <Modal visible={showClearModal} transparent animationType="fade" onRequestClose={() => setShowClearModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, themeStyles.modalBg]}>
            <View style={styles.modalIcon}>
              <Ionicons name="trash" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Clear Notifications?</Text>
            <Text style={[styles.modalDesc, themeStyles.textSecondary]}>
              This will mark all messages as read and remove all order alerts.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={[styles.modalBtnText, themeStyles.text]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
                onPress={handleClearAll}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Clear All</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  trashBtn: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    textAlign: 'left'
  },

  pillContainer: {
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },

  listContent: { paddingBottom: 40 },
  notifItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemDesc: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  itemTime: { fontSize: 12 },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginTop: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Shadows.xl,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef444420',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  modalDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600'
  }
});
