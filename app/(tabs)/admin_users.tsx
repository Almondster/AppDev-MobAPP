import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Animated, Modal, SafeAreaView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadows } from '../../constants/theme';
import { activateUser, fetchReports, fetchUsers, suspendUser } from '@/frontend/api';

const FILTERS = ['All', 'Creators', 'Clients', 'Suspended'];

export default function AdminUsersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  // Interactivity States
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [usersRes, reportsRes] = await Promise.all([
        fetchUsers(),
        fetchReports().catch(() => []),
      ]);
      const rows = usersRes?.results || usersRes || [];
      const reports = reportsRes?.results || reportsRes || [];
      const reportCounts = new Map<string, number>();

      reports.forEach((report: any) => {
        const reportedId = String(report.reported_id || report.user_id || '');
        if (reportedId) reportCounts.set(reportedId, (reportCounts.get(reportedId) || 0) + 1);
      });

      setUsers(rows.map((row: any) => {
        const uid = String(row.firebase_uid || row.id);
        const fullName = row.full_name || row.username || row.email || 'User';
        const role = String(row.role || 'client').toLowerCase();
        const status = row.is_active === false ? 'Suspended' : (reportCounts.get(uid) || 0) >= 3 ? 'Warning' : 'Active';

        return {
          raw: row,
          id: row.id ?? uid,
          uid,
          name: fullName,
          role: role === 'admin' ? 'Admin' : role === 'creator' ? 'Creator' : 'Client',
          status,
          joined: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Unknown',
          reports: reportCounts.get(uid) || reportCounts.get(String(row.id)) || 0,
          avatarColor: role === 'creator' ? '#a78bfa' : role === 'admin' ? '#f43f5e' : '#3b82f6',
        };
      }));
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();

    loadUsers();
  }, [pulseAnim]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'Suspended': return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'Warning': return { text: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' };
      default: return { text: theme.textSecondary, bg: theme.cardBorder };
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Creator': return { text: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' };
      case 'Client': return { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
      default: return { text: theme.textSecondary, bg: theme.cardBorder };
    }
  };

  // Filter users based on search and active filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = search === '' || user.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All'
      || (activeFilter === 'Creators' && user.role === 'Creator')
      || (activeFilter === 'Clients' && user.role === 'Client')
      || (activeFilter === 'Suspended' && user.status === 'Suspended');
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={[styles.mainHeaderCard, { backgroundColor: theme.card }]}>
        <View style={[styles.mainHeaderContent, { paddingTop: Math.max(insets.top + 16, 60) }]}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Manage Users</Text>
          <Pressable
            hitSlop={10}
            style={styles.headerIconButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name={showSearch ? "close" : "search"} size={24} color={theme.text} />
          </Pressable>
        </View>

        {/* Collapsible Search Bar */}
        {showSearch && (
          <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search users..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Users List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll} style={styles.filtersWrapper}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? theme.text : theme.card,
                    borderColor: theme.cardBorder
                  }
                ]}
              >
                <Text style={{
                  color: isActive ? theme.background : theme.text,
                  fontWeight: isActive ? '700' : '600',
                  fontSize: 14,
                }}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          // Skeleton Loading State
          Array.from({ length: 5 }).map((_, i) => (
            <Animated.View key={`skel-${i}`} style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, opacity: pulseAnim }]}>
              <View style={styles.userTopRow}>
                <View style={[styles.avatar, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.userInfo}>
                  <View style={{ width: 120, height: 16, backgroundColor: theme.cardBorder, borderRadius: 4, marginBottom: 8 }} />
                  <View style={{ width: 80, height: 12, backgroundColor: theme.cardBorder, borderRadius: 4 }} />
                </View>
              </View>
              <View style={[styles.infoRow, { borderTopColor: theme.cardBorder }]}>
                <View style={{ width: 100, height: 12, backgroundColor: theme.cardBorder, borderRadius: 4 }} />
                <View style={{ width: 80, height: 12, backgroundColor: theme.cardBorder, borderRadius: 4 }} />
              </View>
            </Animated.View>
          ))
        ) : filteredUsers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="people-outline" size={40} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 10 }} />
            <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>No users found matching your criteria.</Text>
          </View>
        ) : (
          filteredUsers.map((user) => {
            const colors = getStatusColor(user.status);
            const roleBadge = getRoleBadge(user.role);

            return (
              <Pressable
                key={user.id}
                onPress={() => setSelectedUser(user)}
                style={({ pressed }) => [
                  styles.userCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                ]}
              >

                {/* Primary User Info Row */}
                <View style={styles.userTopRow}>
                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: user.avatarColor }]}>
                    <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                  </View>

                  {/* Name & Role */}
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{user.name}</Text>
                    <View style={styles.roleRow}>
                      <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                        <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>{user.role}</Text>
                      </View>
                      <View style={[styles.statusDot, { backgroundColor: colors.text }]} />
                      <Text style={[styles.statusText, { color: colors.text }]}>{user.status}</Text>
                    </View>
                  </View>

                  {/* Vertical Dots Action Menu */}
                  <Pressable hitSlop={10} style={styles.actionMenuBtn} onPress={() => setSelectedUser(user)}>
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>

                {/* Info Row */}
                <View style={[styles.infoRow, { borderTopColor: theme.cardBorder }]}>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>{user.joined}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons
                      name={user.reports > 0 ? "alert-circle" : "checkmark-circle-outline"}
                      size={14}
                      color={user.reports > 0 ? '#ef4444' : '#10b981'}
                    />
                    <Text style={[styles.infoText, { color: user.reports > 0 ? '#ef4444' : theme.textSecondary }]}>
                      {user.reports} {user.reports === 1 ? 'report' : 'reports'}
                    </Text>
                  </View>
                </View>

              </Pressable>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Admin User Modal */}
      <Modal visible={!!selectedUser} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedUser(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>User Details</Text>
            <Pressable onPress={() => setSelectedUser(null)} hitSlop={10}>
              <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </Pressable>
          </View>

          {selectedUser && (
            <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
              {/* Top Profile Section */}
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.modalAvatar, { backgroundColor: selectedUser.avatarColor }]}>
                  <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700' }}>{selectedUser.name.charAt(0)}</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text, marginTop: 16 }}>{selectedUser.name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleBadge(selectedUser.role).bg, marginTop: 8 }]}>
                  <Text style={[styles.roleBadgeText, { color: getRoleBadge(selectedUser.role).text }]}>{selectedUser.role}</Text>
                </View>
              </View>

              {/* Status and Analytics Box */}
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.cardBorder }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: theme.textSecondary }}>System Status</Text>
                  <Text style={{ color: getStatusColor(selectedUser.status).text, fontWeight: '700' }}>{selectedUser.status}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: theme.textSecondary }}>Join Date</Text>
                  <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedUser.joined}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.textSecondary }}>Reports Triggered</Text>
                  <Text style={{ color: selectedUser.reports > 0 ? '#ef4444' : theme.text, fontWeight: '600' }}>{selectedUser.reports}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 12, marginTop: 24 }}>
                <Pressable
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.tint }, pressed && { opacity: 0.8 }]}
                  onPress={() => alert('Feature coming soon: Contact User')}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Message User</Text>
                </Pressable>

                {selectedUser.status !== 'Suspended' ? (
                  <Pressable
                    style={({ pressed }) => [styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ef4444' }, pressed && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                    onPress={async () => {
                      try {
                        await suspendUser(selectedUser.id);
                        setSelectedUser(null);
                        await loadUsers();
                      } catch (err: any) {
                        alert(err?.message || 'Failed to suspend account');
                      }
                    }}
                  >
                    <Ionicons name="ban" size={20} color="#ef4444" />
                    <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Suspend Account</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#10b981' }, pressed && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
                    onPress={async () => {
                      try {
                        await activateUser(selectedUser.id);
                        setSelectedUser(null);
                        await loadUsers();
                      } catch (err: any) {
                        alert(err?.message || 'Failed to reactivate account');
                      }
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="#10b981" />
                    <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Reactivate Account</Text>
                  </Pressable>
                )}
              </View>

            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainHeaderCard: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.lg,
    zIndex: 10,
  },
  mainHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerIconButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filtersWrapper: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  userCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    ...Shadows.md,

  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionMenuBtn: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});
