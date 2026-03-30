import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { Shadows } from '@/constants/theme';

// 1. DATA: Subcategory Mapping
const CATEGORIES = [
  'Design & Creative',
  'Development & IT',
  'Writing & Translation',
  'Digital Marketing',
  'Video & Animation',
  'Music & Audio'
];

const SUBCATEGORY_MAP: Record<string, string[]> = {
  'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
  'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
  'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Proofreading', 'Scriptwriting'],
  'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
  'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
  'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

export default function AddServiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { customDescription, clientId } = params;
  const { theme, isDark: _isDark } = useTheme();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  
  // Selection Modal States
  const [showCatModal, setShowCatModal] = useState(false);
  const [showSubCatModal, setShowSubCatModal] = useState(false);

  // Custom Alert Modal State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
    onPress: () => {} 
  });

  // Confirmation Modal State
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]); 
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isCustomService, setIsCustomService] = useState(false);
  const [targetClientId, setTargetClientId] = useState<string | null>(null);
  
  // Image State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Pre-fill description and mark as custom service if from smart-match
  useEffect(() => {
    if (customDescription) {
      const desc = Array.isArray(customDescription) ? customDescription[0] : customDescription;
      setDescription(decodeURIComponent(desc));
      setIsCustomService(true);
    }
    if (clientId) {
      const id = Array.isArray(clientId) ? clientId[0] : clientId;
      setTargetClientId(id);
    }
  }, [customDescription, clientId]);

  // Auto-select first subcategory when main category changes
  useEffect(() => {
    const subs = SUBCATEGORY_MAP[selectedCategory];
    if (subs && subs.length > 0) {
        setSelectedSubcategory(subs[0]);
    } else {
        setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  // Helper to show custom alert
  const showAlert = (type: 'success' | 'error', title: string, message: string, callback?: () => void) => {
    setAlertConfig({
        type,
        title,
        message,
        onPress: callback || (() => setAlertVisible(false))
    });
    setAlertVisible(true);
  };

  const pickImage = async () => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3], 
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            
            // Validate file type
            if (asset.uri && !asset.uri.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                showAlert('error', 'Invalid File Type', 'Please select a valid image file (JPG, PNG, GIF, or WebP).');
                return;
            }

            // Validate file size (max 5MB)
            if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                showAlert('error', 'File Too Large', 'Image must be smaller than 5MB. Please choose a smaller image.');
                return;
            }

            // Validate dimensions (optional - ensure reasonable size)
            if (asset.width && asset.height) {
                if (asset.width < 200 || asset.height < 200) {
                    showAlert('error', 'Image Too Small', 'Image must be at least 200x200 pixels.');
                    return;
                }
                if (asset.width > 4096 || asset.height > 4096) {
                    showAlert('error', 'Image Too Large', 'Image dimensions must be less than 4096x4096 pixels.');
                    return;
                }
            }

            if (asset.base64) {
                setImageUri(asset.uri);
                setImageBase64(asset.base64);
            } else {
                showAlert('error', 'Error', 'Failed to process image. Please try again.');
            }
        }
    } catch (_error) {
        showAlert('error', 'Error', 'Failed to pick image');
    }
  };

  const handleCreate = () => {
    if (!user) {
        showAlert('error', 'Authentication Error', 'You must be logged in.');
        return;
    }
    if (!title.trim() || !price.trim() || !description.trim()) {
        showAlert('error', 'Missing Fields', 'Please fill out all text fields.');
        return;
    }
    if (!selectedSubcategory) {
        showAlert('error', 'Category Error', 'Please select a valid subcategory.');
        return;
    }
    
    if (!imageBase64) {
        showAlert('error', 'Image Required', 'Please upload a cover image for your service.');
        return;
    }

    // Show confirmation modal
    setConfirmVisible(true);
  };

  const handleConfirmCreate = async () => {
    setConfirmVisible(false);

    if (!user) {
      showAlert('error', 'Authentication Error', 'You must be logged in.');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;

      // 1. Upload Image
      if (imageBase64) {
        const fileName = `services/${user.uid}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
            .from('service-images')
            .upload(fileName, decode(imageBase64), {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (uploadError) {
             console.error('Upload Error:', uploadError);
             throw new Error('Failed to upload image. Please try again.');
        }

        const { data: urlData } = supabase.storage
            .from('service-images')
            .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // 2. Insert Service Record
      const serviceData: any = {
        creator_id: user.uid,
        title: title.trim(),
        label: selectedSubcategory,
        price: price.trim(),
        description: description.trim(),
        image_url: imageUrl, 
        icon: 'briefcase-outline'
      };

      // If this is a custom service for a specific client, make it private
      if (isCustomService && targetClientId) {
        serviceData.is_public = false;
        serviceData.target_client_id = targetClientId;
      }

      const { data: insertedService, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;

      // If custom service, send it as a message to the client
      if (isCustomService && targetClientId && insertedService) {
        await supabase.from('messages').insert({
          sender_id: user.uid,
          receiver_id: targetClientId,
          content: `I've created a custom service for you: ${title.trim()}`,
          service_data: {
            service_id: insertedService.id,
            title: insertedService.title,
            price: insertedService.price,
            description: insertedService.description,
            image_url: insertedService.image_url,
            label: insertedService.label
          },
          is_read: false
        });

        showAlert('success', 'Success!', 'Custom service created and sent to client!', () => {
          setAlertVisible(false);
          router.back();
        });
      } else {
        // Regular public service
        showAlert('success', 'Success!', 'Service posted successfully.', () => {
          setAlertVisible(false);
          router.back();
        });
      }

    } catch (err: any) {
      showAlert('error', 'Submission Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    input: { 
        backgroundColor: theme.inputBackground, 
        color: theme.text,
        borderColor: theme.inputBorder,
        borderWidth: 1
    },
    modal: { backgroundColor: theme.background },
    placeholderBox: { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
    modalBg: { backgroundColor: theme.card },
  };

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, themeStyles.text]}>
          {isCustomService ? 'Custom Service' : 'New Service'}
        </Text>
        <View style={{ width: 28 }} /> 
      </View>

      {/* SMART MATCH INFO BANNER */}
      {isCustomService && targetClientId && (
        <View style={[styles.customServiceBanner, { backgroundColor: theme.tint + '15', borderColor: theme.tint }]}>
          <Ionicons name="sparkles" size={20} color={theme.tint} />
          <Text style={[styles.customServiceText, { color: theme.tint }]}>
            Creating a custom service for this client's smart-match request
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
            contentContainerStyle={styles.content} 
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
        >
            
            {/* IMAGE UPLOAD */}
            <Text style={[styles.label, themeStyles.text]}>Cover Image</Text>
            <Pressable onPress={pickImage} style={[styles.uploadBox, themeStyles.placeholderBox]}>
                {imageUri ? (
                    <>
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                        <View style={styles.editImageBadge}>
                            <Ionicons name="pencil" size={16} color="#fff" />
                        </View>
                    </>
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
                        <Text style={[styles.uploadText, themeStyles.textSecondary]}>Tap to upload cover</Text>
                    </View>
                )}
            </Pressable>

            {/* TITLE */}
            <Text style={[styles.label, themeStyles.text]}>Service Title</Text>
            <TextInput
                style={[styles.input, themeStyles.input]}
                placeholder="e.g. Professional Logo Design"
                placeholderTextColor={theme.textSecondary}
                value={title}
                onChangeText={setTitle}
            />

            {/* CATEGORY SELECTOR */}
            <Text style={[styles.label, themeStyles.text]}>Category</Text>
            <Pressable 
                style={[styles.selector, themeStyles.input]} 
                onPress={() => setShowCatModal(true)}
            >
                <Text style={{ color: theme.text, fontSize: 16 }}>{selectedCategory}</Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </Pressable>

            {/* NEW: SUBCATEGORY SELECTOR */}
            <Text style={[styles.label, themeStyles.text]}>Subcategory</Text>
            <Pressable 
                style={[styles.selector, themeStyles.input]} 
                onPress={() => setShowSubCatModal(true)}
            >
                <Text style={{ color: theme.text, fontSize: 16 }}>
                    {selectedSubcategory || 'Select Subcategory'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </Pressable>

            {/* PRICE */}
            <Text style={[styles.label, themeStyles.text]}>Starting Price (₱)</Text>
            <TextInput
                style={[styles.input, themeStyles.input]}
                placeholder="e.g. 5000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
            />

            {/* DESCRIPTION */}
            <Text style={[styles.label, themeStyles.text]}>Description</Text>
            <TextInput
                style={[styles.input, styles.textArea, themeStyles.input]}
                placeholder="Describe what you will provide, turnaround time, and what's included..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
            />

            {/* SUBMIT */}
            <Pressable 
                onPress={handleCreate} 
                style={[styles.submitButton, { backgroundColor: theme.tint }]}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitText}>Post Service</Text>
                )}
            </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL 1: MAIN CATEGORY */}
      <Modal visible={showCatModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCatModal(false)}>
        <SafeAreaView style={[styles.modalContainer, themeStyles.modal]}>
            <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, themeStyles.text]}>Select Category</Text>
                <Pressable onPress={() => setShowCatModal(false)}>
                    <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text>
                </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {CATEGORIES.map((cat) => (
                    <Pressable 
                        key={cat} 
                        style={[styles.catOption, selectedCategory === cat && { backgroundColor: theme.card }]}
                        onPress={() => { setSelectedCategory(cat); setShowCatModal(false); }}
                    >
                        <Text style={[styles.catText, themeStyles.text, selectedCategory === cat && { color: theme.tint, fontWeight: '700' }]}>{cat}</Text>
                        {selectedCategory === cat && <Ionicons name="checkmark" size={20} color={theme.tint} />}
                    </Pressable>
                ))}
            </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* MODAL 2: SUBCATEGORY */}
      <Modal visible={showSubCatModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSubCatModal(false)}>
        <SafeAreaView style={[styles.modalContainer, themeStyles.modal]}>
            <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, themeStyles.text]}>Select Subcategory</Text>
                <Pressable onPress={() => setShowSubCatModal(false)}>
                    <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text>
                </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {SUBCATEGORY_MAP[selectedCategory]?.map((sub) => (
                    <Pressable 
                        key={sub} 
                        style={[styles.catOption, selectedSubcategory === sub && { backgroundColor: theme.card }]}
                        onPress={() => { setSelectedSubcategory(sub); setShowSubCatModal(false); }}
                    >
                        <Text style={[styles.catText, themeStyles.text, selectedSubcategory === sub && { color: theme.tint, fontWeight: '700' }]}>{sub}</Text>
                        {selectedSubcategory === sub && <Ionicons name="checkmark" size={20} color={theme.tint} />}
                    </Pressable>
                ))}
            </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* --- CUSTOM ALERT MODAL --- */}
      <Modal
        visible={alertVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.alertBackdrop}>
            <View style={[styles.alertCard, themeStyles.modalBg, { borderColor: theme.cardBorder, borderWidth: 1 }]}>
                
                {/* Icon based on type */}
                <View style={[
                    styles.alertIconCircle, 
                    { backgroundColor: alertConfig.type === 'success' ? theme.tint + '15' : '#ef444415' }
                ]}>
                    <Ionicons 
                        name={alertConfig.type === 'success' ? "checkmark-circle" : "alert-circle"} 
                        size={48} 
                        color={alertConfig.type === 'success' ? theme.tint : '#ef4444'} 
                    />
                </View>
                
                <Text style={[styles.alertTitle, themeStyles.text]}>{alertConfig.title}</Text>
                <Text style={[styles.alertMessage, themeStyles.textSecondary]}>{alertConfig.message}</Text>

                <TouchableOpacity 
                    style={[
                        styles.alertButton, 
                        { backgroundColor: alertConfig.type === 'success' ? theme.tint : theme.cardBorder }
                    ]}
                    onPress={alertConfig.onPress}
                >
                    <Text style={[
                        styles.alertButtonText, 
                        { color: alertConfig.type === 'success' ? '#fff' : theme.text }
                    ]}>
                        {alertConfig.type === 'success' ? 'OK' : 'Close'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: theme.card }]}>
            <View style={[styles.confirmIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={48} color="#3b82f6" />
            </View>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Create Service?</Text>
            <Text style={[styles.confirmMessage, { color: theme.textSecondary }]}>
              Are you sure you want to publish this service? It will be visible to all users.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                onPress={() => setConfirmVisible(false)}
                style={[styles.confirmBtn, styles.confirmBtnCancel, { borderColor: theme.cardBorder }]}
              >
                <Text style={[styles.confirmBtnText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmCreate}
                style={[styles.confirmBtn, styles.confirmBtnConfirm]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.confirmBtnText, { color: '#fff' }]}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 16 
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  customServiceBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customServiceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  content: { padding: 24, paddingBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  
  uploadBox: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { marginTop: 8, fontSize: 14 },
  imagePreview: { width: '100%', height: '100%' },
  editImageBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },

  input: { 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    marginBottom: 24, 
    ...(Shadows.sm as any),
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  
  selector: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    ...Shadows.md,
  },

  submitButton: { 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 8,
    marginBottom: 40,
    ...Shadows.xl,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Confirmation Modal Styles
  confirmCard: {
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    ...Shadows.xl,
  },
  confirmIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnCancel: {
    borderWidth: 1.5,
  },
  confirmBtnConfirm: {
    backgroundColor: '#3b82f6',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },

  modalContainer: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  catOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 4
  },
  catText: { fontSize: 16 },

  // -- CUSTOM ALERT STYLES --
  alertBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24
  },
  alertCard: {
      width: '100%',
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      ...Shadows.xl,
  },
  alertIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20
  },
  alertTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center'
  },
  alertMessage: {
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22
  },
  alertButton: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
  },
  alertButtonText: {
      fontSize: 16,
      fontWeight: '700'
  }
});
