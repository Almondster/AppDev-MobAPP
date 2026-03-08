/**
 * Escrow Manager Component
 * Display escrow status and payment protection information
 */

import { useTheme } from '@/context/ThemeContext';
import { calculateEscrowAmount, EnhancedOrder, getEscrowStatusText } from '@/utils/orderHelpers';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EscrowManagerProps {
  order: EnhancedOrder;
  userRole: 'client' | 'creator';
}

export const EscrowManager: React.FC<EscrowManagerProps> = ({ order, userRole }) => {
  const { theme } = useTheme();

  if (!order.escrow_status || order.escrow_status === 'pending') {
    return null;
  }

  const escrowAmount = calculateEscrowAmount(order.price);
  const statusText = getEscrowStatusText(order.escrow_status);
  const getColor = (status: string) => {
    switch (status) {
      case 'held': return '#F59E0B';
      case 'released_to_creator': return '#10B981';
      case 'refunded_to_client': return '#8B5CF6';
      default: return '#64748B';
    }
  };
  const statusColor = getColor(order.escrow_status);

  const getIcon = () => {
    switch (order.escrow_status) {
      case 'held':
        return 'shield-checkmark';
      case 'released_to_creator':
        return 'checkmark-circle';
      case 'refunded_to_client':
        return 'arrow-undo-circle';
      default:
        return 'shield-outline';
    }
  };

  const getMessage = () => {
    if (userRole === 'client') {
      switch (order.escrow_status) {
        case 'held':
          return `₱${escrowAmount.toLocaleString()} securely held. Will be released upon delivery approval.`;
        case 'released_to_creator':
          return `Payment of ₱${escrowAmount.toLocaleString()} released to creator.`;
        case 'refunded_to_client':
          return `₱${escrowAmount.toLocaleString()} refunded to your account.`;
        default:
          return statusText;
      }
    } else {
      // Creator view
      switch (order.escrow_status) {
        case 'held':
          return `Payment secured in escrow. Complete the order to receive ₱${escrowAmount.toLocaleString()}.`;
        case 'released_to_creator':
          return `You received ₱${escrowAmount.toLocaleString()}.`;
        case 'refunded_to_client':
          return 'Payment refunded to client.';
        default:
          return statusText;
      }
    }
  };

  const showSecurityNote = order.escrow_status === 'held';

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.header}>
        <Ionicons name={getIcon()} size={20} color={statusColor} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>

      <Text style={[styles.message, { color: theme.textSecondary }]}>{getMessage()}</Text>

      {showSecurityNote && (
        <View style={[styles.securityNote, { backgroundColor: theme.background }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.tint} />
          <Text style={[styles.securityText, { color: theme.textSecondary }]}>
            {userRole === 'client'
              ? 'Your payment is protected. Release only when satisfied with the delivery.'
              : 'Payment is held safely. Client will release upon delivery approval.'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default EscrowManager;
