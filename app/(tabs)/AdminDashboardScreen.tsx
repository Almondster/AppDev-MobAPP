import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Shadows } from '../../constants/theme';
import { fetchAdminStats } from '@/frontend/api';

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const [liveStats, setLiveStats] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    fetchAdminStats()
      .then((data) => {
        if (mounted) setLiveStats(data || {});
      })
      .catch((err) => console.error('Failed to load admin stats:', err));
    return () => {
      mounted = false;
    };
  }, []);

  const stats = {
    totalUsers: '1,245',
    platformRevenue: '₱124,500',
    activeDisputes: '2',
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Hero Header Block */}
      <View style={[styles.heroCard, { backgroundColor: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.15)' }]}>
        <View style={styles.heroHeader}>
          <View style={[styles.heroIconCircle, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#f43f5e" />
          </View>
          <View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Admin Command</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Platform overview & health
            </Text>
          </View>
        </View>
      </View>

      {/* Primary KPI Cards Grid */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
            <Ionicons name="people" size={22} color="#f43f5e" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TOTAL USERS</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {liveStats ? Number(liveStats.total_users || 0).toLocaleString() : stats.totalUsers}
            </Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
            <Ionicons name="bar-chart" size={22} color="#a855f7" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>REVENUE</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {liveStats ? `₱${Number(liveStats.total_revenue || 0).toLocaleString()}` : stats.platformRevenue}
            </Text>
          </View>
        </View>
      </View>

      {/* Critical/Warning KPI Card */}
      <View style={[styles.disputeCard, { backgroundColor: theme.card, borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
          <Ionicons name="warning" size={22} color="#ef4444" />
        </View>
        <View style={styles.statContentDouble}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>ACTIVE DISPUTES</Text>
          <Text style={[styles.statValue, { color: '#f87171' }]}>
            {liveStats ? Number(liveStats.disputed_orders || 0).toLocaleString() : stats.activeDisputes}
          </Text>
        </View>
        <Pressable style={[styles.viewBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Text style={styles.viewBtnText}>View</Text>
          <Ionicons name="chevron-forward" size={14} color="#ef4444" />
        </Pressable>
      </View>

      {/* Platform Activity Alerts Section */}
      <View style={styles.alertsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Platform Activity</Text>
        
        <View style={styles.alertsList}>
          {(liveStats?.recent_orders || []).slice(0, 5).map((order: any) => (
            <View key={order.id} style={[styles.alertItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.alertHeaderRow}>
                <View style={[styles.smallIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Ionicons name="briefcase" size={16} color="#3b82f6" />
                </View>
                <View style={styles.alertTextContent}>
                  <Text style={[styles.alertTitle, { color: theme.text }]}>Order #{order.id}: {order.service_title}</Text>
                  <Text style={[styles.alertDesc, { color: theme.textSecondary }]}>
                    {order.client_name || 'Client'} → {order.creator_name || 'Creator'} · {String(order.status || 'pending').replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.alertTimeRow}>
                <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
                <Text style={[styles.alertTime, { color: theme.textSecondary }]}>
                  {order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent'}
                </Text>
              </View>
            </View>
          ))}

          {!liveStats && (
          <>
          {/* Actionable Dispute Alert */}
          <View style={[styles.alertItem, { backgroundColor: 'rgba(239, 68, 68, 0.04)', borderColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <View style={styles.alertHeaderRow}>
              <View style={[styles.smallIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="warning" size={16} color="#ef4444" />
              </View>
              <View style={styles.alertTextContent}>
                <Text style={[styles.alertTitle, { color: theme.text }]}>Dispute Raised: Order #ORD-789</Text>
                <Text style={[styles.alertDesc, { color: theme.textSecondary }]}>Client flagged an issue with recent delivery.</Text>
              </View>
            </View>
            <Pressable style={[styles.alertButton, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.alertButtonText}>Review Case</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </Pressable>
          </View>

          {/* Informational Alert */}
          <View style={[styles.alertItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.alertHeaderRow}>
              <View style={[styles.smallIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <Ionicons name="people" size={16} color="#a855f7" />
              </View>
              <View style={styles.alertTextContent}>
                <Text style={[styles.alertTitle, { color: theme.text }]}>Registration Spike</Text>
                <Text style={[styles.alertDesc, { color: theme.textSecondary }]}>Unusual volume of new Creator registrations (50+ in last hour).</Text>
              </View>
            </View>
            <View style={styles.alertTimeRow}>
              <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
              <Text style={[styles.alertTime, { color: theme.textSecondary }]}>1hr ago</Text>
            </View>
          </View>

          {/* Success Alert */}
          <View style={[styles.alertItem, { backgroundColor: 'rgba(16, 185, 129, 0.04)', borderColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <View style={styles.alertHeaderRow}>
              <View style={[styles.smallIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              </View>
              <View style={styles.alertTextContent}>
                <Text style={[styles.alertTitle, { color: theme.text }]}>Dispute Resolved: #DSP-8840</Text>
                <Text style={[styles.alertDesc, { color: theme.textSecondary }]}>Mediation completed. Funds released to creator.</Text>
              </View>
            </View>
            <View style={styles.alertTimeRow}>
              <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
              <Text style={[styles.alertTime, { color: theme.textSecondary }]}>3hr ago</Text>
            </View>
          </View>
          </>
          )}
        </View>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 14,
  },
  statCard: {
    flex: 1,
    flexDirection: 'column',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    ...Shadows.md,

  },
  disputeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 28,
    gap: 14,
    ...Shadows.md,
    shadowColor: '#ef4444',
  },
  statContent: {
    marginTop: 14,
  },
  statContentDouble: {
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  viewBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  alertsSection: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  alertsList: {
    gap: 14,
  },
  alertItem: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  smallIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTextContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 48,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  alertTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    marginLeft: 48,
  },
  alertTime: {
    fontSize: 12,
    fontWeight: '500',
  },
});
