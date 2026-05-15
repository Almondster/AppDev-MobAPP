import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Modal, SafeAreaView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadows } from '../../constants/theme';
import { escalateDispute, fetchDisputes, fetchOrders, resolveDispute } from '@/frontend/api';

export default function AdminDisputesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Interactivity States
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const [disputeRes, orderRes] = await Promise.all([
        fetchDisputes(),
        fetchOrders().catch(() => []),
      ]);
      const rows = disputeRes?.results || disputeRes || [];
      const orders = orderRes?.results || orderRes || [];
      const ordersById = new Map<string, any>(orders.map((order: any) => [String(order.id), order]));

      setDisputes(rows.map((row: any) => {
        const order = ordersById.get(String(row.order_id)) || {};
        return {
          raw: row,
          id: row.id,
          displayId: `DSP-${row.id}`,
          orderId: row.order_id,
          status: String(row.status || 'open').replace(/_/g, ' ').toUpperCase(),
          date: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Unknown',
          price: Number(order.price || row.refund_amount || 0).toLocaleString(),
          client: order.client_name || `Client #${order.client_id || '-'}`,
          creator: order.creator_name || `Creator #${order.creator_id || '-'}`,
          issue: row.reason || row.dispute_type || 'No reason provided',
          disputeType: String(row.dispute_type || 'other').replace(/_/g, ' '),
        };
      }));
    } catch (err) {
      console.error('Failed to load disputes:', err);
      setDisputes([]);
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

    loadDisputes();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={[styles.mainHeaderCard, { backgroundColor: theme.card }]}>
        <View style={[styles.mainHeaderContent, { paddingTop: Math.max(insets.top + 16, 60) }]}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Active Disputes</Text>
          <View style={[styles.disputeCountBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Text style={styles.disputeCountText}>{disputes.length}</Text>
          </View>
        </View>
      </View>

      {/* Disputes List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {loading ? (
          // Skeleton Loading State
          Array.from({ length: 3 }).map((_, i) => (
            <Animated.View key={`skel-${i}`} style={[styles.disputeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, opacity: pulseAnim }]}>
              <View style={styles.cardHeader}>
                <View style={{ width: 100, height: 18, backgroundColor: theme.cardBorder, borderRadius: 4 }} />
                <View style={{ width: 80, height: 20, backgroundColor: theme.cardBorder, borderRadius: 4 }} />
              </View>
              <View style={{ width: 120, height: 12, backgroundColor: theme.cardBorder, borderRadius: 4, marginBottom: 16 }} />
              <View style={[styles.dataBox, { backgroundColor: theme.cardBorder, opacity: 0.3, height: 120 }]} />
              <View style={[styles.actionsContainer, { opacity: 0.3 }]}>
                <View style={{ height: 44, backgroundColor: theme.cardBorder, borderRadius: 14 }} />
              </View>
            </Animated.View>
          ))
        ) : (
          disputes.map((dispute) => {
            return (
              <Pressable
                key={dispute.id}
                onPress={() => setSelectedDispute(dispute)}
                style={({ pressed }) => [
                  styles.disputeCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder, borderLeftColor: '#ef4444' },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                ]}
              >

                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={[styles.disputeId, { color: theme.text }]}>{dispute.displayId}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{dispute.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.priceText, { color: theme.text }]}>₱{dispute.price}</Text>
                </View>

                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} />
                  <Text style={[styles.dateText, { color: theme.textSecondary }]}>Filed on {dispute.date}</Text>
                </View>

                {/* Data Box Context */}
                <View style={[styles.dataBox, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: theme.cardBorder }]}>

                  {/* Client / Creator Row */}
                  <View style={styles.partiesRow}>
                    <View style={styles.partyCol}>
                      <Text style={styles.dataLabel}>CLIENT</Text>
                      <View style={styles.partyNameRow}>
                        <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.partyName, { color: theme.text }]} numberOfLines={1}>{dispute.client}</Text>
                      </View>
                    </View>
                    <View style={styles.partySeparator}>
                      <Ionicons name="swap-horizontal" size={16} color={theme.textSecondary} />
                    </View>
                    <View style={styles.partyCol}>
                      <Text style={styles.dataLabel}>CREATOR</Text>
                      <View style={styles.partyNameRow}>
                        <Ionicons name="brush-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.partyName, { color: theme.text }]} numberOfLines={1}>{dispute.creator}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Issue Context */}
                  <View style={[styles.issueBlock, { borderTopColor: theme.cardBorder }]}>
                    <Text style={styles.dataLabel}>REPORTED ISSUE</Text>
                    <Text style={[styles.issueDesc, { color: theme.textSecondary }]}>
                      {dispute.issue}
                    </Text>
                  </View>

                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>

                  {/* Primary Action */}
                  <Pressable
                    style={styles.actionReviewBlock}
                    onPress={async (e) => {
                      e.stopPropagation();
                      try {
                        await escalateDispute(dispute.id);
                        await loadDisputes();
                      } catch (err: any) {
                        alert(err?.message || 'Failed to move dispute under review');
                      }
                    }}
                  >
                    <Ionicons name="scale-outline" size={18} color="#fff" />
                    <Text style={styles.actionReviewText}>Review Evidence</Text>
                  </Pressable>

                  {/* Secondary Actions Row */}
                  <View style={styles.actionsSubRow}>
                    <Pressable style={[styles.actionBtnOutline, { borderColor: theme.cardBorder }]} onPress={(e) => { e.stopPropagation(); alert('Message Parties'); }}>
                      <Ionicons name="chatbubbles-outline" size={16} color={theme.text} />
                      <Text style={[styles.actionBtnOutlineText, { color: theme.text }]}>Message</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionBtnOutline, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}
                      onPress={async (e) => {
                        e.stopPropagation();
                        try {
                          await resolveDispute(dispute.id, {
                            status: 'resolved',
                            resolution: 'refund_denied',
                            admin_notes: 'Resolved from mobile admin panel',
                          });
                          await loadDisputes();
                        } catch (err: any) {
                          alert(err?.message || 'Failed to resolve dispute');
                        }
                      }}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                      <Text style={[styles.actionBtnOutlineText, { color: '#10b981' }]}>Resolve</Text>
                    </Pressable>
                  </View>

                </View>

              </Pressable>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Escrow Bar */}
      <View style={[styles.bottomEscrowContainer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
        <View style={styles.bottomEscrowInner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.escrowIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Ionicons name="shield-outline" size={18} color="#ef4444" />
            </View>
            <Text style={[styles.bottomEscrowLabel, { color: theme.textSecondary }]}>Total Escrow</Text>
          </View>
          <Text style={[styles.bottomEscrowValue, { color: theme.text }]}>
            ₱{disputes.reduce((total, dispute) => total + Number(String(dispute.price).replace(/,/g, '') || 0), 0).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Admin Dispute Modal */}
      <Modal visible={!!selectedDispute} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedDispute(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Dispute Details</Text>
            <Pressable onPress={() => setSelectedDispute(null)} hitSlop={10}>
              <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </Pressable>
          </View>

          {selectedDispute && (
            <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
              {/* Hero Header */}
              <View style={{ gap: 8, alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="warning" size={40} color="#ef4444" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text }}>{selectedDispute.displayId}</Text>
                <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }]}>
                  <Text style={[styles.badgeText, { color: '#ef4444', fontSize: 13 }]}>{selectedDispute.status}</Text>
                </View>
                <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8 }}>Total Frozen Escrow: <Text style={{ fontWeight: '700', color: theme.text }}>₱{selectedDispute.price}</Text></Text>
              </View>

              {/* Issue Description */}
              <View style={{ gap: 12 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>Core Issue</Text>
                <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderLeftWidth: 4, borderColor: 'rgba(234, 179, 8, 0.2)', borderLeftColor: '#eab308' }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 22 }}>"{selectedDispute.issue}"</Text>
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
                        <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedDispute.client}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Client</Text>
                      </View>
                    </View>
                    <Pressable style={({ pressed }) => [{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.tint }, pressed && { backgroundColor: theme.tint }]} onPress={() => alert('Message Client')}>
                      <Text style={{ color: theme.tint, fontSize: 12, fontWeight: '700' }}>Message</Text>
                    </Pressable>
                  </View>

                  <View style={{ height: 1, backgroundColor: theme.cardBorder }} />

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name="brush" size={30} color="#a78bfa" />
                      <View>
                        <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedDispute.creator}</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Creator</Text>
                      </View>
                    </View>
                    <Pressable style={({ pressed }) => [{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.tint }, pressed && { backgroundColor: theme.tint }]} onPress={() => alert('Message Creator')}>
                      <Text style={{ color: theme.tint, fontSize: 12, fontWeight: '700' }}>Message</Text>
                    </Pressable>
                  </View>

                </View>
              </View>

              {/* Resolution Area */}
              <View style={{ gap: 12, marginTop: 12 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>Resolution Actions</Text>

                <Pressable
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: '#10b981' }, pressed && { opacity: 0.8 }]}
                  onPress={async () => {
                    try {
                      await resolveDispute(selectedDispute.id, {
                        status: 'resolved',
                        resolution: 'refund_denied',
                        admin_notes: 'Resolved for creator from mobile admin panel',
                      });
                      setSelectedDispute(null);
                      await loadDisputes();
                    } catch (err: any) {
                      alert(err?.message || 'Failed to resolve dispute');
                    }
                  }}
                >
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Resolve for Creator (Release Funds)</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: '#3b82f6' }, pressed && { opacity: 0.8 }]}
                  onPress={async () => {
                    try {
                      await resolveDispute(selectedDispute.id, {
                        status: 'resolved',
                        resolution: 'refund_approved',
                        admin_notes: 'Resolved for client from mobile admin panel',
                      });
                      setSelectedDispute(null);
                      await loadDisputes();
                    } catch (err: any) {
                      alert(err?.message || 'Failed to resolve dispute');
                    }
                  }}
                >
                  <Ionicons name="arrow-undo" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Resolve for Client (Refund Escrow)</Text>
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
  disputeCountBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disputeCountText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '800',
  },
  bottomEscrowContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 18,
    paddingBottom: 28,
  },
  bottomEscrowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  escrowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomEscrowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomEscrowValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  disputeCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderLeftWidth: 4,
    ...Shadows.md,

  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disputeId: {
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
  },
  dataBox: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  partiesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  partyCol: {
    flex: 1,
  },
  partySeparator: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  partyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
  },
  issueBlock: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  issueDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  actionReviewBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionReviewText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionsSubRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
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
