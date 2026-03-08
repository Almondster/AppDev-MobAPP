import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface CreatorModalProps {
  visible: boolean;
  creator: any;
  isBlocked: boolean;
  isCurrentUser: boolean;
  onClose: () => void;
  onViewProfile: (uid: string) => void;
}

export const CreatorModal: React.FC<CreatorModalProps> = ({
  visible,
  creator,
  isBlocked,
  isCurrentUser,
  onClose,
  onViewProfile,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  if (!creator) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: theme.background }]} onPress={() => {}}>
          <View style={styles.dragHandle} />

          {isBlocked ? (
            <View style={styles.blockedContainer}>
              <View style={[styles.blockedIcon, { backgroundColor: theme.inputBackground }]}>
                <Ionicons name="ban" size={48} color={theme.textSecondary} />
              </View>
              <Text style={[styles.blockedTitle, { color: theme.text }]}>Creator Blocked</Text>
              <Text style={[styles.blockedDesc, { color: theme.textSecondary }]}>
                You have blocked this creator. You cannot view their details.
              </Text>
              <Pressable 
                style={[styles.unblockBtn, { borderColor: theme.cardBorder }]}
                onPress={() => onViewProfile(creator.firebase_uid)}
              >
                <Text style={[styles.unblockText, { color: theme.text }]}>View Profile to Unblock</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <View style={[styles.modalAvatar, { borderColor: theme.cardBorder }]}>
                  {creator.avatar_url ? (
                    <Image source={{ uri: creator.avatar_url }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={[styles.modalAvatarText, {color: theme.text}]}>{creator.full_name?.charAt(0)}</Text>
                  )}
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.modalName, { color: theme.text }]}>{creator.full_name}</Text>
                  <Text style={[styles.modalRole, {color: theme.tint}]}>{creator.role?.toUpperCase()}</Text>
                  <View style={styles.modalRatingBadge}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={[styles.modalRatingText, { color: theme.text }]}>
                      {creator.calculated_rating || 'New'} ({creator.review_count || 0} Reviews)
                    </Text>
                  </View>
                </View>
                <Pressable onPress={onClose} style={[styles.closeBtn, {backgroundColor: theme.card}]}>
                  <Ionicons name="close" size={20} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.infoSection}>
                <Text style={[styles.infoTitle, { color: theme.textSecondary }]}>About</Text>
                <Text style={[styles.infoText, { color: theme.text }]}>
                  {creator.bio || "This creator hasn't added a bio yet."}
                </Text>
              </View>

              {creator.skills && creator.skills.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={[styles.infoTitle, { color: theme.textSecondary }]}>Skills</Text>
                  <View style={styles.skillsRow}>
                    {creator.skills.map((skill: string, idx: number) => (
                      <View key={idx} style={[styles.skillChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <Text style={[styles.skillText, { color: theme.text }]}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actionRow}>
                <Pressable 
                  style={[styles.actionBtn, styles.secondaryBtn, { borderColor: theme.cardBorder }]}
                  onPress={() => onViewProfile(creator.firebase_uid)}
                >
                  <Text style={[styles.btnText, { color: theme.text }]}>View Profile</Text>
                </Pressable>

                {!isCurrentUser ? (
                  <Pressable 
                    style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: theme.tint }]}
                    onPress={() => {
                      onClose();
                      router.push(`/chat/${creator.firebase_uid}`);
                    }}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                    <Text style={[styles.btnText, { color: '#fff', marginLeft: 8 }]}>Message</Text>
                  </Pressable>
                ) : (
                  <Pressable 
                    style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: '#9ca3af' }]}
                    onPress={() => {
                      onClose();
                      router.push(`/profile`);
                    }}
                  >
                    <Text style={[styles.btnText, { color: '#fff', marginLeft: 8 }]}>Edit Profile</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    paddingBottom: 40, 
    minHeight: 400,
    maxHeight: '80%'
  },
  dragHandle: { 
    width: 40, 
    height: 4, 
    backgroundColor: '#ccc', 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginBottom: 20 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  modalAvatar: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    borderWidth: 2, 
    marginRight: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden' 
  },
  modalAvatarText: { 
    fontSize: 24, 
    fontWeight: '700' 
  },
  modalName: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 4 
  },
  modalRole: { 
    fontSize: 12, 
    fontWeight: '600', 
    letterSpacing: 1, 
    marginBottom: 6 
  },
  modalRatingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(251, 191, 36, 0.1)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    alignSelf: 'flex-start',
    marginTop: 4
  },
  modalRatingText: { 
    fontSize: 12, 
    fontWeight: '600', 
    marginLeft: 6 
  },
  closeBtn: { 
    padding: 8, 
    borderRadius: 20 
  },
  infoSection: { 
    marginBottom: 20 
  },
  infoTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8, 
    textTransform: 'uppercase' 
  },
  infoText: { 
    fontSize: 15, 
    lineHeight: 22 
  },
  skillsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  skillChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    borderWidth: 1 
  },
  skillText: { 
    fontSize: 12, 
    fontWeight: '500' 
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 10 
  },
  actionBtn: { 
    flex: 1, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row' 
  },
  primaryBtn: {},
  secondaryBtn: { 
    borderWidth: 1, 
    backgroundColor: 'transparent' 
  },
  btnText: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  blockedContainer: { alignItems: 'center', justifyContent: 'center', padding: 30, flex: 1 },
  blockedIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  blockedTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  blockedDesc: { textAlign: 'center', marginBottom: 24, fontSize: 14, paddingHorizontal: 20 },
  unblockBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1 },
  unblockText: { fontWeight: '700' },
});
