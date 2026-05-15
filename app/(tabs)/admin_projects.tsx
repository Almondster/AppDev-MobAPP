import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Modal, SafeAreaView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadows } from '../../constants/theme';
import { deleteOrder, fetchOrders, updateOrderStatus } from '@/frontend/api';

const FILTERS = ['All', 'Active', 'Pending', 'Done', 'Suspended'];

export default function AdminProjectsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState('All');

  // Interactivity States
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      const rows = data?.results || data || [];
      setProjects(rows.map((order: any) => ({
        raw: order,
        id: order.id,
        title: order.service_title || `Order #${order.id}`,
        status: String(order.status || 'pending').toUpperCase().replace(/_/g, ' '),
        client: order.client_name || `Client #${order.client_id}`,
        creator: order.creator_name || `Creator #${order.creator_id}`,
        budget: Number(order.price || order.escrow_amount || 0),
        deadline: order.due_date ? new Date(order.due_date).toLocaleDateString() : 'No deadline',
        description: order.description || order.service_title || 'No description provided',
      })));
    } catch (err) {
      console.error('Failed to load projects:', err);
      setProjects([]);
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

    loadProjects();
  }, [pulseAnim]);

  // Filter projects
  const filteredProjects = projects.filter(proj => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Active' && proj.status === 'IN PROGRESS') return true;
    if (activeFilter === 'Pending' && proj.status === 'PENDING') return true;
    if (activeFilter === 'Done' && proj.status === 'COMPLETED') return true;
    if (activeFilter === 'Suspended' && ['CANCELLED', 'REJECTED', 'REFUNDED', 'DISPUTED'].includes(proj.status)) return true;
    return false;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return { text: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' };
      case 'IN PROGRESS': return { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'COMPLETED': return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      default: return { text: theme.textSecondary, bg: theme.cardBorder };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return 'time-outline';
      case 'IN PROGRESS': return 'sync-outline';
      case 'COMPLETED': return 'checkmark-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={[styles.mainHeaderCard, { backgroundColor: theme.card }]}>
        <View style={[styles.mainHeaderContent, { paddingTop: Math.max(insets.top + 16, 60) }]}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>All Projects</Text>
          <Pressable hitSlop={10} style={styles.headerIconButton}>
            <Ionicons name="search" size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* Projects List */}
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
          Array.from({ length: 4 }).map((_, i) => (
            <Animated.View key={`skel-${i}`} style={[styles.projectCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, opacity: pulseAnim }]}>
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.titleBlock}>
                  <View style={{ width: 140, height: 18, backgroundColor: theme.cardBorder, borderRadius: 4, marginBottom: 8 }} />
                  <View style={{ width: 100, height: 12, backgroundColor: theme.cardBorder, borderRadius: 4 }} />
                </View>
              </View>
              <View style={styles.cardMiddleRow}>
                <View style={{ width: 80, height: 24, backgroundColor: theme.cardBorder, borderRadius: 8 }} />
                <View style={{ width: 60, height: 20, backgroundColor: theme.cardBorder, borderRadius: 4 }} />
              </View>
              <View style={[styles.adminStatsBox, { backgroundColor: theme.cardBorder, opacity: 0.3, height: 60 }]} />
            </Animated.View>
          ))
        ) : filteredProjects.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="briefcase-outline" size={40} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 10 }} />
            <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>No projects match this filter.</Text>
          </View>
        ) : (
          filteredProjects.map((proj) => {
            const colors = getStatusColor(proj.status);
            const fee = proj.budget * 0.15;

            return (
              <Pressable
                key={proj.id}
                onPress={() => setSelectedProject(proj)}
                style={({ pressed }) => [
                  styles.projectCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                ]}
              >

                {/* Top Row: Icon Box + Title/Subtitle + Trash */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Ionicons name="briefcase-outline" size={24} color={theme.text} />
                  </View>

                  <View style={styles.titleBlock}>
                    <Text style={[styles.projectTitle, { color: theme.text }]} numberOfLines={1}>{proj.title}</Text>
                    <View style={styles.partiesRow}>
                      <Ionicons name="person-outline" size={12} color={theme.textSecondary} />
                      <Text style={[styles.partyText, { color: theme.textSecondary }]}>{proj.client}</Text>
                      <Ionicons name="arrow-forward" size={10} color={theme.textSecondary} style={{ marginHorizontal: 4 }} />
                      <Ionicons name="brush-outline" size={12} color={theme.textSecondary} />
                      <Text style={[styles.partyText, { color: theme.textSecondary }]}>{proj.creator}</Text>
                    </View>
                  </View>

                  <Pressable
                    hitSlop={10}
                    onPress={async () => {
                      try {
                        await deleteOrder(proj.id);
                        await loadProjects();
                      } catch (err: any) {
                        alert(err?.message || `Failed to remove project ${proj.id}`);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>

                {/* Middle Row: Badge + Price */}
                <View style={styles.cardMiddleRow}>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Ionicons name={getStatusIcon(proj.status) as any} size={12} color={colors.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: colors.text }]}>{proj.status}</Text>
                  </View>
                  <Text style={[styles.priceText, { color: theme.text }]}>₱ {proj.budget.toLocaleString()}</Text>
                </View>

                {/* Admin Info Box */}
                <View style={[styles.adminStatsBox, { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: theme.cardBorder }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Deadline</Text>
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>{proj.deadline}</Text>
                  </View>
                  <View style={[styles.statsRow, { borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 8, marginTop: 8 }]}>
                    <View style={styles.statItem}>
                      <Ionicons name="cash-outline" size={14} color={'#10b981'} />
                      <Text style={[styles.statLabel, { color: '#10b981' }]}>Platform Fee (15%)</Text>
                    </View>
                    <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '700' }}>₱{fee.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Bottom Actions Row */}
                <View style={styles.cardBottomRow}>
                  <Pressable style={[styles.iconButton, { borderColor: theme.cardBorder }]} onPress={() => alert('View Workroom messages')}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.text} />
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      try {
                        await updateOrderStatus(proj.id, 'cancelled');
                        await loadProjects();
                      } catch (err: any) {
                        alert(err?.message || 'Failed to suspend project');
                      }
                    }}
                    style={[styles.suspendBtn, { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                  >
                    <Ionicons name="ban-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                    <Text style={styles.suspendBtnText}>Force Suspend</Text>
                  </Pressable>
                </View>

              </Pressable>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Admin Project Modal */}
      <Modal visible={!!selectedProject} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedProject(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Project Details</Text>
            <Pressable onPress={() => setSelectedProject(null)} hitSlop={10}>
              <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </Pressable>
          </View>

          {selectedProject && (
            <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
              {/* Hero Header */}
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text, flex: 1, marginRight: 16 }}>{selectedProject.title}</Text>
                  <View style={[styles.badge, { backgroundColor: getStatusColor(selectedProject.status).bg }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(selectedProject.status).text }]}>{selectedProject.status}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 22 }}>{selectedProject.description}</Text>
              </View>

              {/* Financial Box */}
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.cardBorder }}>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 4 }}>Total Escrow Volume</Text>
                <Text style={{ color: theme.text, fontSize: 28, fontWeight: '800', marginBottom: 16 }}>₱{selectedProject.budget.toLocaleString()}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 12 }}>
                  <Text style={{ color: theme.textSecondary }}>Projected Fee (15%)</Text>
                  <Text style={{ color: '#10b981', fontWeight: '700' }}>₱{(selectedProject.budget * 0.15).toLocaleString()}</Text>
                </View>
              </View>

              {/* Parties Box */}
              <View style={{ gap: 12 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>Involved Parties</Text>
                <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.cardBorder, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name="person-circle" size={32} color="#3b82f6" />
                      <View>
                        <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedProject.client}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Client</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.cardBorder} />
                  </View>
                  <View style={{ height: 1, backgroundColor: theme.cardBorder }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name="brush" size={30} color="#a78bfa" />
                      <View>
                        <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedProject.creator}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Creator</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.cardBorder} />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 12 }}>
                <Pressable
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.tint }, pressed && { opacity: 0.8 }]}
                  onPress={() => alert('View Workroom History')}
                >
                  <Ionicons name="eye-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Audit Workroom Logs</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ef4444' }, pressed && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                  onPress={async () => {
                    try {
                      await updateOrderStatus(selectedProject.id, 'cancelled');
                      setSelectedProject(null);
                      await loadProjects();
                    } catch (err: any) {
                      alert(err?.message || 'Failed to terminate project');
                    }
                  }}
                >
                  <Ionicons name="flame-outline" size={20} color="#ef4444" />
                  <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Terminate & Refund</Text>
                </Pressable>
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
  projectCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    ...Shadows.md,

  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    paddingTop: 2,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  partiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partyText: {
    fontSize: 13,
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
  },
  adminStatsBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardBottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suspendBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suspendBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
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
