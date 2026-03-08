/**
 * Extension Request Modal
 * Modal for CREATORS to request deadline extensions from clients
 */

import { useTheme } from '@/context/ThemeContext';
import { calculateExtendedDeadline, formatDeadline } from '@/utils/deadlineCalculations';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface ExtensionRequestModalProps {
  visible: boolean;
  currentDueDate: string;
  onClose: () => void;
  onSubmit: (days: number, hours: number, minutes: number, reason: string) => Promise<void>;
}

export const ExtensionRequestModal: React.FC<ExtensionRequestModalProps> = ({
  visible,
  currentDueDate,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const daysNum = parseInt(days, 10) || 0;
  const hoursNum = parseInt(hours, 10) || 0;
  const minutesNum = parseInt(minutes, 10) || 0;
  const hasValidTime = (daysNum > 0 || hoursNum > 0 || minutesNum > 0) && 
                        daysNum >= 0 && daysNum <= 60 && 
                        hoursNum >= 0 && hoursNum <= 23 && 
                        minutesNum >= 0 && minutesNum <= 59;
  const newDeadline = hasValidTime ? calculateExtendedDeadline(currentDueDate, daysNum, hoursNum, minutesNum) : null;

  const handleSubmit = async () => {
    if (!hasValidTime) {
      setError('Please enter valid time (days: 0-60, hours: 0-23, minutes: 0-59)');
      return;
    }

    if (daysNum === 0 && hoursNum === 0 && minutesNum === 0) {
      setError('Extension must be at least 1 minute');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Please provide a reason (at least 10 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(daysNum, hoursNum, minutesNum, reason.trim());
      // Reset form
      setDays('');
      setHours('');
      setMinutes('');
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setDays('');
      setHours('');
      setMinutes('');
      setReason('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.modal, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Ionicons name="time-outline" size={24} color={theme.tint} />
            <Text style={[styles.title, { color: theme.text }]}>Request Extension</Text>
            <Pressable onPress={handleClose} style={styles.closeButton} disabled={loading}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Request more time to complete this order. The client will review your request and decide whether to approve it.
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Extension Time</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }]}>Days</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.cardBorder, color: theme.text }]}
                  value={days}
                  onChangeText={(text) => {
                    setDays(text);
                    setError('');
                  }}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!loading}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }]}>Hours</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.cardBorder, color: theme.text }]}
                  value={hours}
                  onChangeText={(text) => {
                    setHours(text);
                    setError('');
                  }}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!loading}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }]}>Min</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, borderColor: theme.cardBorder, color: theme.text }]}
                  value={minutes}
                  onChangeText={(text) => {
                    setMinutes(text);
                    setError('');
                  }}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!loading}
                />
              </View>
            </View>
            {hasValidTime && newDeadline && (
              <View style={styles.previewRow}>
                <Ionicons name="calendar-outline" size={14} color="#10B981" />
                <Text style={[styles.previewText, { color: '#10B981' }]}>
                  New deadline: {formatDeadline(newDeadline)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Reason for Extension</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.background, borderColor: theme.cardBorder, color: theme.text }]}
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                setError('');
              }}
              placeholder="Explain why you need more time..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={200}
              editable={!loading}
            />
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>{reason.length}/200</Text>
          </View>

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
                { backgroundColor: theme.tint },
                (!hasValidTime || reason.trim().length < 10 || loading) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!hasValidTime || reason.trim().length < 10 || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
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
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
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
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '500',
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

export default ExtensionRequestModal;
