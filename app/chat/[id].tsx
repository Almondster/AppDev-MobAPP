import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadows } from '@/constants/theme';

type Message = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  is_read: boolean;
  is_deleted?: boolean;
  from_smart_match?: boolean;
  service_data?: {
    service_id: string;
    title: string;
    price: string;
    description: string;
    image_url: string | null;
    label: string;
  } | null;
};

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, prefilledMessage, fromSmartMatch } = params;
  const partnerId = Array.isArray(id) ? id[0] : id;
  const currentUser = auth.currentUser;

  // THEME HOOK
  const { theme, isDark } = useTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partnerName, setPartnerName] = useState('Chat');
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);
  const [partnerRole, setPartnerRole] = useState<'client' | 'creator'>('client');
  const [currentUserRole, setCurrentUserRole] = useState<'client' | 'creator'>('client');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [smartMatchMessage, setSmartMatchMessage] = useState<string | null>(null);

  // Modal States
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Search States
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searchActive, setSearchActive] = useState(false);

  // Block/Delete Modal States
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // New Restricted Modal State
  const [showCannotMessageModal, setShowCannotMessageModal] = useState(false);
  const [showGenerateServiceModal, setShowGenerateServiceModal] = useState(false);
  const [showBookingConfirmModal, setShowBookingConfirmModal] = useState(false);
  const [selectedServiceToBook, setSelectedServiceToBook] = useState<{ service_id: string, title: string, price: string } | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [requestedServiceIds, setRequestedServiceIds] = useState<Set<string>>(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [smartMatchMessageId, setSmartMatchMessageId] = useState<number | null>(null);
  const [hasRespondedToCurrentSmartMatch, setHasRespondedToCurrentSmartMatch] = useState(false);

  // SCROLLING & LAYOUT REFS
  const scrollViewRef = useRef<ScrollView>(null);
  const messageLayouts = useRef<{ [key: number]: number }>({});

  const [flexToggle, setFlexToggle] = useState(false);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setFlexToggle(false);
    });

    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setFlexToggle(true);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // Set prefilled message from smart-match AND detect it for creators
  useEffect(() => {
    // Check if fromSmartMatch is true (URL params come as strings)
    const smartMatchParam = Array.isArray(fromSmartMatch) ? fromSmartMatch[0] : fromSmartMatch;
    const isFromSmartMatch = smartMatchParam === 'true';

    if (prefilledMessage && isFromSmartMatch) {
      const msg = Array.isArray(prefilledMessage) ? prefilledMessage[0] : prefilledMessage;
      const decodedMsg = decodeURIComponent(msg);

      console.log('📨 Smart Match URL Params:', {
        message: decodedMsg.substring(0, 50) + '...',
        fromSmartMatch: smartMatchParam
      });

      // Always store as smart-match message
      setSmartMatchMessage(decodedMsg);
      console.log('✨ Smart Match Message Set from URL:', decodedMsg);

      // Only pre-fill input for new messages (when there are no messages yet)
      if (messages.length === 0) {
        setNewMessage(decodedMsg);
      }
    }
  }, [prefilledMessage, fromSmartMatch, messages.length]);

  // Detect smart-match message from existing chat (for creators who open chat later)
  useEffect(() => {
    console.log('🔎 Checking for smart-match in chat history:', {
      hasSmartMatchMessage: !!smartMatchMessage,
      messagesCount: messages.length,
      partnerId,
      currentUserId: currentUser?.uid
    });

    // Detect smart-match message from database field
    if (!smartMatchMessage && messages.length > 0 && partnerId && currentUser) {
      // Find the most recent smart-match message from partner
      const smartMatchMsg = messages
        .filter(m => m.sender_id === partnerId && m.from_smart_match === true)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (smartMatchMsg) {
        setSmartMatchMessage(smartMatchMsg.content);
        setSmartMatchMessageId(smartMatchMsg.id);
        console.log('✨ Smart Match Message detected from database:', smartMatchMsg.content.substring(0, 50) + '...');

        // Check if creator has already responded with a custom service AFTER this smart-match message
        const hasResponse = messages.some(m =>
          m.sender_id === currentUser.uid &&
          m.receiver_id === partnerId &&
          m.service_data?.service_id &&
          new Date(m.created_at) > new Date(smartMatchMsg.created_at)
        );
        setHasRespondedToCurrentSmartMatch(hasResponse);
      }
    }
  }, [messages, partnerId, currentUser, smartMatchMessage]);

  // Fetch current user role
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      if (!currentUser) return;
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('firebase_uid', currentUser.uid)
        .single();

      if (data) {
        setCurrentUserRole(data.role || 'client');
        console.log('👤 Current User Role:', data.role);
      }
    };
    fetchCurrentUserRole();
  }, [currentUser]);

  // Debug: Log banner visibility conditions
  useEffect(() => {
    console.log('🔍 Banner Conditions:', {
      hasSmartMatchMessage: !!smartMatchMessage,
      currentUserRole,
      partnerRole,
      shouldShow: !!(smartMatchMessage && currentUserRole === 'creator' && partnerRole === 'client')
    });
  }, [smartMatchMessage, currentUserRole, partnerRole]);

  // 1. Fetch Partner Info
  useEffect(() => {
    const fetchPartner = async () => {
      if (!partnerId) return;
      const { data } = await supabase
        .from('users')
        .select('full_name, avatar_url, role')
        .eq('firebase_uid', partnerId)
        .single();

      if (data) {
        setPartnerName(data.full_name || 'User');
        setPartnerAvatar(data.avatar_url);
        setPartnerRole(data.role || 'client');
      }
    };
    fetchPartner();
  }, [partnerId]);

  // 2. Initial Message Fetch
  useEffect(() => {
    if (!currentUser || !partnerId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.uid},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.uid})`)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
        const unreadIds = data
          .filter(m => m.receiver_id === currentUser.uid && !m.is_read && !m.is_deleted)
          .map(m => m.id);

        if (unreadIds.length > 0) {
          await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        }

        // Check for existing orders for custom services
        const customServiceMessages = data.filter(m => m.service_data?.service_id);

        if (customServiceMessages.length > 0) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, service_title, created_at')
            .eq('client_id', currentUser.uid)
            .eq('creator_id', partnerId);

          if (ordersData) {
            const requested = new Set<string>();
            customServiceMessages.forEach(msg => {
              if (msg.service_data?.service_id && msg.service_data?.title) {
                // Check if order was created AFTER this custom service message was sent
                const hasOrder = ordersData.some(order =>
                  order.service_title === msg.service_data!.title &&
                  new Date(order.created_at) >= new Date(msg.created_at)
                );
                if (hasOrder) {
                  requested.add(msg.service_data.service_id);
                }
              }
            });
            setRequestedServiceIds(requested);
          }
        }

        // Find the most recent smart-match message and check if responded
        const latestSmartMatch = data
          .filter(m => m.sender_id === partnerId && m.from_smart_match === true)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        if (latestSmartMatch) {
          setSmartMatchMessageId(latestSmartMatch.id);

          // Check if there's a custom service response AFTER this smart-match
          const hasResponse = data.some(m =>
            m.sender_id === currentUser.uid &&
            m.receiver_id === partnerId &&
            m.service_data?.service_id &&
            new Date(m.created_at) > new Date(latestSmartMatch.created_at)
          );
          setHasRespondedToCurrentSmartMatch(hasResponse);
        }
      }
      setLoading(false);
    };

    fetchMessages();
  }, [currentUser, partnerId, smartMatchMessageId]);

  // 3. Realtime Subscription 
  useEffect(() => {
    if (!currentUser || !partnerId) return;

    const channel = supabase
      .channel(`chat:${currentUser.uid}:${partnerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;

            // Filter: Ensure message belongs to this conversation
            const isRelevant =
              (newMsg.sender_id === currentUser.uid && newMsg.receiver_id === partnerId) ||
              (newMsg.sender_id === partnerId && newMsg.receiver_id === currentUser.uid);

            if (isRelevant) {
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              // If this is a custom service from current user, mark smart-match as responded
              if (newMsg.sender_id === currentUser.uid && newMsg.service_data?.service_id && smartMatchMessageId) {
                setHasRespondedToCurrentSmartMatch(true);
              }

              // If this is a new smart-match message from partner, show banner
              if (newMsg.sender_id === partnerId && newMsg.from_smart_match === true) {
                setSmartMatchMessage(newMsg.content);
                setSmartMatchMessageId(newMsg.id);
                setHasRespondedToCurrentSmartMatch(false);
              }

              // IF I AM THE RECEIVER: Mark as read immediately
              // This triggers an UPDATE event that the Sender will see
              if (newMsg.receiver_id === currentUser.uid && !newMsg.is_deleted) {
                await supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
              }
            }
          }
          // Message Read Status Changed or Deleted
          else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message;
            setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, partnerId]);

  // 4. Auto-Scroll Logic
  useEffect(() => {
    // Only auto-scroll if we aren't actively searching/scrolling back in history
    if (messages.length > 0 && !searchActive) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, searchActive]);

  // Search Logic
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setSearchActive(false);
      return;
    }
    const results = messages.filter(message =>
      !message.is_deleted && message.content.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    setSearchActive(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchActive(false);
  };

  const scrollToMessage = (messageId: number) => {
    setShowSearch(false);
    clearSearch();

    // We disable auto-scroll momentarily by setting searchActive false *after* jump? 
    // Actually, we just jump. The user can scroll down to resume auto-scroll behavior.

    const yOffset = messageLayouts.current[messageId];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  const sendMessage = async (imageUrl: string | null = null) => {
    if ((!newMessage.trim() && !imageUrl) || !currentUser || !partnerId) return;

    if (!imageUrl) setSending(true);

    try {
      const { data: blockCheck } = await supabase
        .from('blocks')
        .select('*')
        .or(`and(blocker_id.eq.${partnerId},blocked_id.eq.${currentUser.uid}),and(blocker_id.eq.${currentUser.uid},blocked_id.eq.${partnerId})`)
        .single();

      if (blockCheck) {
        setShowCannotMessageModal(true);
        setSending(false);
        return;
      }

      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.uid,
        receiver_id: partnerId,
        content: newMessage.trim(),
        media_url: imageUrl,
        is_read: false,
        from_smart_match: !!(smartMatchMessage && newMessage.trim() === smartMatchMessage.trim())
      });

      if (error) throw error;
      setNewMessage('');
    } catch (err: any) {
      if (err.code !== 'PGRST116') {
        Alert.alert("Error", err.message);
      }
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera roll permissions!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];

      // Validate file type
      if (asset.uri && !asset.uri.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        Alert.alert('Invalid File', 'Please send a valid image (JPG, PNG, GIF, or WebP).');
        return;
      }

      // Validate file size (max 10MB for chat)
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Image must be smaller than 10MB.');
        return;
      }

      // Validate dimensions
      if (asset.width && asset.height) {
        if (asset.width > 4096 || asset.height > 4096) {
          Alert.alert('Image Too Large', 'Image must be less than 4096x4096 pixels.');
          return;
        }
      }

      if (!asset.base64) {
        Alert.alert('Error', 'Failed to process image.');
        return;
      }

      if (!currentUser) return;

      setSending(true);

      const fileName = `${currentUser.uid}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('chat-uploads')
        .upload(fileName, decode(asset.base64), { contentType: 'image/jpeg' });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from('chat-uploads').getPublicUrl(fileName);
      await sendMessage(data.publicUrl);

    } catch (err: any) {
      Alert.alert("Upload Failed", err.message);
      setSending(false);
    }
  };

  const handleSendText = async () => {
    await sendMessage();
  };

  // --- SETTINGS ACTIONS ---
  const viewProfile = () => {
    setShowSettings(false);
    router.push(`/creator/${partnerId}`);
  };

  const clearChat = async () => {
    setShowSettings(false);
    setShowDeleteModal(true);
  };

  const confirmClearChat = async () => {
    try {
      await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${currentUser?.uid},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser?.uid})`);
      setMessages([]);
      setShowDeleteModal(false);
    } catch (_error: any) {
      Alert.alert("Error", "Failed to delete conversation");
    }
  };

  const blockUser = () => {
    setShowSettings(false);
    setShowBlockModal(true);
  };

  const confirmBlockUser = async () => {
    try {
      if (!currentUser) return;
      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: currentUser.uid, blocked_id: partnerId });

      if (error) throw error;
      setShowBlockModal(false);
      router.push('/(tabs)');
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setShowBlockModal(false);
    }
  };

  const handleLongPressMessage = (message: Message) => {
    if (message.is_deleted) return;
    if (message.sender_id === currentUser?.uid) {
      setSelectedMessage(message);
      setShowDeleteMessageModal(true);
    }
  };

  const confirmDeleteMessage = async () => {
    if (!selectedMessage) return;
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: 'message unsent.', media_url: null, is_deleted: true })
        .eq('id', selectedMessage.id);

      if (error) throw error;
      setShowDeleteMessageModal(false);
      setSelectedMessage(null);
    } catch (_error: any) {
      Alert.alert("Error", "Failed to delete message");
    }
  };

  const themeStyles = {
    container: { backgroundColor: theme.background },
    header: { backgroundColor: theme.card, borderBottomColor: theme.cardBorder },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    inputContainer: { backgroundColor: theme.card, borderTopColor: theme.cardBorder },
    input: { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder },
    msgOther: { backgroundColor: isDark ? '#333' : '#e2e8f0' },
    msgTextOther: { color: theme.text },
    modalBg: { backgroundColor: theme.card },
    searchResultBg: { backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa' },
    deletedMessage: { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9' },
    deletedMessageText: { color: theme.textSecondary, fontStyle: 'italic' },
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleRequestService = (serviceData: { service_id: string, title: string, price: string }) => {
    setSelectedServiceToBook(serviceData);
    setShowBookingConfirmModal(true);
  };

  const confirmBookService = async () => {
    if (!selectedServiceToBook || !currentUser) return;

    setBookingInProgress(true);
    try {
      // Get service details
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('creator_id, title, price, image_url')
        .eq('id', selectedServiceToBook.service_id)
        .single();

      if (serviceError || !serviceData) {
        console.error('Service fetch error:', serviceError);
        throw new Error('Service not found');
      }

      console.log('📦 Service Data:', { creator_id: serviceData.creator_id, title: serviceData.title });

      // Fetch client and creator names
      const [{ data: clientData, error: clientError }, { data: creatorData, error: creatorError }] = await Promise.all([
        supabase.from('users').select('full_name').eq('firebase_uid', currentUser.uid).single(),
        supabase.from('users').select('full_name').eq('firebase_uid', serviceData.creator_id).single()
      ]);

      console.log('👤 User Data:', {
        clientName: clientData?.full_name,
        clientError,
        creatorName: creatorData?.full_name,
        creatorError,
        creatorId: serviceData.creator_id
      });

      // Use partnerId as fallback for creator name since we're in their chat
      const creatorName = creatorData?.full_name || partnerName || 'Creator';
      const clientName = clientData?.full_name || 'Client';

      console.log('✅ Final Names:', { clientName, creatorName });

      // Create order
      const { error } = await supabase.from('orders').insert({
        client_id: currentUser.uid,
        creator_id: serviceData.creator_id,
        service_title: serviceData.title,
        price: serviceData.price,
        image_url: serviceData.image_url,
        status: 'pending',
        client_name: clientName,
        creator_name: creatorName,
        last_updated_by: currentUser.uid,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Mark service as requested
      setRequestedServiceIds(prev => new Set(prev).add(selectedServiceToBook.service_id));

      setShowBookingConfirmModal(false);
      setSelectedServiceToBook(null);
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to book service. Please try again.');
      setShowBookingConfirmModal(false);
      setShowErrorModal(true);
    } finally {
      setBookingInProgress(false);
    }
  };

  const renderStatus = (msg: Message) => {
    // If msg.is_read is true in DB, this will show "Read" instantly
    if (msg.is_read) return "Read";
    return "Sent";
  };

  const renderMessage = (msg: Message, index: number) => {
    const isMe = msg.sender_id === currentUser?.uid;
    const isImage = !!msg.media_url;
    const isDeleted = msg.is_deleted;
    const hasService = !!msg.service_data;

    return (
      <View
        key={msg.id || index}
        style={[styles.messageContainer, isMe ? styles.messageContainerMe : styles.messageContainerOther]}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          messageLayouts.current[msg.id] = layout.y;
        }}
      >
        <View style={[styles.bubbleContainer, isMe ? styles.bubbleContainerMe : styles.bubbleContainerOther]}>

          {/* SERVICE CARD */}
          {hasService && !isDeleted && msg.service_data ? (
            <View style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.serviceCardContent}>
                <View style={styles.serviceCardHeader}>
                  <Ionicons name="sparkles" size={20} color={theme.tint} />
                  <Text style={[styles.serviceCardBadge, { color: theme.tint }]}>Custom Service</Text>
                </View>
                <Text style={[styles.serviceCardTitle, themeStyles.text]}>{msg.service_data.title}</Text>
                <Text style={[styles.serviceCardLabel, themeStyles.textSecondary]}>{msg.service_data.label}</Text>
                <Text style={[styles.serviceCardDescription, themeStyles.textSecondary]} numberOfLines={3}>
                  {msg.service_data.description}
                </Text>
                <View style={styles.serviceCardFooter}>
                  <Text style={[styles.serviceCardPrice, { color: theme.tint }]}>₱{msg.service_data.price}</Text>
                  {!isMe && (
                    requestedServiceIds.has(msg.service_data.service_id) ? (
                      <View style={[styles.requestServiceButton, { backgroundColor: theme.inputBackground, borderWidth: 1, borderColor: theme.tint }]}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.tint} />
                        <Text style={[styles.requestServiceText, { color: theme.tint }]}>Requested</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={[styles.requestServiceButton, { backgroundColor: theme.tint }]}
                        onPress={() => handleRequestService({
                          service_id: msg.service_data!.service_id,
                          title: msg.service_data!.title,
                          price: msg.service_data!.price
                        })}
                      >
                        <Ionicons name="cart-outline" size={16} color="#fff" />
                        <Text style={styles.requestServiceText}>Request Service</Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>
            </View>
          ) : isImage && !isDeleted ? (
            <Pressable onPress={() => setFullImage(msg.media_url)}>
              <Image source={{ uri: msg.media_url! }} style={styles.standaloneImage} contentFit="cover" />
            </Pressable>
          ) : (
            <Pressable
              onLongPress={() => !isDeleted && handleLongPressMessage(msg)}
              delayLongPress={500}
            >
              <View style={[
                styles.msgBubble,
                isMe ? styles.msgMe : themeStyles.msgOther,
                isMe ? { backgroundColor: isDeleted ? themeStyles.deletedMessage.backgroundColor : theme.tint } : null,
                isDeleted ? themeStyles.deletedMessage : null
              ]}>
                <Text style={[
                  styles.msgText,
                  isMe ? styles.msgTextMe : themeStyles.msgTextOther,
                  isDeleted ? themeStyles.deletedMessageText : null
                ]}>
                  {isDeleted ? 'message unsent.' : msg.content}
                </Text>
              </View>
            </Pressable>
          )}

          {!isDeleted && !hasService && (
            <View style={[styles.messageMeta, isMe ? styles.messageMetaMe : styles.messageMetaOther]}>
              <Text style={[styles.timeText, themeStyles.textSecondary]}>{formatTime(msg.created_at)}</Text>
              {isMe && (
                <Text style={[styles.statusText, { color: theme.tint, marginLeft: 6 }]}>
                  {renderStatus(msg)}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top', 'bottom']}>

      {/* HEADER */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>

          {partnerAvatar ? (
            <Image source={{ uri: partnerAvatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: theme.textSecondary }]}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{partnerName.charAt(0)}</Text>
            </View>
          )}

          <Text style={[styles.headerTitle, themeStyles.text]} numberOfLines={1}>{partnerName}</Text>
        </View>

        <Pressable onPress={() => setShowSettings(true)} style={styles.iconButton}>
          <Ionicons name="information-circle-outline" size={26} color={theme.tint} />
        </Pressable>
      </View>

      {/* SMART MATCH SERVICE GENERATION BANNER */}
      {smartMatchMessage && currentUserRole === 'creator' && partnerRole === 'client' && !hasRespondedToCurrentSmartMatch && (
        <Pressable
          style={[styles.smartMatchBanner, { backgroundColor: theme.tint + '15', borderColor: theme.tint }]}
          onPress={() => setShowGenerateServiceModal(true)}
        >
          <View style={styles.smartMatchBannerContent}>
            <Ionicons name="sparkles" size={24} color={theme.tint} />
            <View style={styles.smartMatchTextContainer}>
              <Text style={[styles.smartMatchTitle, { color: theme.tint }]}>Smart Match Request</Text>
              <Text style={[styles.smartMatchDesc, themeStyles.textSecondary]} numberOfLines={2}>
                {smartMatchMessage}
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.generateServiceButton, { backgroundColor: theme.tint }]}
            onPress={() => setShowGenerateServiceModal(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.generateServiceText}>Generate Service</Text>
          </Pressable>
        </Pressable>
      )}

      {/* SEARCH MODAL */}
      <Modal visible={showSearch} transparent animationType="slide" onRequestClose={() => setShowSearch(false)}>
        <View style={[styles.searchModalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.searchHeader, { backgroundColor: theme.card }]}>
            <View style={styles.searchHeaderContent}>
              <Pressable onPress={() => setShowSearch(false)} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={theme.text} />
              </Pressable>
              <View style={styles.searchTitleContainer}>
                <Text style={[styles.searchTitle, themeStyles.text]}>Search in Chat</Text>
                <Text style={[styles.searchSubtitle, themeStyles.textSecondary]}>
                  {searchActive ? `${searchResults.length} results` : 'Search your messages'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.searchInputWrapper, { backgroundColor: theme.card }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: theme.inputBackground }]}>
              <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search messages..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={clearSearch} style={styles.clearSearchButton}>
                  <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>

          <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
            {searchActive && searchResults.length > 0 ? (
              <View style={styles.resultsList}>
                {searchResults.map((msg) => (
                  <Pressable
                    key={msg.id}
                    style={[styles.searchResultItem, themeStyles.searchResultBg]}
                    onPress={() => scrollToMessage(msg.id)}
                  >
                    <View style={styles.searchResultHeader}>
                      <Text style={[styles.searchResultSender, themeStyles.textSecondary]}>
                        {msg.sender_id === currentUser?.uid ? 'You' : partnerName}
                      </Text>
                      <Text style={[styles.searchResultTime, themeStyles.textSecondary]}>
                        {formatDate(msg.created_at)} • {formatTime(msg.created_at)}
                      </Text>
                    </View>
                    <Text style={[styles.searchResultContent, themeStyles.text]} numberOfLines={2}>
                      {msg.content}
                    </Text>
                    <View style={styles.searchResultFooter}>
                      <Ionicons name="arrow-forward" size={16} color={theme.tint} />
                      <Text style={[styles.jumpToText, { color: theme.tint }]}>Jump to message</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : searchActive ? (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.noResultsTitle, themeStyles.text]}>No messages found</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* MESSAGES LIST */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={
          flexToggle
            ? [{ flexGrow: 1 }, styles.container]
            : [{ flex: 1 }, styles.container]
        }
        enabled={!flexToggle}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (!searchActive) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
        >
          {loading ? (
            <ActivityIndicator color={theme.tint} style={{ marginTop: 20 }} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyStateTitle, themeStyles.text]}>No messages yet</Text>
              <Text style={[styles.emptyStateText, themeStyles.textSecondary]}>
                Start the conversation by sending a message.
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
          {sending && (
            <View style={{ alignSelf: 'flex-end', marginRight: 20, marginBottom: 10 }}>
              <ActivityIndicator size="small" color={theme.tint} />
            </View>
          )}
        </ScrollView>

        {/* INPUT AREA */}
        <View style={[styles.inputContainer, themeStyles.inputContainer]}>
          <Pressable onPress={pickImage} style={styles.attachButton} disabled={sending}>
            <Ionicons name="image-outline" size={24} color={theme.tint} />
          </Pressable>

          <TextInput
            style={[styles.input, themeStyles.input]}
            placeholder="Message..."
            placeholderTextColor={theme.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />

          <Pressable
            onPress={handleSendText}
            style={[styles.sendButton, { backgroundColor: theme.tint, opacity: sending ? 0.5 : 1 }]}
            disabled={sending}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* IMAGE MODAL */}
      <Modal visible={!!fullImage} transparent={true} animationType="fade" onRequestClose={() => setFullImage(null)}>
        <View style={styles.fullImageBackdrop}>
          <Pressable style={styles.closeImageButton} onPress={() => setFullImage(null)}>
            <Ionicons name="close" size={32} color="#fff" />
          </Pressable>
          {fullImage && (
            <Image source={{ uri: fullImage }} style={styles.fullImage} contentFit="contain" />
          )}
        </View>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <Pressable style={styles.settingsBackdrop} onPress={() => setShowSettings(false)}>
          <View style={[styles.settingsCard, themeStyles.modalBg]}>
            <View style={styles.dragHandle} />
            <Text style={[styles.settingsTitle, themeStyles.text]}>Conversation Settings</Text>

            {partnerRole === 'creator' && (
              <Pressable style={styles.settingRow} onPress={viewProfile}>
                <Ionicons name="person-outline" size={22} color={theme.text} />
                <Text style={[styles.settingText, themeStyles.text]}>View Profile</Text>
              </Pressable>
            )}

            <Pressable style={styles.settingRow} onPress={() => { setShowSettings(false); setShowSearch(true); }}>
              <Ionicons name="search" size={22} color={theme.text} />
              <Text style={[styles.settingText, themeStyles.text]}>Search in Conversation</Text>
            </Pressable>

            <Pressable style={styles.settingRow} onPress={clearChat}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={[styles.settingText, { color: '#ef4444' }]}>Delete Conversation</Text>
            </Pressable>

            <Pressable style={styles.settingRow} onPress={blockUser}>
              <Ionicons name="ban-outline" size={22} color={theme.textSecondary} />
              <Text style={[styles.settingText, themeStyles.textSecondary]}>Block User</Text>
            </Pressable>

            <Pressable style={[styles.cancelButton, { backgroundColor: theme.inputBackground }]} onPress={() => setShowSettings(false)}>
              <Text style={[styles.cancelText, themeStyles.text]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* GENERATE SERVICE CONFIRMATION MODAL */}
      <Modal visible={showGenerateServiceModal} transparent animationType="fade" onRequestClose={() => setShowGenerateServiceModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowGenerateServiceModal(false)}>
          <Pressable style={[styles.modalContainer, themeStyles.modalBg]} onPress={e => e.stopPropagation()}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.tint + '20' }]}>
              <Ionicons name="sparkles" size={32} color={theme.tint} />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Generate Custom Service</Text>
            <Text style={[styles.modalDescription, themeStyles.textSecondary]}>
              Create a custom service tailored to this client's smart-match request. The description will be pre-filled to help you get started.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowGenerateServiceModal(false)}
              >
                <Text style={[styles.modalButtonText, themeStyles.text]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.tint }]}
                onPress={() => {
                  setShowGenerateServiceModal(false);
                  router.push(`/add-service?customDescription=${encodeURIComponent(smartMatchMessage || '')}&clientId=${partnerId}`);
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Create Service</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* BLOCK MODAL */}
      <Modal visible={showBlockModal} transparent animationType="fade" onRequestClose={() => setShowBlockModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowBlockModal(false)}>
          <Pressable style={[styles.modalContainer, themeStyles.modalBg]} onPress={e => e.stopPropagation()}>
            <View style={[styles.warningIconContainer, { backgroundColor: isDark ? '#ef444420' : '#fee2e2' }]}>
              <Ionicons name="warning-outline" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Block User</Text>
            <Text style={[styles.modalDescription, themeStyles.textSecondary]}>
              Are you sure you want to block {partnerName}?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelModalButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowBlockModal(false)}
              >
                <Text style={[styles.modalButtonText, themeStyles.text]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.blockModalButton]} onPress={confirmBlockUser}>
                <Text style={styles.blockButtonText}>Block User</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DELETE CONVO MODAL */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={[styles.modalContainer, themeStyles.modalBg]} onPress={e => e.stopPropagation()}>
            <View style={[styles.warningIconContainer, { backgroundColor: isDark ? '#ef444420' : '#fee2e2' }]}>
              <Ionicons name="trash-outline" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Delete Conversation</Text>
            <Text style={[styles.modalDescription, themeStyles.textSecondary]}>
              This will permanently delete this conversation.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelModalButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.modalButtonText, themeStyles.text]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.deleteModalButton]} onPress={confirmClearChat}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DELETE MESSAGE MODAL */}
      <Modal visible={showDeleteMessageModal} transparent animationType="fade" onRequestClose={() => setShowDeleteMessageModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteMessageModal(false)}>
          <Pressable style={[styles.modalContainer, themeStyles.modalBg]} onPress={e => e.stopPropagation()}>
            <View style={[styles.warningIconContainer, { backgroundColor: isDark ? '#ef444420' : '#fee2e2' }]}>
              <Ionicons name="trash-outline" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Delete Message</Text>
            <Text style={[styles.modalDescription, themeStyles.textSecondary]}>
              Unsend this message? It will be removed for both users.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelModalButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowDeleteMessageModal(false)}
              >
                <Text style={[styles.modalButtonText, themeStyles.text]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.deleteModalButton]} onPress={confirmDeleteMessage}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* RESTRICTED / CANNOT MESSAGE MODAL */}
      <Modal visible={showCannotMessageModal} transparent animationType="fade" onRequestClose={() => setShowCannotMessageModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCannotMessageModal(false)}>
          <Pressable style={[styles.modalContainer, themeStyles.modalBg]} onPress={e => e.stopPropagation()}>
            <View style={[styles.warningIconContainer, { backgroundColor: isDark ? '#ef444420' : '#fee2e2' }]}>
              <Ionicons name="lock-closed-outline" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Cannot Send</Text>
            <Text style={[styles.modalDescription, themeStyles.textSecondary]}>
              You cannot message this user because they have blocked you or because you have blocked them.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowCannotMessageModal(false)}
              >
                <Text style={[styles.modalButtonText, themeStyles.text]}>Okay</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* BOOKING CONFIRMATION MODAL */}
      <Modal visible={showBookingConfirmModal} transparent animationType="fade" onRequestClose={() => !bookingInProgress && setShowBookingConfirmModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => !bookingInProgress && setShowBookingConfirmModal(false)}>
          <Pressable style={[styles.modalContainer, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.tint + '20' }]}>
              <Ionicons name="cart" size={32} color={theme.tint} />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Request Service?</Text>
            <Text style={[styles.modalDescription, themeStyles.textSecondary]}>
              You are about to request "{selectedServiceToBook?.title}" for ₱{selectedServiceToBook?.price}. The creator will be notified and can accept or decline your request.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelModalButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowBookingConfirmModal(false)}
                disabled={bookingInProgress}
              >
                <Text style={[styles.modalButtonText, themeStyles.text]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.tint }]}
                onPress={confirmBookService}
                disabled={bookingInProgress}
              >
                {bookingInProgress ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>Confirm</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSuccessModal(false)}>
          <Pressable style={[styles.modalContainer, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Request Sent!</Text>
            <Text style={[styles.modalDescription, themeStyles.textSecondary]}>
              Service request sent successfully. The creator will be notified and you can track progress in your Orders tab.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={[styles.modalButtonText, themeStyles.text]}>Close</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.tint }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push('/(tabs)/order');
                }}
              >
                <Ionicons name="receipt-outline" size={20} color="#fff" />
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>View Orders</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ERROR MODAL */}
      <Modal visible={showErrorModal} transparent animationType="fade" onRequestClose={() => setShowErrorModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowErrorModal(false)}>
          <Pressable style={[styles.modalContainer, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#ef444420' }]}>
              <Ionicons name="close-circle" size={48} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, themeStyles.text]}>Booking Failed</Text>
            <Text style={[styles.modalDescription, themeStyles.textSecondary]}>
              {errorMessage}
            </Text>
            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.tint, width: '100%' }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: '#fff' }]}>Try Again</Text>
            </Pressable>
          </Pressable>
        </Pressable>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { paddingRight: 12 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  headerAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  iconButton: { padding: 4 },

  // Smart Match Banner Styles
  smartMatchBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  smartMatchBannerContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  smartMatchTextContainer: {
    flex: 1,
    gap: 4,
  },
  smartMatchTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  smartMatchDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  generateServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateServiceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  messageList: { flex: 1, paddingHorizontal: 16 },
  messageListContent: { flexGrow: 1, paddingVertical: 16 },

  messageContainer: { marginBottom: 16 },
  messageContainerMe: { alignItems: 'flex-end' },
  messageContainerOther: { alignItems: 'flex-start' },

  bubbleContainer: { maxWidth: '75%' },
  bubbleContainerMe: { alignItems: 'flex-end' },
  bubbleContainerOther: { alignItems: 'flex-start' },

  msgBubble: { padding: 12, borderRadius: 20 },
  msgMe: { borderBottomRightRadius: 4 },

  standaloneImage: { width: 220, height: 150, borderRadius: 16 },
  msgText: { fontSize: 16 },
  msgTextMe: { color: '#fff' },

  messageMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  messageMetaMe: { justifyContent: 'flex-end' },
  messageMetaOther: { justifyContent: 'flex-start' },
  timeText: { fontSize: 10 },
  statusText: { fontSize: 10, fontWeight: '700' },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1 },
  attachButton: { padding: 8, marginRight: 8 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 16, borderWidth: 1 },
  sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },

  emptyStateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyStateText: { fontSize: 14, textAlign: 'center', maxWidth: '70%', lineHeight: 20 },

  // SEARCH STYLES
  searchModalContainer: { flex: 1 },
  searchHeader: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  searchHeaderContent: { flexDirection: 'row', alignItems: 'center' },
  searchTitleContainer: { marginLeft: 12 },
  searchTitle: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  searchSubtitle: { fontSize: 14 },
  searchInputWrapper: { padding: 16, borderBottomWidth: 1 },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: { flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 16 },
  searchIcon: { marginRight: 8 },
  clearSearchButton: { padding: 4 },
  searchResultsContainer: { flex: 1, padding: 16 },
  resultsList: { gap: 12 },
  searchResultItem: { borderRadius: 16, padding: 16, marginBottom: 8 },
  searchResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  searchResultSender: { fontSize: 14, fontWeight: '600' },
  searchResultTime: { fontSize: 12 },
  searchResultContent: { fontSize: 16, lineHeight: 20, marginBottom: 12 },
  searchResultFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jumpToText: { fontSize: 14, fontWeight: '500' },
  noResultsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  noResultsTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },

  fullImageBackdrop: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  fullImage: { width: '100%', height: '100%' },
  closeImageButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },

  settingsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  settingsCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  settingsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  settingText: { fontSize: 16, fontWeight: '500' },
  cancelButton: { marginTop: 20, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelText: { fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', borderRadius: 20, padding: 24, ...Shadows.xl },
  warningIconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  modalIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  modalDescription: { fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, gap: 8 },
  cancelModalButton: { borderWidth: 1, borderColor: '#e2e8f0' },
  blockModalButton: { backgroundColor: '#ef4444' },
  deleteModalButton: { backgroundColor: '#ef4444' },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
  blockButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Service Card Styles (for custom services in chat)
  serviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
    maxWidth: 300,
  },
  serviceCardImage: {
    width: '100%',
    height: 160,
  },
  serviceCardImagePlaceholder: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCardContent: {
    padding: 16,
    gap: 8,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  serviceCardBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  serviceCardLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  serviceCardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  serviceCardPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  requestServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  requestServiceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});