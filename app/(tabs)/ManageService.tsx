import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Image as RNImage,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Shadows } from '@/constants/theme';

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

type Service = {
  id: number;
  title: string;
  label: string;
  price: string;
  description: string;
  image_url?: string;
  created_at: string;
  creator_id: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
};

// --- SKELETON LOADER COMPONENT ---
const SkeletonItem = () => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
      {/* Header Skeleton */}
      <View style={styles.cardHeader}>
        <Animated.View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: theme.cardBorder, opacity }} />
        <View style={{ marginLeft: 12, flex: 1, gap: 8 }}>
          <Animated.View style={{ width: '70%', height: 16, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
          <Animated.View style={{ width: '40%', height: 12, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
          <Animated.View style={{ width: '30%', height: 14, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      {/* Description Skeleton */}
      <View style={{ gap: 6, marginBottom: 12 }}>
        <Animated.View style={{ width: '100%', height: 12, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
        <Animated.View style={{ width: '90%', height: 12, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
        <Animated.View style={{ width: '60%', height: 12, borderRadius: 4, backgroundColor: theme.cardBorder, opacity }} />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      {/* Actions Skeleton */}
      <View style={styles.actionContainer}>
        <Animated.View style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: theme.cardBorder, opacity }} />
        <Animated.View style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: theme.cardBorder, opacity }} />
      </View>
    </View>
  );
};

export default function ManageServicesScreen() {
  const user = auth.currentUser;
  const _router = useRouter();
  const { theme, isDark } = useTheme();
  const { t: _t } = useLanguage();

  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search State
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Confirmation Modal State
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // New Fields for Edit
  const [editCategory, setEditCategory] = useState(CATEGORIES[0]);
  const [editSubcategory, setEditSubcategory] = useState('');
  const [showEditCatModal, setShowEditCatModal] = useState(false);
  const [showEditSubCatModal, setShowEditSubCatModal] = useState(false);

  // Image State for Editing
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const [isNewImage, setIsNewImage] = useState(false);

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error',
    onConfirm: () => { }
  });

  // Delete Confirmation Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- EFFECTS ---

  // Auto-select first subcategory when main category changes (Only inside Edit Modal logic)
  useEffect(() => {
    if (editModalVisible) {
      const subs = SUBCATEGORY_MAP[editCategory];
      // Only reset if the current subcategory doesn't belong to the new category
      if (subs && !subs.includes(editSubcategory)) {
        if (subs.length > 0) {
          setEditSubcategory(subs[0]);
        } else {
          setEditSubcategory('');
        }
      }
    }
  }, [editCategory, editModalVisible, editSubcategory]);

  const fetchServices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('creator_id', user.uid)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setServices(data || []);
      setFilteredServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      showAlert('Error', 'Failed to load services', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServices();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  React.useEffect(() => {
    if (searchQuery) {
      setFilteredServices(
        services.filter(service =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredServices(services);
    }
  }, [searchQuery, services]);

  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertConfig({
      title,
      message,
      type,
      onConfirm: () => setAlertVisible(false)
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
          showAlert('Invalid File', 'Please select a valid image (JPG, PNG, GIF, or WebP).', 'error');
          return;
        }

        // Validate file size (max 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          showAlert('File Too Large', 'Image must be smaller than 5MB.', 'error');
          return;
        }

        // Validate dimensions
        if (asset.width && asset.height) {
          if (asset.width < 200 || asset.height < 200) {
            showAlert('Image Too Small', 'Image must be at least 200x200 pixels.', 'error');
            return;
          }
          if (asset.width > 4096 || asset.height > 4096) {
            showAlert('Image Too Large', 'Image must be less than 4096x4096 pixels.', 'error');
            return;
          }
        }

        if (!asset.base64) {
          showAlert('Error', 'Failed to process image.', 'error');
          return;
        }

        setEditImageUri(asset.uri);
        setEditImageBase64(asset.base64);
        setIsNewImage(true);
      }
    } catch (_error) {
      showAlert('Error', 'Failed to pick image', 'error');
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setEditTitle(service.title);
    setEditPrice(service.price);
    setEditDescription(service.description);
    setEditImageUri(service.image_url || null);
    setEditImageBase64(null);
    setIsNewImage(false);

    // Logic to reverse-lookup the Category based on the Subcategory (label)
    let foundCategory = CATEGORIES[0];
    const currentLabel = service.label;

    for (const [cat, subs] of Object.entries(SUBCATEGORY_MAP)) {
      if (subs.includes(currentLabel)) {
        foundCategory = cat;
        break;
      }
    }

    setEditCategory(foundCategory);
    setEditSubcategory(currentLabel);
    setEditModalVisible(true);
  };

  const handleUpdateService = () => {
    if (!editingService || !editTitle.trim() || !editPrice.trim() || !editDescription.trim()) {
      showAlert('Error', 'Please fill all fields', 'error');
      return;
    }

    if (!editSubcategory) {
      showAlert('Error', 'Please select a valid subcategory', 'error');
      return;
    }

    // Show confirmation modal
    setConfirmVisible(true);
  };

  const handleConfirmUpdate = async () => {
    setConfirmVisible(false);
    if (!editingService) return;

    setEditLoading(true);
    try {
      let imageUrl = editingService.image_url;

      // 1. Upload new image if selected
      if (isNewImage && editImageBase64) {
        const fileName = `services/${user?.uid}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(fileName, decode(editImageBase64), {
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

      // 2. Update Service Record
      const { error } = await supabase
        .from('services')
        .update({
          title: editTitle.trim(),
          price: editPrice.trim(),
          description: editDescription.trim(),
          label: editSubcategory,
          image_url: imageUrl,
        })
        .eq('id', editingService.id)
        .eq('creator_id', user?.uid);

      if (error) throw error;

      // Update local state
      setServices(prev => prev.map(service =>
        service.id === editingService.id
          ? {
            ...service,
            title: editTitle.trim(),
            price: editPrice.trim(),
            description: editDescription.trim(),
            label: editSubcategory,
            image_url: imageUrl,
          }
          : service
      ));

      setEditModalVisible(false);
      showAlert('Success', 'Service updated successfully');
    } catch (err: any) {
      console.error('Update error:', err);
      showAlert('Error', err.message || 'Failed to update service', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!user) {
      showAlert('Error', 'You must be logged in to delete services', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      const now = new Date().toISOString();

      // Soft delete: Set is_deleted flag instead of removing from database
      const { data, error } = await supabase
        .from('services')
        .update({
          is_deleted: true,
          deleted_at: now,
          deleted_by: user.uid
        })
        .eq('id', service.id)
        .eq('creator_id', user.uid)
        .select();

      if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message || 'Failed to delete service');
      }

      if (!data || data.length === 0) {
        throw new Error('Service not found or already deleted');
      }

      // Note: Image is NOT deleted from storage - retained for historical data
      // This allows admin recovery and maintains data integrity

      // Remove from local state (frontend only)
      setServices(prev => prev.filter(s => s.id !== service.id));
      setFilteredServices(prev => prev.filter(s => s.id !== service.id));
      setDeleteModalVisible(false);
      showAlert('Success', 'Service removed from your listings');

    } catch (err: any) {
      console.error('Delete service error:', err);
      showAlert('Error', err.message || 'Failed to delete service', 'error');
    } finally {
      setDeleteLoading(false);
      setServiceToDelete(null);
    }
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    await handleDeleteService(serviceToDelete);
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setServiceToDelete(null);
  };

  const themeStyles = {
    container: { backgroundColor: theme.background },
    header: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    input: {
      backgroundColor: theme.inputBackground,
      color: theme.text,
      borderColor: theme.inputBorder,
      borderWidth: 1
    },
    modalBg: { backgroundColor: theme.card },
    placeholderBox: {
      backgroundColor: theme.inputBackground,
      borderColor: theme.inputBorder,
      borderWidth: 1
    },
    modal: { backgroundColor: theme.background },
  };

  const renderService = ({ item }: { item: Service }) => (
    <View style={[styles.card, themeStyles.card]}>
      {/* Service Image and Basic Info */}
      <View style={styles.cardHeader}>
        {item.image_url && item.image_url !== '' ? (
          <RNImage source={{ uri: item.image_url }} style={styles.serviceImage} resizeMode="cover" />
        ) : (
          <View style={[styles.serviceIcon, { backgroundColor: isDark ? '#333' : '#e2e8f0' }]}>
            <Ionicons name="briefcase-outline" size={24} color={theme.text} />
          </View>
        )}

        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceTitle, themeStyles.text]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.serviceCategory, { color: theme.tint }]} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={[styles.servicePrice, themeStyles.text]}>
            ₱ {item.price}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      <Text style={[styles.serviceDescription, themeStyles.textSecondary]} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.tint }]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ef444415' }]}
          onPress={() => {
            setServiceToDelete(item);
            setDeleteModalVisible(true);
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, themeStyles.text]}>Manage Services</Text>
          <Pressable onPress={() => setIsSearchVisible(!isSearchVisible)} style={styles.iconButton}>
            <Ionicons name="search" size={24} color={theme.text} />
          </Pressable>
        </View>

        {isSearchVisible && (
          <View style={[styles.searchBarContainer, themeStyles.input]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              placeholder="Search your services..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* SERVICES LIST */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3].map(key => <SkeletonItem key={key} />)}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderService}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.tint}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={80} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, themeStyles.text]}>No Services Found</Text>
              <Text style={[styles.emptySubtitle, themeStyles.textSecondary]}>
                {searchQuery ? 'No services match your search.' : "You haven't created any services yet."}
              </Text>
            </View>
          }
        />
      )}

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, themeStyles.container]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Edit Service</Text>
            <Pressable onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
            >
              {/* EDIT IMAGE UPLOAD */}
              <Text style={[styles.label, themeStyles.text]}>Cover Image</Text>
              <Pressable onPress={pickImage} style={[styles.uploadBox, themeStyles.placeholderBox]}>
                {editImageUri ? (
                  <>
                    <Image source={{ uri: editImageUri }} style={styles.imagePreview} resizeMode="cover" />
                    <View style={styles.editImageBadge}>
                      <Ionicons name="color-wand" size={16} color="#fff" />
                    </View>
                  </>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
                    <Text style={[styles.uploadText, themeStyles.textSecondary]}>Tap to upload cover</Text>
                  </View>
                )}
              </Pressable>

              <Text style={[styles.label, themeStyles.text]}>Service Title</Text>
              <TextInput
                style={[styles.input, themeStyles.input]}
                placeholder="Service title"
                placeholderTextColor={theme.textSecondary}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              {/* CATEGORY SELECTOR */}
              <Text style={[styles.label, themeStyles.text]}>Category</Text>
              <Pressable
                style={[styles.selector, themeStyles.input]}
                onPress={() => setShowEditCatModal(true)}
              >
                <Text style={{ color: theme.text, fontSize: 16 }}>{editCategory}</Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>

              {/* SUBCATEGORY SELECTOR */}
              <Text style={[styles.label, themeStyles.text]}>Subcategory</Text>
              <Pressable
                style={[styles.selector, themeStyles.input]}
                onPress={() => setShowEditSubCatModal(true)}
              >
                <Text style={{ color: theme.text, fontSize: 16 }}>
                  {editSubcategory || 'Select Subcategory'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>

              <Text style={[styles.label, themeStyles.text]}>Price (₱)</Text>
              <TextInput
                style={[styles.input, themeStyles.input]}
                placeholder="Price"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={editPrice}
                onChangeText={setEditPrice}
              />

              <Text style={[styles.label, themeStyles.text]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, themeStyles.input]}
                placeholder="Service description"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={6}
                value={editDescription}
                onChangeText={setEditDescription}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: theme.tint }]}
                onPress={handleUpdateService}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.updateButtonText}>Update Service</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* MODAL 1: EDIT MAIN CATEGORY */}
      <Modal visible={showEditCatModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditCatModal(false)}>
        <SafeAreaView style={[styles.modalContainer, themeStyles.modal]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Select Category</Text>
            <Pressable onPress={() => setShowEditCatModal(false)}>
              <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.catOption, editCategory === cat && { backgroundColor: theme.card }]}
                onPress={() => { setEditCategory(cat); setShowEditCatModal(false); }}
              >
                <Text style={[styles.catText, themeStyles.text, editCategory === cat && { color: theme.tint, fontWeight: '700' }]}>{cat}</Text>
                {editCategory === cat && <Ionicons name="checkmark" size={20} color={theme.tint} />}
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* MODAL 2: EDIT SUBCATEGORY */}
      <Modal visible={showEditSubCatModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditSubCatModal(false)}>
        <SafeAreaView style={[styles.modalContainer, themeStyles.modal]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Select Subcategory</Text>
            <Pressable onPress={() => setShowEditSubCatModal(false)}>
              <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {SUBCATEGORY_MAP[editCategory]?.map((sub) => (
              <Pressable
                key={sub}
                style={[styles.catOption, editSubcategory === sub && { backgroundColor: theme.card }]}
                onPress={() => { setEditSubcategory(sub); setShowEditSubCatModal(false); }}
              >
                <Text style={[styles.catText, themeStyles.text, editSubcategory === sub && { color: theme.tint, fontWeight: '700' }]}>{sub}</Text>
                {editSubcategory === sub && <Ionicons name="checkmark" size={20} color={theme.tint} />}
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.deleteCard, themeStyles.modalBg]}>
            <View style={[
              styles.deleteIconCircle,
              { backgroundColor: '#ef444415' }
            ]}>
              <Ionicons
                name="warning"
                size={48}
                color="#ef4444"
              />
            </View>

            <Text style={[styles.deleteTitle, themeStyles.text]}>Remove Service</Text>
            <Text style={[styles.deleteMessage, themeStyles.textSecondary]}>
              Remove "{serviceToDelete?.title}" from your listings? This will hide it from clients but preserve your data.
            </Text>

            <View style={styles.deleteButtonContainer}>
              <TouchableOpacity
                style={[styles.deleteCancelButton, { backgroundColor: theme.inputBackground }]}
                onPress={cancelDelete}
                disabled={deleteLoading}
              >
                <Text style={[styles.deleteCancelButtonText, themeStyles.text]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteConfirmButton,
                  {
                    backgroundColor: deleteLoading ? '#999' : '#ef4444',
                    opacity: deleteLoading ? 0.6 : 1
                  }
                ]}
                onPress={confirmDeleteService}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONFIRMATION MODAL FOR UPDATE */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: theme.card }]}>
            <View style={[styles.confirmIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Ionicons name="create" size={48} color="#22c55e" />
            </View>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Update Service?</Text>
            <Text style={[styles.confirmMessage, { color: theme.textSecondary }]}>
              Are you sure you want to save these changes? The updated service will be visible to all users.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                onPress={() => setConfirmVisible(false)}
                style={[styles.confirmBtn, styles.confirmBtnCancel, { borderColor: theme.cardBorder }]}
              >
                <Text style={[styles.confirmBtnText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmUpdate}
                style={[styles.confirmBtn, styles.confirmBtnConfirm]}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.confirmBtnText, { color: '#fff' }]}>Update</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ALERT MODAL */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.alertCard, themeStyles.modalBg]}>
            <View style={[
              styles.alertIconCircle,
              { backgroundColor: alertConfig.type === 'error' ? '#ef444415' : theme.tint + '15' }
            ]}>
              <Ionicons
                name={alertConfig.type === 'error' ? "close-circle" : "checkmark-circle"}
                size={48}
                color={alertConfig.type === 'error' ? '#ef4444' : theme.tint}
              />
            </View>
            <Text style={[styles.alertTitle, themeStyles.text]}>{alertConfig.title}</Text>
            <Text style={[styles.alertMessage, themeStyles.textSecondary]}>{alertConfig.message}</Text>
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: alertConfig.type === 'error' ? '#ef4444' : theme.tint }]}
              onPress={alertConfig.onConfirm}
            >
              <Text style={styles.alertButtonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.lg,
    zIndex: 10
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: { padding: 4 },
  title: { fontSize: 28, fontWeight: '700' },
  iconButton: { padding: 4 },
  searchBarContainer: {
    marginTop: 16,
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    height: '100%'
  },

  listContent: {
    padding: 24,
    paddingBottom: 100,
    flexGrow: 1
  },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Shadows.lg,
      },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 12
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  serviceCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 12
  },
  divider: {
    height: 1,
    marginVertical: 12
  },

  actionContainer: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 24,
    paddingBottom: 40,
  },
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
    position: 'relative'
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
    marginBottom: 20,
    borderWidth: 1,
  },
  selector: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
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
  textArea: {
    height: 150,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  updateButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  deleteCard: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    ...Shadows.xl,
  },
  deleteIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center'
  },
  deleteMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  deleteButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteCancelButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  alertCard: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    ...Shadows.xl,
  },
  alertIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },

  // Confirmation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    backgroundColor: '#22c55e',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
