/**
 * Refund Request Modal
 * Modal for clients to request refunds when deadline passed without delivery
 */

import { useTheme } from '@/context/ThemeContext';
import { calculateEscrowAmount, EnhancedOrder } from '@/utils/orderHelpers';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface RefundRequestModalProps {
  visible: boolean;
  order: EnhancedOrder;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export const RefundRequestModal: React.FC<RefundRequestModalProps> = ({ visible, order, onClose, onSubmit }) => {
  const { theme, isDark } = useTheme();
  const [reason, setReason] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const escrowAmount = calculateEscrowAmount(order.price);

  const handleSubmit = async () => {
    if (!understood) {
      setError('Please confirm you understand the terms');
      return;
    }

    if (reason.trim().length < 20) {
      setError('Please provide a detailed reason (at least 20 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(reason.trim());
      // Reset form
      setReason('');
      setUnderstood(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit refund request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setUnderstood(false);
      setError('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.modal, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Ionicons name="cash-outline" size={24} color="#EF4444" />
            <Text style={[styles.title, { color: theme.text }]}>Request Refund</Text>
            <Pressable onPress={handleClose} style={styles.closeButton} disabled={loading}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.warningBox, { backgroundColor: isDark ? '#3F1F1F' : '#FEF2F2', borderColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={[styles.warningText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
              You are requesting a refund of ₱{escrowAmount.toLocaleString()} because the deadline has passed without
              delivery.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Important Information:</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.tint} />
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  The creator will be notified and has 24 hours to deliver the work
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.tint} />
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  If work is delivered within 24h, you&apos;ll review it before refund approval
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.tint} />
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  If no delivery after 24h, refund will be processed automatically
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.tint} />
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  Consider chatting with the creator first to resolve any issues
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Reason for Refund Request</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.background, borderColor: theme.cardBorder, color: theme.text }]}
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                setError('');
              }}
              placeholder="Explain why you need a refund..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={5}
              maxLength={300}
              editable={!loading}
            />
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>{reason.length}/300</Text>
          </View>

          <Pressable
            style={styles.checkboxRow}
            onPress={() => {
              setUnderstood(!understood);
              setError('');
            }}
            disabled={loading}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: theme.cardBorder },
                understood && { backgroundColor: theme.tint, borderColor: theme.tint },
              ]}
            >
              {understood && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={[styles.checkboxText, { color: theme.textSecondary }]}>
              I understand the refund process and have considered chatting with the creator first
            </Text>
          </Pressable>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelButton, { borderColor: theme.cardBorder }]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: '#EF4444' },
                (!understood || reason.trim().length < 20 || loading) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!understood || reason.trim().length < 20 || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Request Refund</Text>
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default RefundRequestModal;
