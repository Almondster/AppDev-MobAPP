import { DeadlineManager, EscrowManager, ExtensionRequestModal, RefundRequestModal, RefundResponseModal } from '@/components/orders';
import { useLanguage } from '@/context/LanguageContext';
import { useOrderUpdates } from '@/context/OrderContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { checkAndProcessOverdueRefunds, requestDeadlineExtension, requestRefund, respondToRefund, reviewExtensionRequest } from '@/utils/orderOperations';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Shadows } from '@/constants/theme';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// --- TYPES ---
type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'refunded' | 'cancelled' | 'rejected';
type EscrowStatus = 'pending' | 'held' | 'released_to_creator' | 'refunded_to_client';

type Order = {
  id: number;
  service_title: string;
  price: string;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  last_updated_by?: string;
  client_name?: string;
  creator_name?: string;
  image_url?: string;
  client_id: string;
  creator_id: string;
  preview_url?: string;
  final_file_url?: string;
  payment_method_used?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  // NEW: Deadline & Escrow Management
  due_date?: string;
  deadline_extension_days?: number;
  deadline_extension_requested_at?: string;
  deadline_extension_approved?: boolean;
  deadline_extension_reason?: string;
  escrow_status?: EscrowStatus;
  escrow_amount?: number;
  auto_deadline_notification_sent?: boolean;
  deadline_passed?: boolean;
  refund_requested_at?: string;
  refund_approved?: boolean;
  work_started_at?: string;
  estimated_completion_days?: number;
};

type FilterType = 'All' | 'Pending' | 'Active' | 'Completed' | 'Refunded' | 'Cancelled';

// --- ENHANCED ALERT CONFIG ---
type AlertType = 'success' | 'error' | 'warning' | 'confirm';

type CustomAlertConfig = {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

// --- SKELETON LOADER COMPONENT ---
const SkeletonItem = ({ width, height, borderRadius = 4, style }: any) => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.cardBorder,
          opacity
        },
        style
      ]}
    />
  );
};

export default function OrderScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const { orderId: highlightOrderId } = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  // CONSUME CONTEXT
  const { lastSeenTime, refreshOrderCount } = useOrderUpdates();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState<'client' | 'creator'>('client');
  const [clientPaymentMethods, setClientPaymentMethods] = useState<any[]>([]);
  const [creatorAllowedMethods, setCreatorAllowedMethods] = useState<string[]>([]);

  // Filtering & Search
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // --- MODAL VISIBILITY STATES ---
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [rebookVisible, setRebookVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  // --- ACTION STATES ---
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [existingReviewId, setExistingReviewId] = useState<number | null>(null);

  // Upload States
  const [uploadType, setUploadType] = useState<'link' | 'file'>('file');
  const [previewLink, setPreviewLink] = useState('');
  const [finalLink, setFinalLink] = useState('');
  const [previewFile, setPreviewFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [finalFile, setFinalFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NEW: Deadline & Escrow Management States ---
  const [extensionModalVisible, setExtensionModalVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [refundResponseModalVisible, setRefundResponseModalVisible] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
  const [deadlineDays, setDeadlineDays] = useState('7'); // Client-selected deadline
  const [deadlineHours, setDeadlineHours] = useState('0');
  const [deadlineMinutes, setDeadlineMinutes] = useState('0');

  // --- CUSTOM ALERT STATE ---
  const [alertConfig, setAlertConfig] = useState<CustomAlertConfig>({
    visible: false, title: '', message: '', type: 'success'
  });

  // --- CANCEL CONFIRMATION STATE ---
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState(false);
  const [orderToAccept, setOrderToAccept] = useState<Order | null>(null);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [showExtensionConfirmModal, setShowExtensionConfirmModal] = useState(false);
  const [extensionRequestData, setExtensionRequestData] = useState<{ days: number, hours: number, minutes: number, reason: string } | null>(null);
  const [showExtensionReviewModal, setShowExtensionReviewModal] = useState(false);
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);

  // --- HANDLERS FOR NEW MODALS ---
  const handleRequestExtension = async (days: number, hours: number, minutes: number, reason: string) => {
    // Show confirmation modal before submitting
    setExtensionRequestData({ days, hours, minutes, reason });
    setExtensionModalVisible(false);
    setShowExtensionConfirmModal(true);
  };

  const confirmExtensionRequest = async () => {
    if (!selectedOrderForAction || !extensionRequestData) {
      console.log('Missing data:', { selectedOrderForAction, extensionRequestData });
      return;
    }

    setIsSubmittingExtension(true);

    try {
      const result = await requestDeadlineExtension(
        selectedOrderForAction.id.toString(),
        extensionRequestData.days,
        extensionRequestData.hours,
        extensionRequestData.minutes,
        extensionRequestData.reason
      );

      if (result.success) {
        setShowExtensionConfirmModal(false);
        showAlert(t('success'), t('extensionSubmitted'));
        fetchOrders(); // Refresh orders
        setExtensionRequestData(null);
        setSelectedOrderForAction(null);
      } else {
        showAlert('Error', result.error || 'Failed to request extension', 'error');
      }
    } catch (error) {
      console.error('Extension request error:', error);
      showAlert('Error', 'An unexpected error occurred', 'error');
    } finally {
      setIsSubmittingExtension(false);
    }
  };

  const handleRequestRefund = async (reason: string) => {
    if (!selectedOrderForAction) return;
    const result = await requestRefund(selectedOrderForAction.id.toString(), reason);
    if (result.success) {
      showAlert(t('success'), t('refundSubmitted'));
      fetchOrders(); // Refresh orders
    } else {
      showAlert('Error', result.error || 'Failed to request refund', 'error');
    }
  };

  const handleRespondToRefund = async (approve: boolean, response: string) => {
    if (!selectedOrderForAction) return;
    const result = await respondToRefund(selectedOrderForAction.id.toString(), approve, response);
    if (result.success) {
      if (approve) {
        showAlert(t('refundApproved'), t('refundProcessed'));
      } else {
        showAlert(t('refundDenied'), t('refundDeniedMsg'));
      }
      fetchOrders(); // Refresh orders
    } else {
      showAlert('Error', result.error || 'Failed to respond to refund', 'error');
    }
  };

  const handleReviewExtension = (order: Order) => {
    setSelectedOrderForAction(order);
    setShowExtensionReviewModal(true);
  };

  const approveExtension = async () => {
    if (!selectedOrderForAction) return;
    setShowExtensionReviewModal(false);

    const result = await reviewExtensionRequest(selectedOrderForAction.id.toString(), true);

    if (result.success) {
      showAlert(t('extensionApproved'), t('extensionApprovedMsg'));
      fetchOrders(); // Refresh to show new deadline
      setSelectedOrderForAction(null);
    } else {
      showAlert('Error', result.error || 'Failed to approve extension', 'error');
    }
  };

  const denyExtension = async () => {
    if (!selectedOrderForAction) return;
    setShowExtensionReviewModal(false);

    const result = await reviewExtensionRequest(selectedOrderForAction.id.toString(), false);

    if (result.success) {
      showAlert(t('extensionDenied'), t('extensionDeniedMsg'));
      fetchOrders(); // Refresh orders
      setSelectedOrderForAction(null);
    } else {
      showAlert('Error', result.error || 'Failed to deny extension', 'error');
    }
  };


  // --- HELPERS ---
  const showAlert = (title: string, message: string, type: AlertType = 'success') => {
    setAlertConfig({ visible: true, title, message, type, confirmText: 'Okay', onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })) });
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    await updateOrderStatus(orderToCancel.id, 'cancelled');
    setShowCancelConfirmModal(false);
    setOrderToCancel(null);
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void, confirmText = "Confirm") => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText: "Cancel",
      onConfirm: () => {
        onConfirm();
        setAlertConfig(prev => ({ ...prev, visible: false }));
      },
      onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const fetchOrders = async () => {
    if (!user) return;
    try {
      // Check and auto-process any overdue refunds first
      await checkAndProcessOverdueRefunds();

      const { data: userData } = await supabase.from('users').select('role').eq('firebase_uid', user.uid).single();
      const currentRole = userData?.role || 'client';
      setRole(currentRole);

      const columnToCheck = currentRole === 'creator' ? 'creator_id' : 'client_id';
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq(columnToCheck, user.uid)
        .order('updated_at', { ascending: false });

      // Filter out orders deleted by current user based on their role
      const filteredData = data?.filter(order => {
        if (currentRole === 'creator') {
          return order.deleted_by_creator !== user.uid;
        } else {
          return order.deleted_by_client !== user.uid;
        }
      }) || [];

      // Custom sorting: Priority by status, then by updated_at
      const getStatusPriority = (order: Order): number => {
        // In-progress with held escrow (highest priority - active work)
        if (order.status === 'in_progress' && order.escrow_status === 'held') return 1;

        // Accepted (waiting for payment)
        if (order.status === 'accepted') return 2;

        // Pending (waiting for approval)
        if (order.status === 'pending') return 3;

        // Delivered (waiting for review/release)
        if (order.status === 'delivered') return 4;

        // Completed with released payment
        if (order.status === 'completed' && order.escrow_status === 'released_to_creator') return 5;

        // Refunded orders
        if (order.status === 'refunded') return 6;

        // Other cancelled
        if (order.status === 'cancelled') return 7;

        // Rejected
        if (order.status === 'rejected') return 8;

        // Fallback for any other status
        return 9;
      };

      const sortedData = filteredData.sort((a, b) => {
        const priorityA = getStatusPriority(a);
        const priorityB = getStatusPriority(b);

        // Sort by priority first
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // If same priority, sort by updated_at (newest first)
        const dateA = new Date(a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.created_at).getTime();
        return dateB - dateA;
      });

      if (error) throw error;
      setOrders(sortedData);

      if (currentRole === 'client') {
        const { data: pm } = await supabase.from('payment_methods').select('*').eq('user_id', user.uid);
        setClientPaymentMethods(pm || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      refreshOrderCount();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    refreshOrderCount();
  };

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = orders;

    // 1. Filter by Status Category
    if (activeFilter === 'Pending') {
      // Only pending approval orders
      result = result.filter(o => o.status === 'pending');
    } else if (activeFilter === 'Active') {
      // Includes: Waiting payment, Working, Delivered/In Review (excludes pending)
      result = result.filter(o => ['accepted', 'in_progress', 'delivered'].includes(o.status));
    } else if (activeFilter === 'Completed') {
      result = result.filter(o => o.status === 'completed');
    } else if (activeFilter === 'Refunded') {
      // Orders that were refunded (escrow_status = refunded_to_client OR status = refunded)
      result = result.filter(o =>
        (o as any).escrow_status === 'refunded_to_client' || o.status === 'refunded'
      );
    } else if (activeFilter === 'Cancelled') {
      // Cancelled or rejected orders (excluding refunded ones)
      result = result.filter(o =>
        (['cancelled', 'rejected'].includes(o.status)) &&
        (o as any).escrow_status !== 'refunded_to_client'
      );
    }

    // 2. Filter by Search
    if (searchQuery) {
      result = result.filter(o =>
        o.service_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (role === 'client' ? o.creator_name : o.client_name)?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(result);
  }, [searchQuery, orders, activeFilter, role]);

  // --- HANDLE NAVIGATION FROM NOTIFICATIONS ---
  useEffect(() => {
    if (highlightOrderId && orders.length > 0) {
      const orderIdNum = parseInt(highlightOrderId as string);
      const order = orders.find(o => o.id === orderIdNum);

      if (order) {
        // Determine which filter tab this order belongs to
        let targetFilter: FilterType = 'All';

        if (order.status === 'pending') targetFilter = 'Pending';
        else if (['accepted', 'in_progress', 'delivered'].includes(order.status)) targetFilter = 'Active';
        else if (order.status === 'completed') targetFilter = 'Completed';
        else if (order.status === 'refunded' || (order as any).escrow_status === 'refunded_to_client') targetFilter = 'Refunded';
        else if (['cancelled', 'rejected'].includes(order.status)) targetFilter = 'Cancelled';

        // Set filter and highlight
        if (activeFilter !== targetFilter) {
          setActiveFilter(targetFilter);
        }
        setHighlightedOrderId(orderIdNum);

        // Remove highlight after 3 seconds
        setTimeout(() => setHighlightedOrderId(null), 3000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightOrderId, orders]);

  // --- SCROLL TO HIGHLIGHTED ORDER AFTER FILTERING ---
  useEffect(() => {
    if (highlightedOrderId && filteredOrders.length > 0) {
      const index = filteredOrders.findIndex(o => o.id === highlightedOrderId);
      if (index !== -1 && index < filteredOrders.length && flatListRef.current) {
        // Small delay to ensure FlatList has rendered
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
          } catch (_error) {
            // Fallback: scroll to offset if scrollToIndex fails
            console.log('ScrollToIndex failed, using offset fallback');
            flatListRef.current?.scrollToOffset({ offset: index * 200, animated: true });
          }
        }, 300);
      }
    }
  }, [highlightedOrderId, filteredOrders]);

  // --- ACTIONS ---

  const handleDeleteOrder = (orderId: number) => {
    showConfirmation(
      t('confirmRemove'),
      t('confirmRemoveMsg'),
      async () => {
        if (!user) return;
        try {
          const now = new Date().toISOString();

          // Get the order to check user's role in it
          const { data: orderData } = await supabase
            .from('orders')
            .select('creator_id, client_id')
            .eq('id', orderId)
            .single();

          if (!orderData) throw new Error('Order not found');

          // Determine which field to update based on user's role in this order
          const isCreator = orderData.creator_id === user.uid;
          const updateField = isCreator ? 'deleted_by_creator' : 'deleted_by_client';

          // Per-user soft delete: Only mark as deleted by current user
          // The order remains visible to the other user until they also delete it
          // Note: The constraint likely requires deleted_by to be set when deleted_at is set
          const { data, error } = await supabase
            .from('orders')
            .update({
              [updateField]: user.uid,
              deleted_by: user.uid,
              deleted_at: now,
              is_deleted: true
            })
            .eq('id', orderId)
            .or(`client_id.eq.${user.uid},creator_id.eq.${user.uid}`)
            .select();

          if (error) throw error;

          if (!data || data.length === 0) {
            throw new Error('Order not found or you do not have permission to delete it');
          }

          // Remove from local state (frontend only)
          setOrders(prev => prev.filter(o => o.id !== orderId));
          setFilteredOrders(prev => prev.filter(o => o.id !== orderId));
          showAlert("Success", "Order removed from your history.", "success");
        } catch (err: any) {
          console.error("Delete Error:", err);
          showAlert("Error", err.message || "Could not remove order.", "error");
        }
      },
      "Remove"
    );
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus, extraData = {}) => {
    if (!user) return false;
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          last_updated_by: user.uid,
          updated_at: now,
          ...extraData
        })
        .eq('id', orderId);

      if (error) throw error;

      fetchOrders();
      refreshOrderCount();
      return true;
    } catch (err: any) {
      showAlert('Error', err.message, 'error');
      return false;
    }
  };

  // --- REBOOK LOGIC ---
  const initiateRebook = (item: Order) => {
    setSelectedOrder(item);
    setRebookVisible(true);
  };

  const performRebook = async () => {
    if (!user || !selectedOrder) return;
    setRebookVisible(false);

    try {
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('client_id', user.uid)
        .eq('creator_id', selectedOrder.creator_id)
        .eq('service_title', selectedOrder.service_title)
        .in('status', ['pending', 'accepted', 'in_progress', 'delivered']);

      if (existing && existing.length > 0) {
        showAlert(t('orderActive'), t('orderActiveMsg'), 'error');
        return;
      }

      const now = new Date().toISOString();
      const { error } = await supabase.from('orders').insert({
        client_id: user.uid,
        creator_id: selectedOrder.creator_id,
        service_title: selectedOrder.service_title,
        price: selectedOrder.price,
        status: 'pending',
        client_name: selectedOrder.client_name,
        creator_name: selectedOrder.creator_name,
        image_url: selectedOrder.image_url,
        last_updated_by: user.uid,
        updated_at: now
      });

      if (error) throw error;
      showAlert("Success", "Request sent! Waiting for creator approval.", 'success');
      fetchOrders();
    } catch (err: any) {
      showAlert("Error", err.message, 'error');
    }
  };

  // --- PAYMENT FLOW (CLIENT) ---
  const handleAccept = async (id: number) => {
    // Set estimated completion days (default to 7 days if not specified)
    const success = await updateOrderStatus(id, 'accepted', {
      estimated_completion_days: 7 // TODO: Get from service details
    });
    if (success) showAlert('Request Accepted', 'Client has been notified to proceed with payment.');
  };

  const confirmAcceptOrder = async () => {
    if (!orderToAccept) return;
    setShowAcceptConfirmModal(false);
    await handleAccept(orderToAccept.id);
    setOrderToAccept(null);
  };

  const confirmRejectOrder = async () => {
    if (!orderToReject) return;
    setShowRejectConfirmModal(false);
    await updateOrderStatus(orderToReject.id, 'rejected');
    setOrderToReject(null);
  };

  const openPayment = async (order: Order) => {
    setSelectedOrder(order);
    setDeadlineDays(order.estimated_completion_days?.toString() || '7'); // Default to estimated or 7 days
    setDeadlineHours('0');
    setDeadlineMinutes('0');
    setPaymentModalVisible(true);

    try {
      const { data: creatorWallets } = await supabase
        .from('user_wallets')
        .select('wallet_type')
        .eq('user_id', order.creator_id)
        .eq('is_active', true);

      if (creatorWallets && creatorWallets.length > 0) {
        setCreatorAllowedMethods(creatorWallets.map(w => w.wallet_type));
      } else {
        setCreatorAllowedMethods([]);
      }
    } catch (err) {
      console.error("Error fetching creator wallets", err);
      setCreatorAllowedMethods([]);
    }
  };

  const confirmPayment = async (method: string) => {
    if (!selectedOrder) return;

    // Validate deadline days, hours, minutes
    const days = parseInt(deadlineDays, 10) || 0;
    const hours = parseInt(deadlineHours, 10) || 0;
    const minutes = parseInt(deadlineMinutes, 10) || 0;

    if (isNaN(days) || days < 0 || days > 60) {
      showAlert(t('invalidDeadline'), 'Days must be between 0-60', 'error');
      return;
    }
    if (isNaN(hours) || hours < 0 || hours > 23) {
      showAlert('Invalid Deadline', 'Hours must be between 0-23', 'error');
      return;
    }
    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
      showAlert('Invalid Deadline', 'Minutes must be between 0-59', 'error');
      return;
    }
    if (days === 0 && hours === 0 && minutes === 0) {
      showAlert('Invalid Deadline', 'Deadline must be at least 1 minute', 'error');
      return;
    }

    setPaymentModalVisible(false);

    // Calculate due date using client-selected time
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    dueDate.setHours(dueDate.getHours() + hours);
    dueDate.setMinutes(dueDate.getMinutes() + minutes);

    // Parse price to number for escrow amount
    const escrowAmount = parseFloat(selectedOrder.price.replace(/[^0-9.]/g, ''));

    const success = await updateOrderStatus(selectedOrder.id, 'in_progress', {
      payment_method_used: method,
      due_date: dueDate.toISOString(),
      escrow_status: 'held',
      escrow_amount: escrowAmount,
      work_started_at: new Date().toISOString()
    });

    if (success) {
      showAlert('Payment Successful', `Paid via ${method}. Funds are held in escrow until delivery.`);
      // Refresh orders to show new deadline and escrow components
      fetchOrders();
    }
  };

  // --- DELIVERY FLOW (CREATOR) ---
  const openUpload = (order: Order) => {
    setSelectedOrder(order);
    setPreviewLink('');
    setFinalLink('');
    setPreviewFile(null);
    setFinalFile(null);
    setUploadModalVisible(true);
  };

  const pickDocument = async (type: 'preview' | 'final') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size && file.size > 5 * 1024 * 1024) {
          showAlert(t('fileTooLarge'), "Max file size is 5MB. Please upload a link instead.", 'error');
          return;
        }
        if (type === 'preview') setPreviewFile(file);
        else setFinalFile(file);
      }
    } catch (err) {
      console.log('Picker Error', err);
    }
  };

  const validateLink = (url: string) => {
    const dropboxRegex = /dropbox\.com/;
    const driveRegex = /drive\.google\.com/;
    return dropboxRegex.test(url) || driveRegex.test(url);
  };

  const submitUpload = async () => {
    if (!selectedOrder) return;
    let pUrl = '';
    let fUrl = '';
    setIsSubmitting(true);

    if (uploadType === 'link') {
      if (!previewLink || !finalLink) {
        setIsSubmitting(false);
        showAlert(t('missingLinks'), "Please provide both Preview and Final links.", 'warning');
        return;
      }
      if (!validateLink(previewLink) || !validateLink(finalLink)) {
        setIsSubmitting(false);
        showAlert(t('error'), t('securityLinks'), 'error');
        return;
      }
      pUrl = previewLink;
      fUrl = finalLink;
    } else {
      if (!previewFile || !finalFile) {
        setIsSubmitting(false);
        showAlert("Missing Files", "Please upload both Preview and Final files.", 'warning');
        return;
      }
      try {
        const previewExt = previewFile.name.split('.').pop();
        const previewPath = `${selectedOrder.id}/preview_${Date.now()}.${previewExt}`;
        const previewResponse = await fetch(previewFile.uri);
        const previewBlob = await previewResponse.arrayBuffer();

        const { error: pError } = await supabase.storage.from('orders').upload(previewPath, previewBlob, { contentType: previewFile.mimeType });
        if (pError) throw pError;
        const { data: pData } = supabase.storage.from('orders').getPublicUrl(previewPath);
        pUrl = pData.publicUrl;

        const finalExt = finalFile.name.split('.').pop();
        const finalPath = `${selectedOrder.id}/final_${Date.now()}.${finalExt}`;
        const finalResponse = await fetch(finalFile.uri);
        const finalBlob = await finalResponse.arrayBuffer();

        const { error: fError } = await supabase.storage.from('orders').upload(finalPath, finalBlob, { contentType: finalFile.mimeType });
        if (fError) throw fError;
        const { data: fData } = supabase.storage.from('orders').getPublicUrl(finalPath);
        fUrl = fData.publicUrl;

      } catch (uploadError: any) {
        console.error(uploadError);
        setIsSubmitting(false);
        showAlert("Upload Failed", uploadError.message || "Could not upload files.", 'error');
        return;
      }
    }

    const success = await updateOrderStatus(selectedOrder.id, 'delivered', {
      preview_url: pUrl,
      final_file_url: fUrl
    });

    setIsSubmitting(false);
    if (success) {
      setUploadModalVisible(false);
      showAlert('Submitted', 'Work delivered! Client will review the preview.');
    }
  };

  // --- REVIEW FLOW (CLIENT) ---
  const openPreview = (order: Order) => {
    setSelectedOrder(order);
    setPreviewModalVisible(true);
  };

  const openLink = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  const confirmCompletion = async () => {
    if (!selectedOrder) return;

    setPreviewModalVisible(false);
    setShowCompleteConfirmModal(true);
  };

  const finalizeCompletion = async () => {
    if (!selectedOrder) return;

    setShowCompleteConfirmModal(false);

    // Release escrow when client approves delivery
    const success = await updateOrderStatus(selectedOrder.id, 'completed', {
      escrow_status: 'released_to_creator'
    });

    if (success) {
      showAlert('Payment Released', 'Transaction complete! Payment has been released to creator.');
      fetchOrders(); // Refresh to show updated escrow status
    }
  };

  // --- SMART REVIEW LOGIC ---
  const openReviewModal = async (order: Order) => {
    setSelectedOrder(order);
    setReviewRating(5);
    setReviewComment('');
    setExistingReviewId(null);

    if (user) {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('order_id', order.id)
        .eq('reviewer_id', user.uid)
        .maybeSingle();

      if (data) {
        setReviewRating(data.rating);
        setReviewComment(data.comment);
        setExistingReviewId(data.id);
      }
    }
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!selectedOrder || !user) return;
    if (!reviewComment.trim()) return showAlert("Error", "Please write a comment.", 'error');

    try {
      if (existingReviewId) {
        const { error } = await supabase.from('reviews').update({
          rating: reviewRating,
          comment: reviewComment
        }).eq('id', existingReviewId);
        if (error) throw error;
        showAlert("Success", "Review updated successfully!");
      } else {
        const { error } = await supabase.from('reviews').insert({
          reviewer_id: user.uid,
          reviewee_id: selectedOrder.creator_id,
          order_id: selectedOrder.id,
          rating: reviewRating,
          comment: reviewComment
        });
        if (error) throw error;
        showAlert("Success", "Review posted successfully!");
      }
      setReviewModalVisible(false);
    } catch (err: any) {
      showAlert("Error", err.message, 'error');
    }
  };

  // --- RENDER HELPERS ---
  const handleChat = (partnerId: string) => {
    router.push(`/chat/${partnerId}`);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'accepted': return '#f59e0b'; // Amber
      case 'in_progress': return '#3b82f6'; // Blue
      case 'delivered': return '#8b5cf6'; // Purple
      case 'completed': return '#10b981'; // Green
      case 'refunded': return '#3b82f6'; // Blue (refund processed)
      case 'cancelled': return '#ef4444'; // Red
      case 'rejected': return '#ef4444';
      default: return '#64748b'; // Slate (Pending)
    }
  };

  const themeStyles = {
    container: { backgroundColor: theme.background },
    header: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    input: { backgroundColor: theme.inputBackground, color: theme.text },
    pillActive: { backgroundColor: theme.text, borderColor: theme.text },
    pillInactive: { backgroundColor: theme.card, borderColor: theme.cardBorder },
    pillTextActive: { color: theme.background },
    pillTextInactive: { color: theme.text },
    modalBg: { backgroundColor: theme.card },
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.status);
    const otherName = role === 'client' ? item.creator_name : item.client_name;
    const otherId = role === 'client' ? item.creator_id : item.client_id;
    const label = role === 'client' ? 'Creator' : 'Client';

    const isNew = lastSeenTime && item.updated_at
      && new Date(item.updated_at) > new Date(lastSeenTime)
      && item.last_updated_by !== user?.uid;

    // Formatting Status Text
    let statusText = item.status?.toUpperCase() || 'PENDING';
    if (item.status === 'accepted') statusText = 'WAITING PAYMENT';
    if (item.status === 'in_progress') statusText = 'IN PROGRESS';
    if (item.status === 'delivered') statusText = 'IN REVIEW';
    // Handle refunded status (new way) OR old cancelled orders with escrow refunded
    if (item.status === 'refunded' || ((item as any).escrow_status === 'refunded_to_client' && item.status === 'cancelled')) {
      statusText = 'REFUNDED';
    }

    // Determine if order can be deleted from history
    const isDeletable = ['cancelled', 'rejected', 'completed', 'refunded'].includes(item.status);

    const isHighlighted = highlightedOrderId === item.id;

    return (
      <View style={[styles.card, themeStyles.card, isHighlighted && { borderColor: theme.tint, borderWidth: 2, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }]}>
        {isNew && <View style={styles.notificationDot} />}

        {/* --- 1. CARD HEADER (Image, Title, Trash) --- */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {item.image_url && item.image_url !== '' ? (
              <Image source={{ uri: item.image_url }} style={styles.orderImage} resizeMode="cover" />
            ) : (
              <View style={[styles.serviceIcon, { backgroundColor: isDark ? '#333' : '#e2e8f0' }]}>
                <Ionicons name="briefcase-outline" size={24} color={theme.text} />
              </View>
            )}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.serviceTitle, themeStyles.text]} numberOfLines={1}>
                {item.service_title}
              </Text>
              <Text style={[styles.partnerName, themeStyles.textSecondary]} numberOfLines={1}>
                {label}: {otherName || 'Unknown'}
              </Text>
            </View>
          </View>

          {/* DELETE BUTTON (Conditionally rendered) */}
          {isDeletable && (
            <Pressable onPress={() => handleDeleteOrder(item.id)} style={{ padding: 8, marginLeft: 4 }}>
              <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* --- 2. STATUS & PRICE --- */}
        <View style={[styles.infoRow, { marginBottom: 12 }]}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          <Text style={[styles.priceText, themeStyles.text]}>₱ {item.price}</Text>
        </View>

        {/* --- NEW: DEADLINE & ESCROW MANAGEMENT --- */}
        {item.due_date && item.status === 'in_progress' && (
          <DeadlineManager
            order={item}
            userRole={role}
            onRequestExtension={role === 'creator' ? () => {
              setSelectedOrderForAction(item);
              setExtensionModalVisible(true);
            } : undefined}
            onReviewExtension={role === 'client' ? () => handleReviewExtension(item) : undefined}
            onRequestRefund={role === 'client' ? () => {
              setSelectedOrderForAction(item);
              setRefundModalVisible(true);
            } : undefined}
            onRespondToRefund={role === 'creator' ? () => {
              setSelectedOrderForAction(item);
              setRefundResponseModalVisible(true);
            } : undefined}
            onOpenChat={() => handleChat(otherId)}
          />
        )}

        {item.escrow_status && ['in_progress', 'delivered', 'completed'].includes(item.status) && (
          <EscrowManager order={item} userRole={role} />
        )}

        {/* --- 3. CONTEXT MESSAGE (Optional) --- */}
        {item.status === 'delivered' && role === 'client' && (
          <View style={[styles.infoBox, { backgroundColor: theme.inputBackground, marginTop: 12 }]}>
            <Ionicons name="gift-outline" size={16} color={theme.text} />
            <Text style={[themeStyles.text, { marginLeft: 8, fontSize: 13 }]}>Work delivered. Please review.</Text>
          </View>
        )}

        {/* --- 4. SMART ACTION BAR (Footer) --- */}
        <View style={styles.actionFooter}>
          {/* A. CHAT BUTTON (Always visible unless cancelled/rejected/refunded) */}
          {item.status !== 'cancelled' && item.status !== 'rejected' && item.status !== 'refunded' && (
            <Pressable
              style={[styles.iconActionBtn, { borderColor: theme.cardBorder }]}
              onPress={() => handleChat(otherId)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.text} />
            </Pressable>
          )}

          {/* B. PRIMARY ACTION BUTTON (Context Aware) */}

          {/* Pending: Client Cancels / Creator Accepts */}
          {item.status === 'pending' && (
            role === 'creator' ? (
              <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                <Pressable style={[styles.mainActionBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)' }]} onPress={() => {
                  setOrderToReject(item);
                  setShowRejectConfirmModal(true);
                }}>
                  <Text style={{ color: '#ef4444', fontWeight: '600' }}>Reject</Text>
                </Pressable>
                <Pressable style={[styles.mainActionBtn, { backgroundColor: '#10b981' }]} onPress={() => {
                  setOrderToAccept(item);
                  setShowAcceptConfirmModal(true);
                }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Accept</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.mainActionBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)' }]}
                onPress={() => {
                  setOrderToCancel(item);
                  setShowCancelConfirmModal(true);
                }}
              >
                <Text style={{ color: '#ef4444', fontWeight: '600' }}>Cancel Request</Text>
              </Pressable>
            )
          )}

          {/* Accepted: Client Pays */}
          {item.status === 'accepted' && role === 'client' && (
            <Pressable style={[styles.mainActionBtn, { backgroundColor: theme.tint }]} onPress={() => openPayment(item)}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Pay Now</Text>
            </Pressable>
          )}

          {/* In Progress: Creator Submits */}
          {item.status === 'in_progress' && role === 'creator' && (
            <Pressable style={[styles.mainActionBtn, { backgroundColor: theme.tint }]} onPress={() => openUpload(item)}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Submit Work</Text>
            </Pressable>
          )}

          {/* Delivered: Client Reviews */}
          {item.status === 'delivered' && role === 'client' && (
            <Pressable style={[styles.mainActionBtn, { backgroundColor: '#10b981' }]} onPress={() => openPreview(item)}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Review & Release</Text>
            </Pressable>
          )}

          {/* Client Download & Rate */}
          {item.status === 'completed' && role === 'client' && (
            <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
              <Pressable style={[styles.mainActionBtn, { backgroundColor: theme.inputBackground }]} onPress={() => openLink(item.final_file_url)}>
                <Ionicons name="download-outline" size={18} color={theme.text} style={{ marginRight: 4 }} />
                <Text style={{ color: theme.text, fontWeight: '600' }}>File</Text>
              </Pressable>
              <Pressable style={[styles.mainActionBtn, { backgroundColor: '#fbbf24' }]} onPress={() => openReviewModal(item)}>
                <Ionicons name="star" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Rate</Text>
              </Pressable>
              <Pressable style={[styles.iconActionBtn, { borderColor: theme.cardBorder, backgroundColor: theme.tint }]} onPress={() => initiateRebook(item)}>
                <Ionicons name="reload" size={20} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* Waiting State */}
          {((item.status === 'accepted' && role !== 'client') ||
            (item.status === 'in_progress' && role !== 'creator') ||
            (item.status === 'delivered' && role !== 'client')) && (
              <View style={[styles.mainActionBtn, { backgroundColor: theme.inputBackground, opacity: 0.7 }]}>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Waiting for partner...</Text>
              </View>
            )}

          {/* Cancelled/Rejected/Refunded State Placeholder */}
          {(item.status === 'cancelled' || item.status === 'rejected' || item.status === 'refunded') && (
            <View style={[styles.mainActionBtn, { backgroundColor: theme.inputBackground, opacity: 0.7 }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {item.status === 'rejected' ? 'Request Rejected' :
                  item.status === 'refunded' ? 'Order Refunded' : 'Order Cancelled'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const emptyTitle = role === 'creator' ? 'No Gigs Found' : t('noOrders');
  const emptySubtitle = role === 'creator' ? 'Services you offer will appear here once booked.' : 'Your order history will appear here.';
  const getAlertStyle = () => {
    switch (alertConfig.type) {
      case 'error': return { color: '#ef4444', icon: 'close-circle' as const, bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)' };
      case 'warning': return { color: '#f59e0b', icon: 'alert-circle' as const, bg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.08)' };
      case 'confirm': return { color: '#ef4444', icon: 'trash-bin' as const, bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)' };
      default: return { color: '#10b981', icon: 'checkmark-circle' as const, bg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.08)' };
    }
  };
  const alertStyle = getAlertStyle();

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, themeStyles.text]}>
            {role === 'creator' ? t('myGigs') : t('myOrders')}
          </Text>
          <Pressable onPress={() => setIsSearchVisible(!isSearchVisible)} style={styles.iconButton}>
            <Ionicons name="search" size={24} color={theme.text} />
          </Pressable>
        </View>

        {isSearchVisible && (
          <View style={[styles.searchBarContainer, themeStyles.input]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              placeholder={role === 'creator' ? 'Search gigs...' : t('searchOrders')}
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </View>

      {/* PILL FILTERS */}
      <View style={styles.pillContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
          {(['All', 'Pending', 'Active', 'Completed', 'Refunded', 'Cancelled'] as FilterType[]).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                style={[
                  styles.pill,
                  isActive ? themeStyles.pillActive : themeStyles.pillInactive
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.pillText, isActive ? themeStyles.pillTextActive : themeStyles.pillTextInactive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        ref={flatListRef}
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
        bounces={true}
        overScrollMode="always"
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 100);
        }}
        ListEmptyComponent={
          loading ? (
            // SKELETON LOADING STATE
            <View>
              {[1, 2, 3].map(i => (
                <View key={i} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    <SkeletonItem width={48} height={48} borderRadius={10} />
                    <View style={{ marginLeft: 12, justifyContent: 'space-around' }}>
                      <SkeletonItem width={120} height={16} />
                      <SkeletonItem width={80} height={12} />
                    </View>
                  </View>
                  {/* Status/Price */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    <SkeletonItem width={60} height={20} />
                    <SkeletonItem width={50} height={20} />
                  </View>
                  {/* Footer */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <SkeletonItem width={48} height={48} borderRadius={14} />
                    <SkeletonItem width="80%" height={48} borderRadius={14} style={{ flex: 1 }} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={80} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, themeStyles.text]}>{emptyTitle}</Text>
              <Text style={[styles.emptySubtitle, themeStyles.textSecondary]}>{emptySubtitle}</Text>
            </View>
          )
        }
      />

      {/* 1. PAYMENT MODAL */}
      <Modal visible={paymentModalVisible} transparent animationType="slide" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, themeStyles.modalBg]}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Complete Payment</Text>
            <Text style={[styles.modalDesc, themeStyles.textSecondary]}>
              Total to Pay: <Text style={{ fontWeight: 'bold', color: theme.text }}>₱ {selectedOrder?.price}</Text>
            </Text>

            {/* Deadline Selection */}
            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={[styles.label, themeStyles.text, { marginBottom: 8 }]}>Set Deadline</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }]}>Days</Text>
                  <TextInput
                    style={[styles.modalInput, themeStyles.input]}
                    value={deadlineDays}
                    onChangeText={setDeadlineDays}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }]}>Hours</Text>
                  <TextInput
                    style={[styles.modalInput, themeStyles.input]}
                    value={deadlineHours}
                    onChangeText={setDeadlineHours}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }]}>Minutes</Text>
                  <TextInput
                    style={[styles.modalInput, themeStyles.input]}
                    value={deadlineMinutes}
                    onChangeText={setDeadlineMinutes}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
              <Text style={[{ fontSize: 12, color: theme.textSecondary }]}>
                Due: {(() => {
                  const days = parseInt(deadlineDays, 10) || 0;
                  const hours = parseInt(deadlineHours, 10) || 0;
                  const minutes = parseInt(deadlineMinutes, 10) || 0;
                  const date = new Date();
                  date.setDate(date.getDate() + days);
                  date.setHours(date.getHours() + hours);
                  date.setMinutes(date.getMinutes() + minutes);
                  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                })()}
              </Text>
            </View>

            <Text style={[styles.label, themeStyles.text, { marginBottom: 10 }]}>Select Payment Method</Text>
            <View style={{ width: '100%', gap: 10, marginBottom: 20 }}>
              {clientPaymentMethods.filter(pm => creatorAllowedMethods.includes(pm.method_type)).length > 0 ? (
                clientPaymentMethods
                  .filter(pm => creatorAllowedMethods.includes(pm.method_type))
                  .map((pm, idx) => (
                    <Pressable key={idx} onPress={() => confirmPayment(`${pm.method_type} ending in ${pm.masked_number.slice(-4)}`)} style={[styles.paymentOption, { borderColor: theme.cardBorder }]}>
                      <Ionicons name={
                        pm.method_type === 'Credit Card' ? 'card' :
                          pm.method_type === 'PayPal' ? 'logo-paypal' :
                            pm.method_type === 'Bank Transfer' ? 'business' : 'wallet'
                      } size={20} color={theme.text} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.paymentText, themeStyles.text]}>{pm.method_type}</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>{pm.masked_number}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                    </Pressable>
                  ))
              ) : (
                <View style={{ alignItems: 'center', padding: 20 }}>
                  <Ionicons name="alert-circle-outline" size={40} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10 }}>
                    The creator only accepts: {creatorAllowedMethods.join(', ') || 'No active methods'}.
                  </Text>
                  <Pressable onPress={() => { setPaymentModalVisible(false); router.push('/(tabs)/profile'); }} style={[styles.modalButton, { backgroundColor: theme.tint, marginTop: 16 }]}>
                    <Text style={styles.modalButtonText}>Go to Profile</Text>
                  </Pressable>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPaymentModalVisible(false)}>
              <Text style={[styles.closeButtonText, themeStyles.textSecondary]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. UPLOAD MODAL */}
      <Modal visible={uploadModalVisible} transparent animationType="slide" onRequestClose={() => setUploadModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, themeStyles.modalBg]}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Submit Work</Text>
            <View style={styles.tabRow}>
              <Pressable onPress={() => setUploadType('file')} style={[styles.tabBtn, uploadType === 'file' && { backgroundColor: theme.tint }]}>
                <Text style={[styles.tabText, uploadType === 'file' ? { color: '#fff' } : themeStyles.text]}>Upload File</Text>
              </Pressable>
              <Pressable onPress={() => setUploadType('link')} style={[styles.tabBtn, uploadType === 'link' && { backgroundColor: theme.tint }]}>
                <Text style={[styles.tabText, uploadType === 'link' ? { color: '#fff' } : themeStyles.text]}>Share Link</Text>
              </Pressable>
            </View>
            {uploadType === 'link' ? (
              <>
                <Text style={[styles.label, themeStyles.text]}>Preview URL</Text>
                <TextInput style={[styles.modalInput, themeStyles.input]} placeholder="https://..." placeholderTextColor={theme.textSecondary} value={previewLink} onChangeText={setPreviewLink} />
                <Text style={[styles.label, themeStyles.text]}>Final File URL</Text>
                <TextInput style={[styles.modalInput, themeStyles.input]} placeholder="https://..." placeholderTextColor={theme.textSecondary} value={finalLink} onChangeText={setFinalLink} />
              </>
            ) : (
              <>
                <Text style={[styles.label, themeStyles.text]}>Preview File</Text>
                <Pressable onPress={() => pickDocument('preview')} style={[styles.fileBtn, { borderColor: theme.cardBorder }]}>
                  <Ionicons name={previewFile ? "checkmark-circle" : "cloud-upload-outline"} size={24} color={previewFile ? theme.tint : theme.textSecondary} />
                  <Text style={[themeStyles.text, { marginLeft: 8 }]}>{previewFile ? previewFile.name : "Choose File"}</Text>
                </Pressable>
                <Text style={[styles.label, themeStyles.text]}>Final File</Text>
                <Pressable onPress={() => pickDocument('final')} style={[styles.fileBtn, { borderColor: theme.cardBorder }]}>
                  <Ionicons name={finalFile ? "checkmark-circle" : "lock-closed-outline"} size={24} color={finalFile ? theme.tint : theme.textSecondary} />
                  <Text style={[themeStyles.text, { marginLeft: 8 }]}>{finalFile ? finalFile.name : "Choose File"}</Text>
                </Pressable>
              </>
            )}
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.tint, marginTop: 20 }]} onPress={submitUpload} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Submit Delivery</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setUploadModalVisible(false)}>
              <Text style={[styles.closeButtonText, themeStyles.textSecondary]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. PREVIEW MODAL */}
      <Modal visible={previewModalVisible} transparent animationType="slide" onRequestClose={() => setPreviewModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, themeStyles.modalBg]}>
            <View style={[styles.iconCircle, { backgroundColor: '#10b98115' }]}>
              <Ionicons name="gift-outline" size={40} color="#10b981" />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Order Delivered!</Text>
            <View style={[styles.filePreview, { backgroundColor: theme.inputBackground }]}>
              <Ionicons name="document-text" size={24} color={theme.text} />
              <Text style={[themeStyles.text, { flex: 1, marginHorizontal: 10, fontWeight: '600' }]} numberOfLines={1}>Preview</Text>
              <TouchableOpacity onPress={() => openLink(selectedOrder?.preview_url)} style={{ padding: 8, backgroundColor: theme.tint, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>VIEW</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#10b981' }]} onPress={confirmCompletion}>
              <Text style={styles.modalButtonText}>Release Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPreviewModalVisible(false)}>
              <Text style={[styles.closeButtonText, themeStyles.textSecondary]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. REVIEW MODAL */}
      <Modal visible={reviewModalVisible} transparent animationType="slide" onRequestClose={() => setReviewModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, themeStyles.modalBg]}>
            <Text style={[styles.modalTitle, themeStyles.text]}>{existingReviewId ? "Edit Review" : "Rate Creator"}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setReviewRating(star)}>
                  <Ionicons name={star <= reviewRating ? "star" : "star-outline"} size={32} color="#fbbf24" />
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.modalInput, themeStyles.input, { height: 100 }]}
              placeholder="Describe your experience..."
              placeholderTextColor={theme.textSecondary}
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
            />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.tint }]} onPress={submitReview}>
              <Text style={styles.modalButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setReviewModalVisible(false)}>
              <Text style={[styles.closeButtonText, themeStyles.textSecondary]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. REBOOK MODAL */}
      <Modal visible={rebookVisible} transparent animationType="fade" onRequestClose={() => setRebookVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, themeStyles.modalBg, { borderColor: theme.cardBorder, borderWidth: 1 }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.tint + '15' }]}>
              <Ionicons name="refresh-circle" size={64} color={theme.tint} />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Book Again?</Text>
            <Text style={[styles.modalDesc, themeStyles.textSecondary]}>
              Send a new request for "{selectedOrder?.service_title}"?
            </Text>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.tint }]} onPress={performRebook}>
              <Text style={styles.modalButtonText}>Yes, Send Request</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setRebookVisible(false)}>
              <Text style={[styles.closeButtonText, themeStyles.textSecondary]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. ALERT MODAL */}
      <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={closeAlert}>
        <View style={styles.modalOverlay}>
          <View style={[styles.alertCard, themeStyles.card]}>

            {/* ICON HEADER */}
            <View style={[styles.alertIconContainer, { backgroundColor: alertStyle.bg }]}>
              <Ionicons name={alertStyle.icon} size={36} color={alertStyle.color} />
            </View>

            {/* TEXT CONTENT */}
            <Text style={[styles.alertTitle, themeStyles.text]}>{alertConfig.title}</Text>
            <Text style={[styles.alertMessage, themeStyles.textSecondary]}>
              {alertConfig.message}
            </Text>

            {/* ACTION BUTTONS */}
            {alertConfig.type === 'confirm' ? (
              <View style={styles.alertButtonRow}>
                <Pressable
                  style={[styles.alertBtn, styles.alertBtnCancel, { backgroundColor: theme.inputBackground }]}
                  onPress={alertConfig.onCancel}
                >
                  <Text style={[styles.alertBtnText, themeStyles.text]}>{alertConfig.cancelText || 'Cancel'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.alertBtn, { backgroundColor: alertStyle.color }]}
                  onPress={alertConfig.onConfirm}
                >
                  <Text style={[styles.alertBtnText, { color: '#fff' }]}>{alertConfig.confirmText || 'Confirm'}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.alertBtnFull, { backgroundColor: theme.tint }]}
                onPress={alertConfig.onConfirm}
              >
                <Text style={[styles.alertBtnText, { color: '#fff' }]}>Okay</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* --- NEW: EXTENSION REQUEST MODAL --- */}
      <ExtensionRequestModal
        visible={extensionModalVisible}
        currentDueDate={selectedOrderForAction?.due_date || ''}
        onClose={() => {
          setExtensionModalVisible(false);
          // Don't clear selectedOrderForAction here - it's needed for confirmation modal
          // Only clear after the final action (send or cancel confirmation)
        }}
        onSubmit={handleRequestExtension}
      />

      {/* --- NEW: REFUND REQUEST MODAL --- */}
      {selectedOrderForAction && (
        <RefundRequestModal
          visible={refundModalVisible}
          order={selectedOrderForAction}
          onClose={() => {
            setRefundModalVisible(false);
            setSelectedOrderForAction(null);
          }}
          onSubmit={handleRequestRefund}
        />
      )}

      {/* --- NEW: REFUND RESPONSE MODAL (CREATOR) --- */}
      {selectedOrderForAction && (
        <RefundResponseModal
          visible={refundResponseModalVisible}
          order={selectedOrderForAction}
          onClose={() => {
            setRefundResponseModalVisible(false);
            setSelectedOrderForAction(null);
          }}
          onSubmit={handleRespondToRefund}
        />
      )}

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      <Modal visible={showCancelConfirmModal} transparent animationType="fade" onRequestClose={() => setShowCancelConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.alertCard, themeStyles.card]}>
            <View style={[styles.alertIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)' }]}>
              <Ionicons name="warning" size={36} color="#ef4444" />
            </View>
            <Text style={[styles.alertTitle, themeStyles.text]}>Cancel Order?</Text>
            <Text style={[styles.alertMessage, themeStyles.textSecondary]}>
              Are you sure you want to cancel "{orderToCancel?.service_title}"? This action cannot be undone.
            </Text>
            <View style={styles.alertButtonRow}>
              <Pressable
                style={[styles.alertBtn, styles.alertBtnCancel, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowCancelConfirmModal(false)}
              >
                <Text style={[styles.alertBtnText, themeStyles.text]}>Keep Order</Text>
              </Pressable>
              <Pressable
                style={[styles.alertBtn, { backgroundColor: '#ef4444' }]}
                onPress={confirmCancelOrder}
              >
                <Text style={[styles.alertBtnText, { color: '#fff' }]}>Yes, Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ACCEPT ORDER CONFIRMATION MODAL */}
      <Modal visible={showAcceptConfirmModal} transparent animationType="fade" onRequestClose={() => setShowAcceptConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.alertCard, themeStyles.card]}>
            <View style={[styles.alertIconContainer, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="checkmark-circle" size={36} color="#10b981" />
            </View>
            <Text style={[styles.alertTitle, themeStyles.text]}>Accept Order?</Text>
            <Text style={[styles.alertMessage, themeStyles.textSecondary]}>
              Accept "{orderToAccept?.service_title}"? The client will be notified to proceed with payment.
            </Text>
            <View style={styles.alertButtonRow}>
              <Pressable
                style={[styles.alertBtn, styles.alertBtnCancel, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowAcceptConfirmModal(false)}
              >
                <Text style={[styles.alertBtnText, themeStyles.text]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.alertBtn, { backgroundColor: '#10b981' }]}
                onPress={confirmAcceptOrder}
              >
                <Text style={[styles.alertBtnText, { color: '#fff' }]}>Accept Order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* REJECT ORDER CONFIRMATION MODAL */}
      <Modal visible={showRejectConfirmModal} transparent animationType="fade" onRequestClose={() => setShowRejectConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.alertCard, themeStyles.card]}>
            <View style={[styles.alertIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)' }]}>
              <Ionicons name="close-circle" size={36} color="#ef4444" />
            </View>
            <Text style={[styles.alertTitle, themeStyles.text]}>Reject Order?</Text>
            <Text style={[styles.alertMessage, themeStyles.textSecondary]}>
              Reject "{orderToReject?.service_title}"? The client will be notified.
            </Text>
            <View style={styles.alertButtonRow}>
              <Pressable
                style={[styles.alertBtn, styles.alertBtnCancel, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowRejectConfirmModal(false)}
              >
                <Text style={[styles.alertBtnText, themeStyles.text]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.alertBtn, { backgroundColor: '#ef4444' }]}
                onPress={confirmRejectOrder}
              >
                <Text style={[styles.alertBtnText, { color: '#fff' }]}>Reject Order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* COMPLETE ORDER CONFIRMATION MODAL */}
      <Modal visible={showCompleteConfirmModal} transparent animationType="fade" onRequestClose={() => setShowCompleteConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.alertCard, themeStyles.card]}>
            <View style={[styles.alertIconContainer, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="checkmark-circle" size={36} color="#10b981" />
            </View>
            <Text style={[styles.alertTitle, themeStyles.text]}>Release Payment?</Text>
            <Text style={[styles.alertMessage, themeStyles.textSecondary]}>
              Confirm that you're satisfied with the work. Payment will be released to the creator immediately.
            </Text>
            <View style={styles.alertButtonRow}>
              <Pressable
                style={[styles.alertBtn, styles.alertBtnCancel, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowCompleteConfirmModal(false)}
              >
                <Text style={[styles.alertBtnText, themeStyles.text]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.alertBtn, { backgroundColor: '#10b981' }]}
                onPress={finalizeCompletion}
              >
                <Text style={[styles.alertBtnText, { color: '#fff' }]}>Release</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXTENSION REQUEST CONFIRMATION MODAL */}
      <Modal visible={showExtensionConfirmModal} transparent animationType="fade" onRequestClose={() => setShowExtensionConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.alertCard, themeStyles.card]}>
            <View style={[styles.alertIconContainer, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="time" size={36} color="#3b82f6" />
            </View>
            <Text style={[styles.alertTitle, themeStyles.text]}>Submit Extension Request?</Text>
            {extensionRequestData && (
              <View style={{ gap: 8 }}>
                <Text style={[styles.alertMessage, themeStyles.textSecondary]}>
                  You're requesting additional time:
                </Text>
                <View style={{ backgroundColor: theme.inputBackground, padding: 12, borderRadius: 8, marginBottom: 4 }}>
                  <Text style={[{ fontSize: 14, fontWeight: '600', color: theme.text }]}>
                    {extensionRequestData.days > 0 && `${extensionRequestData.days} day${extensionRequestData.days > 1 ? 's' : ''}`}
                    {extensionRequestData.hours > 0 && (extensionRequestData.days > 0 ? ', ' : '') + `${extensionRequestData.hours} hour${extensionRequestData.hours > 1 ? 's' : ''}`}
                    {extensionRequestData.minutes > 0 && ((extensionRequestData.days > 0 || extensionRequestData.hours > 0) ? ', ' : '') + `${extensionRequestData.minutes} minute${extensionRequestData.minutes > 1 ? 's' : ''}`}
                  </Text>
                </View>
                <View style={{ backgroundColor: theme.inputBackground, padding: 12, borderRadius: 8 }}>
                  <Text style={[{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }]}>Reason:</Text>
                  <Text style={[{ fontSize: 13, color: theme.text }]}>{extensionRequestData.reason}</Text>
                </View>
                <Text style={[styles.alertMessage, themeStyles.textSecondary]}>
                  The client will review and approve or deny your request.
                </Text>
              </View>
            )}
            <View style={styles.alertButtonRow}>
              <Pressable
                style={[styles.alertBtn, styles.alertBtnCancel, { backgroundColor: theme.inputBackground }]}
                onPress={() => {
                  setShowExtensionConfirmModal(false);
                  setExtensionRequestData(null);
                  setSelectedOrderForAction(null); // Clear when user cancels
                }}
              >
                <Text style={[styles.alertBtnText, themeStyles.text]}>Go Back</Text>
              </Pressable>
              <Pressable
                style={[styles.alertBtn, { backgroundColor: '#3b82f6', opacity: isSubmittingExtension ? 0.6 : 1 }]}
                onPress={confirmExtensionRequest}
                disabled={isSubmittingExtension}
              >
                <Text style={[styles.alertBtnText, { color: '#fff' }]}>
                  {isSubmittingExtension ? 'Sending...' : 'Send Request'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXTENSION REVIEW MODAL (for clients) */}
      <Modal visible={showExtensionReviewModal} transparent animationType="fade" onRequestClose={() => setShowExtensionReviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.alertCard, themeStyles.card]}>
            <View style={[styles.alertIconContainer, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="hourglass" size={36} color="#f59e0b" />
            </View>
            <Text style={[styles.alertTitle, themeStyles.text]}>Extension Request</Text>
            {selectedOrderForAction && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.alertMessage, themeStyles.textSecondary]}>
                  The creator is requesting additional time:
                </Text>
                <View style={{ backgroundColor: theme.inputBackground, padding: 12, borderRadius: 8 }}>
                  <Text style={[{ fontSize: 14, fontWeight: '600', color: theme.text }]}>
                    {(() => {
                      // deadline_extension_days stores total minutes
                      const totalMinutes = selectedOrderForAction.deadline_extension_days || 0;
                      const days = Math.floor(totalMinutes / 1440);
                      const remainingMinutes = totalMinutes % 1440;
                      const hours = Math.floor(remainingMinutes / 60);
                      const minutes = remainingMinutes % 60;

                      let parts = [];
                      if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
                      if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
                      if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

                      return parts.length > 0 ? parts.join(', ') : '0 minutes';
                    })()}
                  </Text>
                </View>
                <View style={{ backgroundColor: theme.inputBackground, padding: 12, borderRadius: 8 }}>
                  <Text style={[{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }]}>Reason provided:</Text>
                  <Text style={[{ fontSize: 13, color: theme.text }]}>
                    {selectedOrderForAction.deadline_extension_reason || 'No reason provided'}
                  </Text>
                </View>
                <Text style={[{ fontSize: 12, color: theme.textSecondary, fontStyle: 'italic', marginBottom: 10 }]}>
                  Current deadline: {selectedOrderForAction.due_date ? new Date(selectedOrderForAction.due_date).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            )}
            <View style={styles.alertButtonRow}>
              <Pressable
                style={[styles.alertBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)', borderWidth: 1, borderColor: '#ef4444' }]}
                onPress={denyExtension}
              >
                <Text style={[styles.alertBtnText, { color: '#ef4444' }]}>Deny</Text>
              </Pressable>
              <Pressable
                style={[styles.alertBtn, { backgroundColor: '#10b981' }]}
                onPress={approveExtension}
              >
                <Text style={[styles.alertBtnText, { color: '#fff' }]}>Approve</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.lg,
    zIndex: 10
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  iconButton: { padding: 4 },
  searchBarContainer: { marginTop: 16, marginHorizontal: 24, borderRadius: 12, flexDirection: 'row', paddingHorizontal: 16, height: 48, alignItems: 'center' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, height: '100%' },
  pillContainer: {
    paddingTop: 24,
    paddingBottom: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: { padding: 24, paddingBottom: 40, flexGrow: 1 },
  notificationDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', zIndex: 10 },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...Shadows.lg,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#e2e8f0' },
  serviceIcon: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  serviceTitle: { fontSize: 16, fontWeight: '700' },
  partnerName: { fontSize: 12, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  priceText: { fontSize: 16, fontWeight: '700' },
  infoBox: { flexDirection: 'row', padding: 10, borderRadius: 8, alignItems: 'center' },
  actionFooter: { marginTop: 16, flexDirection: 'row', gap: 10 },
  iconActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', ...Shadows.xl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalButton: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeButton: { paddingVertical: 8 },
  closeButtonText: { fontSize: 15, fontWeight: '600' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderRadius: 16, width: '100%' },
  paymentText: { flex: 1, marginLeft: 12, fontWeight: '600', fontSize: 16 },
  modalInput: { width: '100%', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  filePreview: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, width: '100%', marginBottom: 10 },
  label: { alignSelf: 'flex-start', marginBottom: 6, fontWeight: '600', fontSize: 14 },
  tabRow: { flexDirection: 'row', width: '100%', marginBottom: 20, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontWeight: '600' },
  fileBtn: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Shadows.xl,
  },
  alertIconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  alertMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  alertButtonRow: { flexDirection: 'row', gap: 12, width: '100%' },
  alertBtn: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  alertBtnFull: { width: '100%', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  alertBtnCancel: { borderWidth: 0 },
  alertBtnText: { fontWeight: '600', fontSize: 15 },
});
