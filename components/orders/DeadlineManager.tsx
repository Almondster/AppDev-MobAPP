/**
 * Deadline Manager Component
 * Main UI for deadline warnings, extension requests, and deadline actions
 */

import { useTheme } from '@/context/ThemeContext';
import { formatDeadline, getDeadlineUrgency, isDeadlinePassed } from '@/utils/deadlineCalculations';
import { canRequestExtension, canRequestRefund, EnhancedOrder } from '@/utils/orderHelpers';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DeadlineCountdown } from './DeadlineCountdown';

interface DeadlineManagerProps {
  order: EnhancedOrder;
  userRole: 'client' | 'creator';
  onRequestExtension?: () => void;
  onReviewExtension?: () => void;
  onRequestRefund?: () => void;
  onRespondToRefund?: () => void;
  onOpenChat?: () => void;
}

export const DeadlineManager: React.FC<DeadlineManagerProps> = ({
  order,
  userRole,
  onRequestExtension,
  onReviewExtension,
  onRequestRefund,
  onRespondToRefund,
  onOpenChat,
}) => {
  const { theme, isDark } = useTheme();

  if (!order.due_date) {
    return null;
  }

  const urgency = getDeadlineUrgency(order.due_date);
  const passed = isDeadlinePassed(order.due_date);
  const formattedDeadline = formatDeadline(order.due_date);
  
  const showExtensionRequest = canRequestExtension(order, userRole);
  const showRefundRequest = canRequestRefund(order, userRole);
  const hasPendingExtension = order.deadline_extension_requested_at && !order.deadline_extension_approved;

  // Extension approved banner
  if (order.deadline_extension_approved && order.deadline_extension_days) {
    // deadline_extension_days is stored as total minutes (integer)
    const totalMinutes = order.deadline_extension_days;
    const days = Math.floor(totalMinutes / 1440);
    const remainingMinutes = totalMinutes % 1440;
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    let timeText = '';
    if (days > 0) timeText += `${days}d `;
    if (hours > 0) timeText += `${hours}h `;
    if (minutes > 0) timeText += `${minutes}m`;
    if (!timeText) timeText = '0m';
    
    return (
      <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={[styles.headerText, { color: theme.text }]}>
            Extension Approved
          </Text>
        </View>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          +{timeText.trim()} added. New deadline: {formattedDeadline}
        </Text>
        <DeadlineCountdown dueDate={order.due_date} />
      </View>
    );
  }

  // Pending extension request
  if (hasPendingExtension) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.header}>
          <Ionicons name="hourglass" size={20} color="#F59E0B" />
          <Text style={[styles.headerText, { color: theme.text }]}>
            Extension Request Pending
          </Text>
        </View>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {userRole === 'creator' 
            ? 'Waiting for client to review your extension request.' 
            : 'The creator has requested more time to complete this order.'}
        </Text>
        {userRole === 'client' && onReviewExtension && (
          <Pressable style={[styles.actionButton, { backgroundColor: theme.tint }]} onPress={onReviewExtension}>
            <Ionicons name="document-text-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Review Request</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Refund denied - creator must deliver within 24h
  if (order.refund_requested_at && order.refund_approved === false) {
    // Check if 24h have passed since creator denied - client can request again
    const canRequestAgain = order.refund_responded_at 
      ? (new Date().getTime() - new Date(order.refund_responded_at).getTime() > 24 * 60 * 60 * 1000)
      : false;

    if (canRequestAgain && userRole === 'client' && showRefundRequest) {
      // Show deadline passed UI with refund request button (client can request again)
      return (
        <View style={[styles.container, { backgroundColor: isDark ? '#3F1F1F' : '#FEF2F2', borderColor: '#EF4444' }]}>
          <View style={styles.header}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={[styles.headerText, { color: '#EF4444' }]}>
              Creator Didn't Deliver
            </Text>
          </View>
          <Text style={[styles.message, { color: theme.text }]}>
            24 hours have passed since the creator denied your refund request without delivering the work. You can request a refund again, and it will be processed automatically.
          </Text>
          <View style={styles.actions}>
            {onOpenChat && (
              <Pressable 
                style={[styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} 
                onPress={onOpenChat}
              >
                <Ionicons name="chatbubble-outline" size={16} color={theme.text} />
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Chat Creator</Text>
              </Pressable>
            )}
            {onRequestRefund && (
              <Pressable style={[styles.actionButton, { backgroundColor: '#EF4444' }]} onPress={onRequestRefund}>
                <Ionicons name="cash-outline" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Request Refund</Text>
              </Pressable>
            )}
          </View>
        </View>
      );
    }

    // Still within 24h window after denial
    return (
      <View style={[styles.container, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF', borderColor: '#8B5CF6' }]}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
          <Text style={[styles.headerText, { color: '#8B5CF6' }]}>
            Refund Request Denied
          </Text>
        </View>
        <Text style={[styles.message, { color: theme.text }]}>
          {userRole === 'client'
            ? 'The creator has declined your refund request and will deliver the work within 24 hours. If not delivered on time, you can request a refund again and it will be automatically processed.'
            : 'You denied the refund request. You have 24 hours to deliver the work. If you cannot deliver within 24 hours, consider requesting an extension.'}
        </Text>
        <View style={styles.actions}>
          {onOpenChat && (
            <Pressable 
              style={[styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} 
              onPress={onOpenChat}
            >
              <Ionicons name="chatbubble-outline" size={16} color={theme.text} />
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Chat {userRole === 'client' ? 'Creator' : 'Client'}</Text>
            </Pressable>
          )}
          {userRole === 'creator' && showExtensionRequest && onRequestExtension && (
            <Pressable style={[styles.actionButton, { backgroundColor: theme.tint, borderColor: theme.cardBorder }]} onPress={onRequestExtension}>
              <Ionicons name="time-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Extension</Text>
            </Pressable>
          )}
        </View>
        {order.refund_responded_at && (
          <DeadlineCountdown dueDate={new Date(new Date(order.refund_responded_at).getTime() + 24 * 60 * 60 * 1000).toISOString()} />
        )}
      </View>
    );
  }

  // Refund requested - waiting for creator response
  if (order.refund_requested_at && order.refund_approved === null) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF7ED', borderColor: '#F59E0B' }]}>
        <View style={styles.header}>
          <Ionicons name="time" size={20} color="#F59E0B" />
          <Text style={[styles.headerText, { color: '#F59E0B' }]}>
            Refund Request Pending
          </Text>
        </View>
        <Text style={[styles.message, { color: theme.text }]}>
          {userRole === 'client'
            ? 'Your refund request is being reviewed. The creator has 24 hours to deliver the work or approve the refund.'
            : 'The client has requested a refund. You have 24 hours to deliver the work or the refund will be processed automatically.'}
        </Text>
        <View style={styles.actions}>
          {onOpenChat && (
            <Pressable 
              style={[styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} 
              onPress={onOpenChat}
            >
              <Ionicons name="chatbubble-outline" size={16} color={theme.text} />
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Contact {userRole === 'client' ? 'Creator' : 'Client'}</Text>
            </Pressable>
          )}
          {userRole === 'creator' && onRespondToRefund && (
            <Pressable style={[styles.actionButton, { backgroundColor: '#F59E0B' }]} onPress={onRespondToRefund}>
              <Ionicons name="document-text-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Respond</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // Deadline passed - show refund option
  if (passed && showRefundRequest) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#3F1F1F' : '#FEF2F2', borderColor: '#EF4444' }]}>
        <View style={styles.header}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={[styles.headerText, { color: '#EF4444' }]}>
            Deadline Passed
          </Text>
        </View>
        <Text style={[styles.message, { color: theme.text }]}>
          The deadline for this order has been exceeded. You can request a refund or contact the creator.
        </Text>
        <View style={styles.actions}>
          {onOpenChat && (
            <Pressable 
              style={[styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} 
              onPress={onOpenChat}
            >
              <Ionicons name="chatbubble-outline" size={16} color={theme.text} />
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Chat First</Text>
            </Pressable>
          )}
          {onRequestRefund && (
            <Pressable style={[styles.actionButton, { backgroundColor: '#EF4444' }]} onPress={onRequestRefund}>
              <Ionicons name="cash-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Request Refund</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // Deadline approaching - show warning
  if ((urgency === 'warning' || urgency === 'critical') && !passed) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card, borderColor: urgency === 'critical' ? '#F59E0B' : theme.cardBorder }]}>
        <View style={styles.header}>
          <Ionicons 
            name={urgency === 'critical' ? 'warning' : 'time'} 
            size={20} 
            color={urgency === 'critical' ? '#F59E0B' : '#3B82F6'} 
          />
          <Text style={[styles.headerText, { color: theme.text }]}>
            {urgency === 'critical' ? 'Deadline Critical' : 'Deadline Approaching'}
          </Text>
        </View>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {userRole === 'client' 
            ? `Delivery expected by ${formattedDeadline}` 
            : `Please deliver by ${formattedDeadline}`}
        </Text>
        <View style={styles.deadlineRow}>
          <DeadlineCountdown dueDate={order.due_date} />
          {showExtensionRequest && onRequestExtension && (
            <Pressable 
              style={[styles.smallButton, { borderColor: theme.cardBorder }]} 
              onPress={onRequestExtension}
            >
              <Ionicons name="add-circle-outline" size={14} color={theme.tint} />
              <Text style={[styles.smallButtonText, { color: theme.tint }]}>Request Extension</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // Default - show countdown and extension button (if applicable)
  return (
    <View style={[styles.container, styles.compactContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.deadlineRow}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Due:</Text>
        <DeadlineCountdown dueDate={order.due_date} compact />
        {showExtensionRequest && onRequestExtension && (
          <Pressable 
            style={[styles.smallButton, { borderColor: theme.cardBorder }]} 
            onPress={onRequestExtension}
          >
            <Ionicons name="add-circle-outline" size={14} color={theme.tint} />
            <Text style={[styles.smallButtonText, { color: theme.tint }]}>Request Extension</Text>
          </Pressable>
        )}
      </View>
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
  compactContainer: {
    padding: 8,
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  smallButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default DeadlineManager;
