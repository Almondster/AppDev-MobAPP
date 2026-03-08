/**
 * Refund Response Modal
 * Modal for creators to approve or deny client refund requests
 */

import { useTheme } from '@/context/ThemeContext';
import { calculateEscrowAmount, EnhancedOrder } from '@/utils/orderHelpers';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface RefundResponseModalProps {
  visible: boolean;
  order: EnhancedOrder;
  onClose: () => void;
  onSubmit: (approve: boolean, response: string) => Promise<void>;
}

export const RefundResponseModal: React.FC<RefundResponseModalProps> = ({ visible, order, onClose, onSubmit }) => {
  const { theme, isDark } = useTheme();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'approve' | 'deny' | null>(null);

  const escrowAmount = calculateEscrowAmount(order.price);

  const handleSubmit = async (approve: boolean) => {
    if (response.trim().length < 10) {
      setError('Please provide a response (at least 10 characters)');
      return;
    }

    setLoading(true);
    setError('');
    setAction(approve ? 'approve' : 'deny');

    try {
      await onSubmit(approve, response.trim());
      // Reset form
      setResponse('');
      setAction(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setResponse('');
      setError('');
      setAction(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.modal, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Ionicons name="alert-circle-outline" size={24} color="#F59E0B" />
            <Text style={[styles.title, { color: theme.text }]}>Refund Request</Text>
            <Pressable onPress={handleClose} style={styles.closeButton} disabled={loading}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.warningBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF7ED', borderColor: isDark ? '#F59E0B' : '#FED7AA' }]}>
            <Ionicons name="cash-outline" size={20} color="#F59E0B" />
            <Text style={[styles.warningText, { color: isDark ? '#FCD34D' : '#B45309' }]}>
              Client requested refund of ₱{escrowAmount.toLocaleString()} due to missed deadline.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Options:</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  <Text style={{ fontWeight: '600' }}>Approve:</Text> Accept the refund if you cannot deliver the work
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  <Text style={{ fontWeight: '600' }}>Deny:</Text> Only if you have already delivered or can deliver immediately
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="information-circle" size={16} color={theme.tint} />
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  If you deny without valid delivery, the refund may be processed automatically
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Your Response</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.background, borderColor: theme.cardBorder, color: theme.text }]}
              value={response}
              onChangeText={(text) => {
                setResponse(text);
                setError('');
              }}
              placeholder="Explain your decision to the client..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={200}
              editable={!loading}
            />
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>{response.length}/200</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', borderColor: '#10B981' },
                (response.trim().length < 10 || loading) && styles.disabledButton,
              ]}
              onPress={() => handleSubmit(true)}
              disabled={response.trim().length < 10 || loading}
            >
              {loading && action === 'approve' ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Approve Refund</Text>
                </>
              )}
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', borderColor: '#EF4444' },
                (response.trim().length < 10 || loading) && styles.disabledButton,
              ]}
              onPress={() => handleSubmit(false)}
              disabled={response.trim().length < 10 || loading}
            >
              {loading && action === 'deny' ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                  <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Deny Refund</Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  infoSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 12,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default RefundResponseModal;
