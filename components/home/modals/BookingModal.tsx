import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Shadows } from '../../../constants/theme';

interface BookingModalProps {
  visible: boolean;
  type: 'success' | 'duplicate' | 'blocked' | 'ownService';
  creatorName?: string;
  onClose: () => void;
  onGoToOrders: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  type,
  creatorName,
  onClose,
  onGoToOrders,
}) => {
  const { theme } = useTheme();

  const modalConfig = {
    success: {
      icon: 'checkmark-circle' as const,
      iconColor: theme.tint,
      iconBg: theme.tint + '15',
      title: 'Request Sent!',
      description: `Your request has been sent to ${creatorName || 'the creator'}. They will review it shortly.`,
      buttonColor: theme.tint,
      buttonText: 'View My Orders',
      showSecondary: true,
    },
    duplicate: {
      icon: 'alert-circle-outline' as const,
      iconColor: '#f59e0b',
      iconBg: '#f59e0b15',
      title: 'Request Already Sent',
      description: 'You already have a pending request for this service. Please wait for the creator\'s response.',
      buttonColor: '#f59e0b',
      buttonText: 'View My Orders',
      showSecondary: true,
    },
    blocked: {
      icon: 'ban-outline' as const,
      iconColor: '#ef4444',
      iconBg: '#ef444415',
      title: 'Creator Blocked',
      description: 'You have blocked this creator. Unblock them to request their services.',
      buttonColor: '#ef4444',
      buttonText: 'View Profile to Unblock',
      showSecondary: false,
    },
    ownService: {
      icon: 'information-circle-outline' as const,
      iconColor: '#6366f1',
      iconBg: '#6366f115',
      title: 'Your Own Service',
      description: 'You cannot book your own service.',
      buttonColor: '#6366f1',
      buttonText: 'Close',
      showSecondary: false,
    },
  };

  const config = modalConfig[type];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[
          styles.bookingModalCard,
          { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }
        ]}>
          <View style={[styles.bookingIconCircle, { backgroundColor: config.iconBg }]}>
            <Ionicons name={config.icon} size={64} color={config.iconColor} />
          </View>
          <Text style={[styles.bookingModalTitle, { color: theme.text }]}>{config.title}</Text>
          <Text style={[styles.bookingModalDesc, { color: theme.textSecondary }]}>
            {config.description}
          </Text>
          <Pressable
            style={[styles.bookingModalButton, { backgroundColor: config.buttonColor }]}
            onPress={type === 'ownService' ? onClose : onGoToOrders}
          >
            <Text style={styles.bookingModalButtonText}>{config.buttonText}</Text>
          </Pressable>
          {config.showSecondary && (
            <Pressable style={styles.bookingCloseButton} onPress={onClose}>
              <Text style={[styles.bookingCloseButtonText, { color: theme.textSecondary }]}>
                {type === 'success' ? 'Continue Browsing' : 'Close'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingModalCard: {
    width: '85%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    ...Shadows.xl,
    marginHorizontal: 20,
  },
  bookingIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  bookingModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  bookingModalDesc: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  bookingModalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.lg,
  },
  bookingModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bookingCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  bookingCloseButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
