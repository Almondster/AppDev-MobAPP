import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Shadows } from '../../../constants/theme';

interface ServiceModalProps {
  visible: boolean;
  service: any;
  isBlocked: boolean;
  isOwnService: boolean;
  bookingId: string | null;
  onClose: () => void;
  onBook: () => void;
  onViewProfile: (uid: string) => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  visible,
  service,
  isBlocked,
  isOwnService,
  bookingId,
  onClose,
  onBook,
  onViewProfile,
}) => {
  const { theme } = useTheme();

  if (!service) return null;

  if (isBlocked) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.bookingModalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
            <View style={[styles.bookingIconCircle, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="ban" size={64} color="#ef4444" />
            </View>
            <Text style={[styles.bookingModalTitle, { color: theme.text }]}>Service Unavailable</Text>
            <Text style={[styles.bookingModalDesc, { color: theme.textSecondary }]}>
              You have blocked this creator. You cannot view or request their services.
            </Text>
            <Pressable 
              style={[styles.bookingModalButton, { backgroundColor: '#ef4444' }]} 
              onPress={onClose}
            >
              <Text style={styles.bookingModalButtonText}>Understood</Text>
            </Pressable>
            <Pressable 
              style={styles.bookingCloseButton} 
              onPress={() => {
                onClose();
                onViewProfile(service.creator_id);
              }}
            >
              <Text style={[styles.bookingCloseButtonText, { color: theme.textSecondary }]}>View Profile to Unblock</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.fullScreenModalContainer, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.serviceModalHeader, { backgroundColor: theme.card }]}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.serviceModalHeaderTitle, { color: theme.text }]}>Service Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.fullScreenScrollView} showsVerticalScrollIndicator={false}>
          {/* Service Image */}
          <View style={styles.serviceImageFullContainer}>
            {service.image_url ? (
              <Image source={{ uri: service.image_url }} style={styles.serviceImageFull} resizeMode="cover" />
            ) : (
              <View style={[styles.serviceImageFullPlaceholder, { backgroundColor: theme.cardBorder }]}>
                <Ionicons name="briefcase-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>No Image</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.serviceContentContainer}>
            {/* Category Badge */}
            <View style={[styles.catBadge, { backgroundColor: theme.tint + '15' }]}>
              <Text style={[styles.catBadgeText, { color: theme.tint }]}>{service.label}</Text>
            </View>

            {/* Service Title */}
            <Text style={[styles.serviceTitleFull, { color: theme.text }]}>{service.title}</Text>

            {/* Price */}
            <Text style={[styles.servicePriceFull, { color: theme.tint }]}>
              {service.price && service.price !== 'Negotiable' ? `₱${service.price}` : 'Price Negotiable'}
            </Text>

            <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />

            {/* Description */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
            <Text style={[styles.serviceDescriptionFull, { color: theme.textSecondary }]}>
              {service.description || "No description provided for this service."}
            </Text>

            <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />

            {/* Creator Info */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About the Creator</Text>
            <Pressable 
              style={styles.creatorCardFull}
              onPress={() => {
                onClose();
                onViewProfile(service.creator_id);
              }}
            >
              <Image 
                source={{ uri: service.creator?.avatar_url || 'https://via.placeholder.com/60' }} 
                style={styles.creatorAvatarFull} 
              />
              <View style={styles.creatorInfoFull}>
                <Text style={[styles.creatorNameFull, { color: theme.text }]}>{service.creator?.full_name || 'Unknown Creator'}</Text>
                <Text style={[styles.creatorRoleFull, { color: theme.textSecondary }]}>{service.creator?.role || 'Creator'}</Text>
                <Text style={[styles.viewProfileText, { color: theme.tint }]}>View Profile →</Text>
              </View>
            </Pressable>

            {/* Service Details */}
            <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Service Details</Text>
            
            <View style={styles.detailsGridFull}>
              <View style={styles.detailItemFull}>
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Listed Date</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {new Date(service.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailItemFull}>
                <Ionicons name="pricetag-outline" size={20} color={theme.textSecondary} />
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Pricing</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {service.price && service.price !== 'Negotiable' ? 'Fixed Price' : 'Negotiable'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailItemFull}>
                <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Service Type</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{service.label}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        {!isOwnService && (
          <View style={[styles.floatingActionContainer, { backgroundColor: theme.card }]}>
            <Pressable 
              style={[styles.requestButton, { backgroundColor: theme.tint }]} 
              onPress={onBook}
              disabled={bookingId === service.id}
            >
              {bookingId === service.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={20} color="#fff" />
                  <Text style={styles.requestButtonText}>Request Service</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
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
  fullScreenModalContainer: {
    flex: 1,
  },
  serviceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  serviceModalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  fullScreenScrollView: {
    flex: 1,
  },
  serviceImageFullContainer: {
    height: 250,
    width: '100%',
  },
  serviceImageFull: {
    width: '100%',
    height: '100%',
  },
  serviceImageFullPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
  },
  serviceContentContainer: {
    padding: 20,
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  serviceTitleFull: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  servicePriceFull: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  separator: { height: 1, width: '100%', marginBottom: 20, opacity: 0.5 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  serviceDescriptionFull: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  creatorCardFull: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginBottom: 20,
  },
  creatorAvatarFull: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  creatorInfoFull: {
    flex: 1,
  },
  creatorNameFull: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  creatorRoleFull: {
    fontSize: 14,
    marginBottom: 8,
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsGridFull: {
    gap: 16,
  },
  detailItemFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  floatingActionContainer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
