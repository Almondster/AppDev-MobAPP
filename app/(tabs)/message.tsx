import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { MessageThread } from '../../constants/mockData';
import { useTheme } from '../../context/ThemeContext';
import { Shadows } from '../../constants/theme';
import { supabase } from '../../frontend/store';
import { auth } from '../../frontend/session';

// --- SKELETON ---
const SkeletonItem = ({ width, height, borderRadius = 4, style }: any) => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
    ])).start();
  }, [opacity]);
  return <Animated.View style={[{ width, height, borderRadius, backgroundColor: theme.cardBorder, opacity }, style]} />;
};

export default function MessageScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = auth.currentUser;

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'unread'>('recent');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchThreads = useCallback(async (showSpinner = true) => {
    if (!user) {
      setThreads([]);
      setFilteredThreads([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showSpinner) setLoading(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = new Map<string, MessageThread>();

      (data || []).forEach((message: any) => {
        const senderId = String(message.sender_id);
        const receiverId = String(message.receiver_id);
        const partnerId = senderId === user.uid ? receiverId : senderId;
        const sentByMe = senderId === user.uid;
        const timestamp = new Date(message.created_at || message.timestamp || Date.now());
        const existing = grouped.get(partnerId);
        const content = message.is_deleted
          ? 'message unsent.'
          : message.media_url
            ? 'Image attachment'
            : message.content || '';

        if (!existing || timestamp > existing.lastMessageTime) {
          grouped.set(partnerId, {
            partnerId,
            partnerName: sentByMe
              ? message.receiver_name || existing?.partnerName || 'User'
              : message.sender_name || existing?.partnerName || 'User',
            partnerAvatar: null,
            lastMessage: content,
            lastMessageTime: timestamp,
            unreadCount: existing?.unreadCount || 0,
          });
        }

        if (!sentByMe && !message.is_read && !message.is_deleted) {
          const current = grouped.get(partnerId);
          if (current) current.unreadCount += 1;
        }
      });

      const nextThreads = Array.from(grouped.values())
        .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

      setThreads(nextThreads);
      setFilteredThreads(nextThreads);
    } catch (err) {
      console.error('Error fetching message threads:', err);
      setThreads([]);
      setFilteredThreads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const applyFilters = (threadsList: MessageThread[], unreadFilter: boolean, sort: 'recent' | 'unread', search: string) => {
    let result = [...threadsList];
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(t => t.partnerName.toLowerCase().includes(lower) || t.lastMessage.toLowerCase().includes(lower));
    }
    if (unreadFilter) result = result.filter(t => t.unreadCount > 0);
    if (sort === 'recent') result.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
    else result.sort((a, b) => b.unreadCount - a.unreadCount || b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
    setFilteredThreads(result);
  };

  useEffect(() => {
    applyFilters(threads, filterUnread, sortBy, searchQuery);
  }, [filterUnread, sortBy, threads, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchThreads(false);
  };

  const getTimeDisplay = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 168) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const themeStyles = {
    container: { backgroundColor: theme.background },
    header: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    inputContainer: { backgroundColor: theme.inputBackground },
    inputText: { color: theme.text },
    avatarPlaceholder: { backgroundColor: theme.tint },
    modalBg: { backgroundColor: theme.card },
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={[styles.header, themeStyles.header]}>
        {isSearchVisible ? (
          <View style={[styles.searchBarContainer, themeStyles.inputContainer]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput style={[styles.searchInput, themeStyles.inputText]} placeholder="Search..." placeholderTextColor={theme.textSecondary} value={searchQuery} onChangeText={setSearchQuery} autoFocus />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={{ marginRight: 8 }}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
            <Pressable onPress={() => { setIsSearchVisible(false); setSearchQuery(''); }}>
              <Text style={{ color: theme.tint, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.title, themeStyles.text]}>Messages</Text>
              <Text style={[styles.subtitle, themeStyles.textSecondary]}>
                {loading ? '...' : filteredThreads.length} {filteredThreads.length === 1 ? 'conversation' : 'conversations'}
              </Text>
            </View>
            <View style={styles.headerIcons}>
              <Pressable onPress={() => setIsSearchVisible(true)} style={styles.filterButton}>
                <Ionicons name="search" size={24} color={theme.text} />
              </Pressable>
              <Pressable onPress={() => setShowFilterModal(true)} style={[styles.filterButton, { backgroundColor: filterUnread || sortBy !== 'recent' ? theme.tint + '20' : 'transparent' }]}>
                <Ionicons name="options" size={24} color={filterUnread || sortBy !== 'recent' ? theme.tint : theme.text} />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* MESSAGE LIST */}
      <ScrollView contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.threadCard, themeStyles.card]}>
                <SkeletonItem width={56} height={56} borderRadius={28} style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <SkeletonItem width={120} height={20} borderRadius={4} />
                    <SkeletonItem width={40} height={16} borderRadius={4} />
                  </View>
                  <SkeletonItem width="80%" height={16} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        ) : filteredThreads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={80} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, themeStyles.text]}>{searchQuery ? 'No results found' : 'No Messages Yet'}</Text>
            <Text style={[styles.emptySubtitle, themeStyles.textSecondary]}>
              {searchQuery ? `No conversations matching "${searchQuery}"` : filterUnread ? 'No unread messages' : 'Start a conversation to see messages here'}
            </Text>
          </View>
        ) : (
          filteredThreads.map((thread) => (
            <Pressable key={thread.partnerId} style={[styles.threadCard, themeStyles.card]} onPress={() => router.push(`/chat/${thread.partnerId}` as never)}>
              <View style={styles.avatarContainer}>
                {thread.partnerAvatar ? (
                  <Image source={{ uri: thread.partnerAvatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                    <Text style={[styles.avatarText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{thread.partnerName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                {thread.unreadCount > 0 && <View style={[styles.unreadIndicator, { backgroundColor: theme.tint }]} />}
              </View>
              <View style={styles.threadBody}>
                <View style={styles.threadHeader}>
                  <Text style={[styles.partnerName, themeStyles.text]} numberOfLines={1}>{thread.partnerName}</Text>
                  <Text style={[styles.timeText, themeStyles.textSecondary]}>{getTimeDisplay(thread.lastMessageTime)}</Text>
                </View>
                <Text style={[styles.lastMessage, thread.unreadCount > 0 ? { color: theme.text, fontWeight: '600' } : themeStyles.textSecondary]} numberOfLines={2}>{thread.lastMessage}</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* FILTER MODAL */}
      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilterModal(false)}>
          <Pressable style={[styles.modalContainer, themeStyles.modalBg]} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, themeStyles.text]}>Filter Messages</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, themeStyles.text]}>Show</Text>
              <Pressable style={[styles.filterOption, filterUnread && { backgroundColor: theme.tint + '20' }]} onPress={() => setFilterUnread(!filterUnread)}>
                <View style={styles.filterOptionLeft}>
                  <Ionicons name={filterUnread ? "checkbox" : "square-outline"} size={24} color={filterUnread ? theme.tint : theme.textSecondary} />
                  <Text style={[styles.filterOptionText, themeStyles.text]}>Unread messages only</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, themeStyles.text]}>Sort by</Text>
              <Pressable style={[styles.filterOption, sortBy === 'recent' && { backgroundColor: theme.tint + '20' }]} onPress={() => setSortBy('recent')}>
                <View style={styles.filterOptionLeft}>
                  <Ionicons name={sortBy === 'recent' ? "radio-button-on" : "radio-button-off"} size={24} color={sortBy === 'recent' ? theme.tint : theme.textSecondary} />
                  <Text style={[styles.filterOptionText, themeStyles.text]}>Most recent</Text>
                </View>
              </Pressable>
              <Pressable style={[styles.filterOption, sortBy === 'unread' && { backgroundColor: theme.tint + '20' }]} onPress={() => setSortBy('unread')}>
                <View style={styles.filterOptionLeft}>
                  <Ionicons name={sortBy === 'unread' ? "radio-button-on" : "radio-button-off"} size={24} color={sortBy === 'unread' ? theme.tint : theme.textSecondary} />
                  <Text style={[styles.filterOptionText, themeStyles.text]}>Unread first</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.resetButton]} onPress={() => { setFilterUnread(false); setSortBy('recent'); setShowFilterModal(false); }}>
                <Text style={[styles.resetButtonText, { color: theme.textSecondary }]}>Reset</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.applyButton, { backgroundColor: theme.tint }]} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, ...Shadows.lg, minHeight: 120, justifyContent: 'center' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 16, fontWeight: '500' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  filterButton: { padding: 8, borderRadius: 12, marginLeft: 8 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  searchInput: { flex: 1, fontSize: 16, marginLeft: 8, marginRight: 8, height: '100%' },
  listContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  threadCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, ...Shadows.lg },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  unreadIndicator: { position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  threadBody: { flex: 1, marginRight: 0 },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  partnerName: { fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  timeText: { fontSize: 13, fontWeight: '500' },
  lastMessage: { fontSize: 15, lineHeight: 20 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', borderRadius: 24, padding: 24, ...Shadows.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  filterSection: { marginBottom: 24 },
  filterSectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, opacity: 0.8 },
  filterOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8 },
  filterOptionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  filterOptionText: { fontSize: 16, fontWeight: '500', marginLeft: 12, flex: 1 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  resetButton: { borderWidth: 2, borderColor: '#e2e8f0' },
  applyButton: { ...Shadows.lg },
  resetButtonText: { fontSize: 16, fontWeight: '600' },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
