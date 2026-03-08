import { NotificationSectionHeader } from '@/components/profile/NotificationSectionHeader';
import { NotificationToggle } from '@/components/profile/NotificationToggle';
import { DPA_CONTENT, TERMS_CONTENT } from '@/constants/legal';
import { supabase } from '@/frontend/store';
import { Entypo, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
    auth,
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    signOut,
    updateEmail,
    updateProfile as updateFirebaseProfile,
    updatePassword,
    verifyBeforeUpdateEmail
} from '@/frontend/session';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Shadows } from '@/constants/theme';

// --- CONSTANTS ---
const MAIN_CATEGORIES = [
    { id: 'cat1', label: 'Design & Creative', icon: 'color-palette-outline' },
    { id: 'cat2', label: 'Development & IT', icon: 'code-slash-outline' },
    { id: 'cat3', label: 'Writing & Translation', icon: 'document-text-outline' },
    { id: 'cat4', label: 'Digital Marketing', icon: 'trending-up-outline' },
    { id: 'cat5', label: 'Video & Animation', icon: 'videocam-outline' },
    { id: 'cat6', label: 'Music & Audio', icon: 'musical-notes-outline' },
];

const SUBCATEGORY_MAP: Record<string, string[]> = {
    'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
    'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
    'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Creative Writing', 'Proofreading'],
    'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
    'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
    'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

// Payment Method Config
const PAYMENT_OPTIONS = [
    { type: 'GCash', icon: 'wallet-outline', label: 'GCash' },
    { type: 'PayMaya', icon: 'wallet-outline', label: 'PayMaya' },
    { type: 'PayPal', icon: 'logo-paypal', label: 'PayPal' },
    { type: 'Bank Transfer', icon: 'business-outline', label: 'Bank Account' },
    { type: 'Credit Card', icon: 'card-outline', label: 'Credit/Debit Card' },
];

type Country = {
    code: string;
    dialCode: string;
    name: string;
    flag: string;
    placeholder: string;
    validationRegex: RegExp;
    validationError: string;
};

// Strict Validation Rules
const COUNTRIES: Country[] = [
    {
        code: 'PH',
        dialCode: '+63',
        name: 'Philippines',
        flag: '🇵🇭',
        placeholder: '0912 345 6789',
        validationRegex: /^09\d{9}$/,
        validationError: 'Please enter a valid 11-digit PH mobile number starting with 09'
    },
    {
        code: 'US',
        dialCode: '+1',
        name: 'United States',
        flag: '🇺🇸',
        placeholder: '(555) 123-4567',
        validationRegex: /^\d{10}$/,
        validationError: 'Please enter a valid 10-digit US phone number'
    },
    {
        code: 'GB',
        dialCode: '+44',
        name: 'United Kingdom',
        flag: '🇬🇧',
        placeholder: '07911 123456',
        validationRegex: /^07\d{9}$/,
        validationError: 'Please enter a valid UK mobile number starting with 07'
    },
    {
        code: 'CA',
        dialCode: '+1',
        name: 'Canada',
        flag: '🇨🇦',
        placeholder: '(555) 123-4567',
        validationRegex: /^\d{10}$/,
        validationError: 'Please enter a valid 10-digit Canadian phone number'
    },
    {
        code: 'AU',
        dialCode: '+61',
        name: 'Australia',
        flag: '🇦🇺',
        placeholder: '0412 345 678',
        validationRegex: /^04\d{8}$/,
        validationError: 'Please enter a valid AU mobile number starting with 04'
    },
];

// --- TYPES ---
type ModalType = 'none' | 'personal' | 'security' | 'language' | 'theme' | 'logout' | 'creator' | 'following' | 'followers' | 'paymentMethods' | 'wallet' | 'help' | 'support' | 'legal' | 'privacy' | 'notifications' | 'platformConfig';

type CustomAlertConfig = {
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
    onConfirm?: () => void;
};

// Type for deletion state
type DeletionTarget = {
    id: number;
    type: 'payment' | 'wallet';
};

// --- SKELETON LOADER COMPONENT ---
const SkeletonItem = ({ width, height, borderRadius = 8, style }: any) => {
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

export default function ProfileScreen() {
    const router = useRouter();
    const user = auth.currentUser;

    const { theme, setMode, mode, isDark } = useTheme();
    const { language: _language, setLanguage: _setLanguage, t } = useLanguage();

    const [profileData, setProfileData] = useState<any>(null);
    const [creatorStats, setCreatorStats] = useState({ followers: 0, rating: 'New', reviews: 0 });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [followingList, setFollowingList] = useState<any[]>([]);
    const [followersList, setFollowersList] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [userWallets, setUserWallets] = useState<any[]>([]);
    const [walletBalance, setWalletBalance] = useState<number>(0);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<CustomAlertConfig>({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onConfirm: undefined
    });

    // MODAL STATE
    const [modalType, setModalType] = useState<ModalType>('none');

    // State for Remove Payment/Wallet Confirmation Modal
    const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
    // Generic object to handle both payment methods and wallets
    const [itemToDelete, setItemToDelete] = useState<DeletionTarget | null>(null);

    // FORMS
    const [form, setForm] = useState({
        first_name: '', middle_name: '', last_name: '', birthdate: '',
        age: '', gender: '', nationality: '', phone: '', address: '',
    });

    // Date Picker & Country Picker States
    const [birthDateObj, setBirthDateObj] = useState<Date | null>(null);
    const [showDateModal, setShowDateModal] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
    const [showCountryModal, setShowCountryModal] = useState(false);

    const [creatorForm, setCreatorForm] = useState({
        bio: '', portfolio_url: '', skills: [] as string[],
        experience_years: '', starting_price: '', turnaround_time: ''
    });

    // Financial Forms
    const [financeForm, setFinanceForm] = useState({
        type: 'GCash',
        account_name: '',
        account_number: '',
        bank_name: '',
        expiry: '',
        cvv: '',
        email: ''
    });

    const [supportMessage, setSupportMessage] = useState('');
    const [notificationPrefs, setNotificationPrefs] = useState({
        orderUpdates: true,
        messages: true,
        reviews: true,
        promotions: false,
        emailNotifications: true,
        pushNotifications: true,
    });
    const [legalTab, setLegalTab] = useState<'terms' | 'dpa'>('terms');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Admin Platform Settings State
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [autoSuspend, setAutoSuspend] = useState(true);
    const [commissionRate, setCommissionRate] = useState('15');
    const [adminSettingsTab, setAdminSettingsTab] = useState<'config' | 'logs'>('config');

    // Security State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);

    const isSocialAuth = user?.providerData.some(p => p.providerId !== 'password');

    // --- FETCH PROFILE FUNCTION ---
    const fetchProfile = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('firebase_uid', user.uid)
                .single();

            if (error) throw error;

            setProfileData(data);

            // Parse Names
            let firstName = data.first_name || '';
            let middleName = data.middle_name || '';
            let lastName = data.last_name || '';

            if ((!firstName || !lastName) && data.full_name) {
                const parts = data.full_name.split(' ');
                if (parts.length > 0) {
                    firstName = parts[0] || '';
                    if (parts.length > 1) {
                        lastName = parts[parts.length - 1] || '';
                        if (parts.length > 2) middleName = parts.slice(1, parts.length - 1).join(' ') || '';
                    }
                }
            }

            // Parse Phone Number to separate Country Code vs Local Number
            let rawPhone = data.phone || '';
            let matchedCountry = COUNTRIES[0];
            let localPhone = rawPhone;

            // Try to match start of string with country dial codes
            for (const c of COUNTRIES) {
                if (rawPhone.startsWith(c.dialCode)) {
                    matchedCountry = c;
                    localPhone = rawPhone.substring(c.dialCode.length);
                    break;
                }
            }

            // Parse Birthdate String to Date Object (Assuming DD/MM/YYYY)
            let parsedDate = null;
            if (data.birthdate) {
                const [day, month, year] = data.birthdate.split('/');
                if (day && month && year) {
                    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
            }

            setForm({
                first_name: firstName, middle_name: middleName, last_name: lastName,
                phone: localPhone,
                address: data.address || '', gender: data.gender || '',
                nationality: data.nationality || '', age: data.age || '', birthdate: data.birthdate || '',
            });

            setSelectedCountry(matchedCountry);
            setBirthDateObj(parsedDate);

            setNewEmail(user.email || '');

            // Role Specific Data
            if (data.role === 'creator') {
                await fetchCreatorData(user.uid);
            } else {
                await fetchClientData(user.uid);
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            // Only fetch if we don't have profile data yet
            // This prevents reloading every time you switch tabs
            if (!profileData) {
                fetchProfile();
            }
        }, [profileData, fetchProfile])
    );

    // Manual refresh function for when profile is updated
    const refreshProfile = async () => {
        await fetchProfile();
    };

    // --- CUSTOM ALERT HELPER ---
    const showCustomAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'success', onConfirm?: () => void) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm });
    };

    const closeAlert = () => {
        if (alertConfig.onConfirm) alertConfig.onConfirm();
        setAlertConfig({ ...alertConfig, visible: false });
    };

    // --- HELPERS FOR PERSONAL DETAILS ---

    // Handle Age Input (Max 99)
    const handleAgeChange = (text: string) => {
        const numericValue = text.replace(/[^0-9]/g, '');

        if (numericValue === '') {
            setForm({ ...form, age: '' });
            return;
        }

        const intValue = parseInt(numericValue, 10);
        if (intValue > 99) {
            setForm({ ...form, age: '99' });
        } else {
            setForm({ ...form, age: numericValue });
        }
    };

    // Handle Date Selection
    const handleDateChange = (_event: any, selected?: Date) => {
        if (selected) {
            setBirthDateObj(selected);
            // Format to DD/MM/YYYY for the string representation
            const formatted = selected.toLocaleDateString('en-GB');
            setForm(prev => ({ ...prev, birthdate: formatted }));
        }
        if (Platform.OS === 'android') {
            // Android closes picker automatically
        }
    };

    const openDatePicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: birthDateObj || new Date(2000, 0, 1),
                onChange: handleDateChange,
                mode: 'date',
                maximumDate: new Date(),
            });
        } else {
            setShowDateModal(true);
        }
    };

    const fetchCreatorData = async (uid: string) => {
        // 1. Fetch Details
        const { data: cData } = await supabase.from('creators').select('*').eq('user_id', uid).maybeSingle();
        if (cData) {
            setCreatorForm({
                bio: cData.bio || '', portfolio_url: cData.portfolio_url || '',
                skills: cData.skills || [], experience_years: cData.experience_years || '',
                starting_price: cData.starting_price || '', turnaround_time: cData.turnaround_time || ''
            });
        }

        // 2. Fetch Stats
        const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', uid);
        const { data: reviews } = await supabase.from('reviews').select('rating').eq('reviewee_id', uid);

        let avgRating = 'New';
        if (reviews && reviews.length > 0) {
            const total = reviews.reduce((acc, curr) => acc + curr.rating, 0);
            avgRating = (total / reviews.length).toFixed(1);
        }
        setCreatorStats({ followers: followers || 0, rating: avgRating, reviews: reviews?.length || 0 });

        // 3. Fetch Notification Preferences
        const { data: userPrefs } = await supabase
            .from('users')
            .select('notifications_enabled')
            .eq('firebase_uid', uid)
            .single();

        // Set notification preferences based on user data
        if (userPrefs) {
            setNotificationPrefs(prev => ({
                ...prev,
                pushNotifications: userPrefs.notifications_enabled ?? true,
            }));
        }

        // 4. Fetch Wallet (Payout Methods)
        const { data: wallets } = await supabase.from('user_wallets').select('*').eq('user_id', uid);
        setUserWallets(wallets || []);

        // 4. Calculate Balance (Simulated from Completed Orders)
        // NOTE: Balance reflects all completed transactions regardless of UI deletion
        const { data: orders } = await supabase
            .from('orders')
            .select('price')
            .eq('creator_id', uid)
            .eq('status', 'completed');
        const balance = orders?.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0) || 0;
        setWalletBalance(balance);

        // 5. Fetch Followers
        const { data: followersData } = await supabase
            .from('follows')
            .select(`
        id,
        follower_id,
        users!follows_follower_id_fkey(firebase_uid, full_name, first_name, avatar_url, email, role)
      `)
            .eq('following_id', uid);

        const cleanedFollowers = followersData?.map((f: any) => ({
            id: f.id,
            followerId: f.follower_id,
            name: f.users?.full_name || f.users?.first_name || 'Unknown User',
            avatar: f.users?.avatar_url,
            email: f.users?.email,
            role: f.users?.role || 'client'
        })) || [];

        setFollowersList(cleanedFollowers);
    };

    const fetchClientData = async (uid: string) => {
        // 1. Fetch Following
        const { data: follows } = await supabase
            .from('follows')
            .select(`
            id,
            following_id,
            following:following_id ( full_name, avatar_url, role )
        `)
            .eq('follower_id', uid);

        const cleanedFollows = follows?.map((f: any) => ({
            id: f.id,
            uid: f.following_id,
            name: f.following?.full_name || 'Unknown User',
            avatar: f.following?.avatar_url,
            role: f.following?.role
        })) || [];
        setFollowingList(cleanedFollows);

        // 2. Fetch Payment Methods
        const { data: methods } = await supabase.from('payment_methods').select('*').eq('user_id', uid);
        setPaymentMethods(methods || []);
    };

    // --- ACTIONS ---

    const handleSignOutPress = () => setModalType('logout');

    const performLogout = async () => {
        try {
            setModalType('none');
            await signOut(auth);
            router.replace('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleForgotPassword = async () => {
        if (user?.email) {
            try {
                await sendPasswordResetEmail(auth, user.email);
                showCustomAlert('Email Sent', `A password reset link has been sent to ${user.email}.`);
            } catch (error: any) {
                showCustomAlert('Error', error.message, 'error');
            }
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];

            // Validate file type
            if (asset.uri && !asset.uri.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                showCustomAlert('Invalid File', 'Please select a valid image (JPG, PNG, GIF, or WebP).', 'error');
                return;
            }

            // Validate file size (max 3MB for avatars)
            if (asset.fileSize && asset.fileSize > 3 * 1024 * 1024) {
                showCustomAlert('File Too Large', 'Avatar must be smaller than 3MB.', 'error');
                return;
            }

            // Validate dimensions
            if (asset.width && asset.height) {
                if (asset.width < 100 || asset.height < 100) {
                    showCustomAlert('Image Too Small', 'Avatar must be at least 100x100 pixels.', 'error');
                    return;
                }
                if (asset.width > 2048 || asset.height > 2048) {
                    showCustomAlert('Image Too Large', 'Avatar must be less than 2048x2048 pixels.', 'error');
                    return;
                }
            }

            if (asset.base64) {
                uploadAvatar(asset.base64);
            } else {
                showCustomAlert('Error', 'Failed to process image.', 'error');
            }
        }
    };

    const uploadAvatar = async (base64: string) => {
        if (!user) return;
        try {
            const fileName = `${user.uid}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, decode(base64), { contentType: 'image/jpeg' });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('firebase_uid', user.uid);
            await updateFirebaseProfile(user, { photoURL: data.publicUrl });

            fetchProfile();
            showCustomAlert('Success', 'Profile picture updated.');
        } catch (error: any) {
            showCustomAlert('Upload Failed', error.message, 'error');
        }
    };

    const savePersonalData = async () => {
        if (!user) return;
        setSaving(true);
        try {
            // Strict Phone Number Validation
            const cleanPhone = form.phone.replace(/[^0-9]/g, '');

            if (!form.phone.trim()) {
                throw new Error('Phone number is required.');
            }

            if (!selectedCountry.validationRegex.test(cleanPhone)) {
                throw new Error(selectedCountry.validationError);
            }

            const fullName = `${form.first_name.trim()} ${form.middle_name.trim()} ${form.last_name.trim()}`.replace(/\s+/g, ' ').trim();
            const fullPhone = `${selectedCountry.dialCode}${cleanPhone}`;

            const { error } = await supabase.from('users').update({
                first_name: form.first_name, middle_name: form.middle_name, last_name: form.last_name,
                full_name: fullName, phone: fullPhone, address: form.address, gender: form.gender,
                nationality: form.nationality, age: form.age, birthdate: form.birthdate
            }).eq('firebase_uid', user.uid);

            if (error) throw error;
            if (fullName !== user.displayName) await updateFirebaseProfile(user, { displayName: fullName });

            showCustomAlert('Success', 'Profile updated successfully.');
            setModalType('none');
            fetchProfile();
        } catch (error: any) {
            showCustomAlert('Error', error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveCreatorData = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('creators').update({
                bio: creatorForm.bio, portfolio_url: creatorForm.portfolio_url,
                skills: creatorForm.skills, experience_years: creatorForm.experience_years,
                starting_price: creatorForm.starting_price, turnaround_time: creatorForm.turnaround_time
            }).eq('user_id', user.uid);

            if (error) throw error;
            showCustomAlert('Success', 'Creator profile updated.');
            setModalType('none');
            await refreshProfile();
        } catch (error: any) {
            showCustomAlert('Error', error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleSkill = (skill: string) => {
        const currentSkills = creatorForm.skills || [];
        if (currentSkills.includes(skill)) {
            setCreatorForm({ ...creatorForm, skills: currentSkills.filter(s => s !== skill) });
        } else {
            setCreatorForm({ ...creatorForm, skills: [...currentSkills, skill] });
        }
    };

    // --- FINANCIAL FUNCTIONS ---

    // Function to remove a payment method (Triggers Modal)
    const handleRemovePaymentMethod = (id: number) => {
        setItemToDelete({ id, type: 'payment' });
        setShowRemoveConfirmModal(true);
    };

    // Function to remove a wallet/payout method (Triggers Modal)
    const handleRemoveWalletMethod = (id: number) => {
        setItemToDelete({ id, type: 'wallet' });
        setShowRemoveConfirmModal(true);
    };

    // Function to perform deletion after confirmation
    const confirmDeletion = async () => {
        if (!itemToDelete) return;

        try {
            let table = '';
            if (itemToDelete.type === 'payment') {
                table = 'payment_methods';
            } else {
                table = 'user_wallets';
            }

            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', itemToDelete.id);

            if (error) throw error;

            // Update local state based on type
            if (itemToDelete.type === 'payment') {
                setPaymentMethods(prev => prev.filter(pm => pm.id !== itemToDelete.id));
                showCustomAlert('Success', 'Payment method removed.');
            } else {
                setUserWallets(prev => prev.filter(w => w.id !== itemToDelete.id));
                showCustomAlert('Success', 'Payout method removed.');
            }

        } catch (err: any) {
            showCustomAlert('Error', err.message, 'error');
        } finally {
            setShowRemoveConfirmModal(false);
            setItemToDelete(null);
        }
    };

    const handleAddPaymentMethod = async () => {
        if (!user) return;

        let finalIdentifier = '';

        // Validation Logic
        if (financeForm.type === 'PayPal') {
            if (!financeForm.email) return showCustomAlert('Error', 'Please enter your PayPal email.', 'error');
            finalIdentifier = financeForm.email;
        } else if (financeForm.type === 'Bank Transfer') {
            if (!financeForm.account_number || !financeForm.bank_name) return showCustomAlert('Error', 'Please enter bank details.', 'error');
            finalIdentifier = `${financeForm.bank_name} - ${financeForm.account_number}`;
        } else if (financeForm.type === 'Credit Card') {
            if (!financeForm.account_number) return showCustomAlert('Error', 'Please enter card number.', 'error');
            // Mask for security
            finalIdentifier = `**** **** **** ${financeForm.account_number.slice(-4)}`;
        } else {
            // GCash / PayMaya
            if (!financeForm.account_number) return showCustomAlert('Error', 'Please enter your mobile number.', 'error');
            finalIdentifier = financeForm.account_number;
        }

        try {
            const { error } = await supabase.from('payment_methods').insert({
                user_id: user.uid,
                method_type: financeForm.type,
                masked_number: finalIdentifier
            });
            if (error) throw error;

            showCustomAlert('Success', `${financeForm.type} added successfully.`);
            resetFinanceForm();
            fetchClientData(user.uid);
        } catch (err: any) {
            showCustomAlert('Error', err.message, 'error');
        }
    };

    const handleAddWalletMethod = async () => {
        if (!user) return;

        if (financeForm.type === 'PayPal' && !financeForm.email) return showCustomAlert('Error', 'Enter PayPal email', 'error');
        if (financeForm.type !== 'PayPal' && (!financeForm.account_number || !financeForm.account_name)) return showCustomAlert('Error', 'Enter account details', 'error');

        const accountNumberToSave = financeForm.type === 'PayPal' ? financeForm.email : financeForm.account_number;

        try {
            const { error } = await supabase.from('user_wallets').insert({
                user_id: user.uid,
                wallet_type: financeForm.type,
                account_name: financeForm.account_name || 'PayPal User',
                account_number: accountNumberToSave,
                is_active: true
            });
            if (error) throw error;

            showCustomAlert('Success', 'Payout method added.');
            resetFinanceForm();
            fetchCreatorData(user.uid);
        } catch (err: any) {
            showCustomAlert('Error', err.message, 'error');
        }
    };

    const resetFinanceForm = () => {
        setFinanceForm({
            type: 'GCash', account_name: '', account_number: '',
            bank_name: '', expiry: '', cvv: '', email: ''
        });
    };

    const handleUnfollow = async (relId: number) => {
        try {
            const { error } = await supabase.from('follows').delete().eq('id', relId);
            if (error) throw error;
            setFollowingList(prev => prev.filter(f => f.id !== relId));
        } catch (_err: any) {
            showCustomAlert('Error', "Could not unfollow.", 'error');
        }
    };

    const handleSubmitSupport = async () => {
        if (!supportMessage.trim()) {
            showCustomAlert('Error', 'Please describe your issue before submitting.', 'error');
            return;
        }
        if (!user) {
            showCustomAlert('Error', 'User session not found. Please log in again.', 'error');
            return;
        }

        try {
            // Extract category from message if present
            const categoryMatch = supportMessage.match(/^\[(.*?)\]/);
            const category = categoryMatch ? categoryMatch[1] : 'Other';
            const cleanMessage = supportMessage.replace(/^\[.*?\]\s*/, '');

            // Insert support ticket
            const { data, error } = await supabase
                .from('support_tickets')
                .insert({
                    user_id: user.uid,
                    email: user.email || profileData?.email || 'No email',
                    category: category,
                    message: cleanMessage,
                    user_role: profileData?.role || 'client',
                    user_info: {
                        name: profileData?.full_name || profileData?.first_name || 'Anonymous',
                        phone: profileData?.phone,
                    },
                    status: 'open',
                    priority: 'normal'
                })
                .select('ticket_number')
                .single();

            if (error) throw error;

            showCustomAlert(
                'Ticket Submitted',
                `Your support request has been received.\n\nTicket ID: ${data.ticket_number}\n\nWe'll respond within 24-48 hours.`,
                'success'
            );
            setSupportMessage('');
            setModalType('none');
        } catch (error: any) {
            console.error('Error submitting support ticket:', error);
            showCustomAlert('Error', 'Failed to submit ticket. Please try again.', 'error');
        }
    };

    const handleExportData = async () => {
        if (!user) {
            showCustomAlert('Error', 'User session not found. Please log in again.', 'error');
            return;
        }

        try {
            setModalType('none');
            showCustomAlert('Processing', 'Preparing your data export. This may take a moment...', 'warning');

            // Fetch all user data from database
            const { data: userData, error: _userError } = await supabase
                .from('users')
                .select('*')
                .eq('firebase_uid', user.uid)
                .single();

            const { data: ordersData } = await supabase
                .from('orders')
                .select('*')
                .or(`client_id.eq.${user.uid},creator_id.eq.${user.uid}`);

            const { data: messagesData } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user.uid},receiver_id.eq.${user.uid}`);

            const { data: followsData } = await supabase
                .from('follows')
                .select('*')
                .or(`follower_id.eq.${user.uid},following_id.eq.${user.uid}`);

            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('*')
                .or(`reviewer_id.eq.${user.uid},reviewee_id.eq.${user.uid}`);

            const { data: paymentsData } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('user_id', user.uid);

            const { data: walletsData } = await supabase
                .from('user_wallets')
                .select('*')
                .eq('user_id', user.uid);

            const { data: servicesData } = await supabase
                .from('services')
                .select('*')
                .eq('creator_id', user.uid);

            const { data: creatorData } = await supabase
                .from('creators')
                .select('*')
                .eq('user_id', user.uid);

            // Compile all data
            const exportData = {
                export_date: new Date().toISOString(),
                user_info: userData,
                orders: ordersData || [],
                messages: messagesData || [],
                follows: followsData || [],
                reviews: reviewsData || [],
                payment_methods: paymentsData || [],
                wallets: walletsData || [],
                services: servicesData || [],
                creator_profile: creatorData || [],
                metadata: {
                    total_orders: ordersData?.length || 0,
                    total_messages: messagesData?.length || 0,
                    total_follows: followsData?.length || 0,
                    total_reviews: reviewsData?.length || 0,
                }
            };

            // Convert to JSON string with formatting
            const jsonString = JSON.stringify(exportData, null, 2);

            // Create blob and download (Web)
            if (Platform.OS === 'web') {
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `createch-data-export-${Date.now()}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showCustomAlert(
                    'Export Complete',
                    'Your data has been downloaded as a JSON file.',
                    'success'
                );
            } else {
                // For mobile, we'll show the data summary and offer to email it
                showCustomAlert(
                    'Export Ready',
                    `Your data export contains:\n\n• ${exportData.metadata.total_orders} orders\n• ${exportData.metadata.total_messages} messages\n• ${exportData.metadata.total_follows} follows\n• ${exportData.metadata.total_reviews} reviews\n\nContact support to receive your complete data export via email.`,
                    'success'
                );
            }

        } catch (error: any) {
            console.error('Error exporting data:', error);
            showCustomAlert('Error', 'Failed to export data. Please try again or contact support.', 'error');
        }
    };

    const handleAccessData = async () => {
        if (!user) {
            showCustomAlert('Error', 'User session not found. Please log in again.', 'error');
            return;
        }

        try {
            setModalType('none');
            showCustomAlert('Loading', 'Fetching your data...', 'warning');

            // Fetch summary of user data
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('firebase_uid', user.uid)
                .single();

            const { count: ordersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .or(`client_id.eq.${user.uid},creator_id.eq.${user.uid}`);

            const { count: messagesCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .or(`sender_id.eq.${user.uid},receiver_id.eq.${user.uid}`);

            const { count: followsCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .or(`follower_id.eq.${user.uid},following_id.eq.${user.uid}`);

            const { count: reviewsCount } = await supabase
                .from('reviews')
                .select('*', { count: 'exact', head: true })
                .or(`reviewer_id.eq.${user.uid},reviewee_id.eq.${user.uid}`);

            const dataSummary = `
📊 YOUR DATA SUMMARY

👤 Account Information:
• Name: ${userData?.full_name || userData?.first_name || 'Not set'}
• Email: ${userData?.email || 'Not set'}
• Phone: ${userData?.phone || 'Not set'}
• Role: ${userData?.role?.toUpperCase() || 'CLIENT'}
• Account Created: ${new Date(userData?.created_at).toLocaleDateString()}

📈 Activity:
• Total Orders: ${ordersCount || 0}
• Total Messages: ${messagesCount || 0}
• Total Connections: ${followsCount || 0}
• Total Reviews: ${reviewsCount || 0}

🔒 Security:
• Account ID: ${user.uid.slice(0, 20)}...
• Auth Provider: ${user.providerData[0]?.providerId || 'email'}

To download your complete data including all details, use the "Export Your Data" option.
          `;

            showCustomAlert('Your Data', dataSummary.trim(), 'success');

        } catch (error: any) {
            console.error('Error accessing data:', error);
            showCustomAlert('Error', 'Failed to access data. Please try again.', 'error');
        }
    };

    const handleSaveNotificationPrefs = async () => {
        if (!user) {
            showCustomAlert('Error', 'User session not found.', 'error');
            return;
        }

        try {
            // Update notifications_enabled in users table
            const { error } = await supabase
                .from('users')
                .update({ notifications_enabled: notificationPrefs.pushNotifications })
                .eq('firebase_uid', user.uid);

            if (error) throw error;

            showCustomAlert(
                'Preferences Saved',
                'Your notification preferences have been updated successfully.',
                'success'
            );
            setModalType('none');
        } catch (error: any) {
            console.error('Error saving notification preferences:', error);
            showCustomAlert('Error', 'Failed to save preferences. Please try again.', 'error');
        }
    };

    const saveSecurityData = async () => {
        if (!user || !user.email) {
            showCustomAlert('Error', 'User session not found. Please log in again.', 'error');
            return;
        }

        if (isSocialAuth) {
            showCustomAlert('Not Allowed', 'You are logged in via a social provider. Please manage security settings there.', 'warning');
            return;
        }

        // Validate that current password is provided if trying to change anything
        if (!currentPassword.trim()) {
            showCustomAlert('Current Password Required', 'Please enter your current password to make changes.', 'error');
            return;
        }

        // Validate email format if email is being changed
        if (newEmail !== user.email) {
            const emailRegex = /\S+@\S+\.\S+/;
            if (!emailRegex.test(newEmail.trim())) {
                showCustomAlert('Invalid Email', 'Please enter a valid email address.', 'error');
                return;
            }
        }

        // Validate password fields if changing password
        if (newPassword || confirmNewPassword) {
            if (!newPassword || !confirmNewPassword) {
                showCustomAlert('Incomplete Password', 'Please fill in both new password fields.', 'error');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                showCustomAlert('Password Mismatch', 'New passwords do not match.', 'error');
                return;
            }
            if (newPassword.length < 8) {
                showCustomAlert('Weak Password', 'Password must be at least 8 characters long.', 'error');
                return;
            }
        }

        // Check if there are any actual changes
        if (newEmail === user.email && !newPassword) {
            showCustomAlert('No Changes', 'You haven\'t made any changes to update.', 'warning');
            return;
        }

        setSecurityLoading(true);
        try {
            console.log('🔐 Starting security update...');
            console.log('📧 Current user email:', user.email);
            console.log('🔑 Password provided:', currentPassword ? 'Yes' : 'No');
            console.log('👤 User UID:', user.uid);
            console.log('🔓 Provider data:', JSON.stringify(user.providerData));

            // Get fresh auth instance
            const currentUser = auth.currentUser;
            if (!currentUser || !currentUser.email) {
                throw new Error('Authentication session expired. Please log in again.');
            }

            console.log('✅ Current user verified:', currentUser.email);

            // Reauthenticate user with current password
            // CRITICAL: Use the current user's email, not newEmail
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            console.log('🎫 Credential created for:', currentUser.email);
            console.log('🔄 Attempting reauthentication...');

            await reauthenticateWithCredential(currentUser, credential);
            console.log('✅ Reauthentication successful!');

            // Update password if provided
            if (newPassword) {
                console.log('🔒 Updating password...');
                await updatePassword(currentUser, newPassword);
                console.log('✅ Password updated successfully');
            }

            // Update email if changed
            if (newEmail.trim() !== currentUser.email) {
                console.log('📧 Updating email from', currentUser.email, 'to', newEmail.trim());

                // Use verifyBeforeUpdateEmail instead of updateEmail
                // This sends a verification email to the new address
                try {
                    await verifyBeforeUpdateEmail(currentUser, newEmail.trim());
                    console.log('✅ Verification email sent to', newEmail.trim());

                    // Show success message explaining next steps
                    showCustomAlert(
                        'Verification Email Sent',
                        `A verification link has been sent to ${newEmail.trim()}. Please check your inbox and click the link to verify your new email address. Your email will be updated after verification.`,
                        'success'
                    );

                    setModalType('none');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setSecurityLoading(false);
                    return;

                } catch (emailError: any) {
                    console.error('❌ Email verification error:', emailError);

                    // If verifyBeforeUpdateEmail is not available, fall back to direct update
                    if (emailError.code === 'auth/operation-not-allowed') {
                        console.log('⚠️ Email verification not enabled, attempting direct update...');

                        // Try direct update (may fail if email verification is required)
                        await updateEmail(currentUser, newEmail.trim());
                        console.log('✅ Email updated directly in Firebase Auth');

                        // Update email in Supabase
                        const { error: supabaseError } = await supabase
                            .from('users')
                            .update({ email: newEmail.trim() })
                            .eq('firebase_uid', currentUser.uid);

                        if (supabaseError) {
                            console.error('❌ Supabase email update error:', supabaseError);
                            showCustomAlert('Partial Success', 'Email updated in authentication but profile sync failed. Please contact support.', 'warning');
                            setSecurityLoading(false);
                            return;
                        }
                        console.log('✅ Email updated in Supabase');
                    } else {
                        throw emailError;
                    }
                }
            }

            // Success message (only for password changes now, email change handled above)
            if (newPassword) {
                console.log('🎉 Security update completed successfully!');
                showCustomAlert('Success', 'Password updated successfully.');
                setModalType('none');
                // Clear form fields
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                // Refresh profile
                await fetchProfile();
            }
        } catch (error: any) {
            console.error('❌ Security update error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Full error:', JSON.stringify(error, null, 2));

            let errorMessage = 'Failed to update security settings.';

            // Provide more specific error messages
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'The current password you entered is incorrect. Please double-check and try again.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'New password is too weak. Use at least 8 characters.';
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already in use by another account.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address format.';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'For security reasons, please log out and log back in before making this change.';
            } else if (error.code === 'auth/user-mismatch') {
                errorMessage = 'Credential does not match the current user. Please try logging out and back in.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'User account not found. Please log in again.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Email verification is required. Please check your new email inbox for a verification link.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            showCustomAlert('Update Failed', errorMessage, 'error');
        } finally {
            setSecurityLoading(false);
        }
    };

    // --- UI RENDER HELPERS ---
    const renderFinanceInputs = () => {
        switch (financeForm.type) {
            case 'PayPal':
                return (
                    <TextInput
                        style={[styles.input, themeStyles.input]}
                        placeholder="PayPal Email Address"
                        placeholderTextColor={theme.textSecondary}
                        value={financeForm.email}
                        onChangeText={t => setFinanceForm({ ...financeForm, email: t })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                );
            case 'Bank Transfer':
                return (
                    <>
                        <TextInput
                            style={[styles.input, themeStyles.input]} placeholder="Bank Name (e.g. BDO, BPI)" placeholderTextColor={theme.textSecondary}
                            value={financeForm.bank_name} onChangeText={t => setFinanceForm({ ...financeForm, bank_name: t })}
                        />
                        <TextInput
                            style={[styles.input, themeStyles.input]} placeholder="Account Name" placeholderTextColor={theme.textSecondary}
                            value={financeForm.account_name} onChangeText={t => setFinanceForm({ ...financeForm, account_name: t })}
                        />
                        <TextInput
                            style={[styles.input, themeStyles.input]} placeholder="Account Number" placeholderTextColor={theme.textSecondary}
                            value={financeForm.account_number} onChangeText={t => setFinanceForm({ ...financeForm, account_number: t })} keyboardType="numeric"
                        />
                    </>
                );
            case 'Credit Card':
                return (
                    <>
                        <TextInput
                            style={[styles.input, themeStyles.input]} placeholder="Cardholder Name" placeholderTextColor={theme.textSecondary}
                            value={financeForm.account_name} onChangeText={t => setFinanceForm({ ...financeForm, account_name: t })}
                        />
                        <TextInput
                            style={[styles.input, themeStyles.input]} placeholder="Card Number" placeholderTextColor={theme.textSecondary}
                            value={financeForm.account_number} onChangeText={t => setFinanceForm({ ...financeForm, account_number: t })} keyboardType="numeric" maxLength={16}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TextInput
                                style={[styles.input, themeStyles.input, { flex: 1 }]} placeholder="MM/YY" placeholderTextColor={theme.textSecondary}
                                value={financeForm.expiry} onChangeText={t => setFinanceForm({ ...financeForm, expiry: t })}
                            />
                            <TextInput
                                style={[styles.input, themeStyles.input, { flex: 1 }]} placeholder="CVV" placeholderTextColor={theme.textSecondary}
                                value={financeForm.cvv} onChangeText={t => setFinanceForm({ ...financeForm, cvv: t })} keyboardType="numeric" maxLength={3} secureTextEntry
                            />
                        </View>
                    </>
                );
            default: // GCash, PayMaya
                return (
                    <>
                        <TextInput
                            style={[styles.input, themeStyles.input]} placeholder="Account Name" placeholderTextColor={theme.textSecondary}
                            value={financeForm.account_name} onChangeText={t => setFinanceForm({ ...financeForm, account_name: t })}
                        />
                        <TextInput
                            style={[styles.input, themeStyles.input]} placeholder="Mobile Number (e.g. 0917...)" placeholderTextColor={theme.textSecondary}
                            value={financeForm.account_number} onChangeText={t => setFinanceForm({ ...financeForm, account_number: t })} keyboardType="numeric" maxLength={11}
                        />
                    </>
                );
        }
    };

    // --- STYLES ---
    const themeStyles = {
        container: { backgroundColor: theme.background },
        header: { backgroundColor: theme.card, zIndex: 10 },
        text: { color: theme.text },
        textSecondary: { color: theme.textSecondary },
        card: {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            borderWidth: 1,
            ...Shadows.md,
        },
        modalContainer: { backgroundColor: theme.background },
        input: { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text, borderWidth: 1 },
        chip: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
        categoryCard: { backgroundColor: theme.card, borderColor: theme.cardBorder },
    };

    const MenuItem = ({ icon, label, value, onPress, color }: any) => (
        <Pressable
            style={({ pressed }) => [
                styles.menuItem,
                themeStyles.card,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
            ]}
            onPress={onPress}
        >
            <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: color ? color + '15' : (isDark ? '#1e293b' : '#f1f5f9') }]}>
                    <Ionicons name={icon} size={20} color={color || theme.text} />
                </View>
                <View>
                    <Text style={[styles.menuText, themeStyles.text, color && { color }]}>{label}</Text>
                    {value && <Text style={[styles.menuSubText, themeStyles.textSecondary]}>{value}</Text>}
                </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={[styles.sectionTitle, themeStyles.textSecondary]}>{title}</Text>
    );

    const renderCountryItem = ({ item }: { item: Country }) => (
        <Pressable
            style={[styles.countryRow, { borderBottomColor: theme.cardBorder, borderBottomWidth: 1 }]}
            onPress={() => {
                setSelectedCountry(item);
                setShowCountryModal(false);
            }}>
            <Text style={styles.countryFlag}>{item.flag}</Text>
            <View style={{ flex: 1 }}>
                <Text style={[styles.countryName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.countryDial, { color: theme.textSecondary }]}>{item.dialCode}</Text>
            </View>
            {item.code === selectedCountry.code && (
                <Feather name="check" size={18} color={theme.tint} />
            )}
        </Pressable>
    );

    return (
        <View style={[styles.container, themeStyles.container]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* --- HEADER --- */}
            <View style={[styles.header, themeStyles.header]}>
                <View style={styles.headerTop}>
                    <Text style={[styles.headerTitle, themeStyles.text]}>{t('profileTitle')}</Text>
                    <Pressable
                        onPress={() => setModalType('theme')}
                        style={({ pressed }) => [styles.themeToggle, pressed && { opacity: 0.5 }]}
                    >
                        <Entypo name="adjust" size={24} color={theme.text} />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >

                {loading ? (
                    <View>
                        {/* Profile Card Skeleton */}
                        <View style={[styles.profileCard, themeStyles.card]}>
                            <SkeletonItem width={72} height={72} borderRadius={36} style={{ marginRight: 16 }} />
                            <View>
                                <SkeletonItem width={160} height={24} style={{ marginBottom: 8 }} />
                                <SkeletonItem width={100} height={16} />
                            </View>
                        </View>

                        {/* Dashboard / Stats Skeleton */}
                        <View style={styles.statsRow}>
                            <SkeletonItem style={{ flex: 1 }} height={100} borderRadius={16} />
                            <SkeletonItem style={{ flex: 1 }} height={100} borderRadius={16} />
                            <SkeletonItem style={{ flex: 1 }} height={100} borderRadius={16} />
                        </View>

                        {/* Menu Items Skeleton */}
                        <View style={{ gap: 12, marginTop: 10 }}>
                            <SkeletonItem width={150} height={20} style={{ marginBottom: 10 }} />
                            <SkeletonItem width="100%" height={72} borderRadius={16} />
                            <SkeletonItem width="100%" height={72} borderRadius={16} />

                            <SkeletonItem width={150} height={20} style={{ marginBottom: 10, marginTop: 20 }} />
                            <SkeletonItem width="100%" height={72} borderRadius={16} />
                            <SkeletonItem width="100%" height={72} borderRadius={16} />
                        </View>
                    </View>
                ) : (
                    <>
                        {/* --- USER PROFILE CARD --- */}
                        <View style={[styles.profileCard, themeStyles.card]}>
                            <Pressable style={styles.avatarWrapper} onPress={pickImage}>
                                {profileData?.avatar_url ? (
                                    <Image source={{ uri: profileData.avatar_url }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {profileData?.first_name?.charAt(0) || profileData?.full_name?.charAt(0) || 'U'}
                                    </Text>
                                )}
                                <View style={[styles.cameraBadge, { backgroundColor: theme.tint }]}>
                                    <Ionicons name="pencil" size={12} color="#fff" />
                                </View>
                            </Pressable>

                            <View style={styles.profileInfo}>
                                <Text style={[styles.userName, themeStyles.text]}>
                                    {profileData?.full_name || user?.displayName || 'User'}
                                </Text>
                                <Text style={[styles.userRole, { color: theme.tint }]}>
                                    {profileData?.role?.toUpperCase() || 'CLIENT'}
                                </Text>
                            </View>
                        </View>

                        {/* --- CREATOR DASHBOARD --- */}
                        {profileData?.role === 'creator' && (
                            <View style={styles.statsRow}>
                                <Pressable
                                    style={[styles.statCard, themeStyles.card]}
                                    onPress={() => setModalType('followers')}
                                >
                                    <Text style={[styles.statNumber, themeStyles.text]}>{creatorStats.followers}</Text>
                                    <Text style={[styles.statLabel, themeStyles.textSecondary]}>Followers</Text>
                                </Pressable>
                                <View style={[styles.statCard, themeStyles.card]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={[styles.statNumber, themeStyles.text]}>{creatorStats.rating}</Text>
                                        <Ionicons name="star" size={14} color="#fbbf24" />
                                    </View>
                                    <Text style={[styles.statLabel, themeStyles.textSecondary]}>{creatorStats.reviews} Reviews</Text>
                                </View>
                                <Pressable
                                    style={[styles.statCard, themeStyles.card]}
                                    onPress={() => router.push(`/creator/${user?.uid}`)}
                                >
                                    <Ionicons name="eye-outline" size={24} color={theme.tint} />
                                    <Text style={[styles.statLabel, themeStyles.textSecondary, { marginTop: 4 }]}>View Profile</Text>
                                </Pressable>
                            </View>
                        )}

                        {/* --- BECOME CREATOR --- */}
                        {profileData?.role === 'client' && (
                            <Pressable
                                style={[styles.becomeCreatorCard, { backgroundColor: theme.tint }]}
                                onPress={() => router.push('/onboarding/become-creator')}
                            >
                                <View style={styles.bcContent}>
                                    <View style={styles.bcIconCircle}>
                                        <Ionicons name="sparkles" size={24} color={theme.tint} />
                                    </View>
                                    <View style={styles.bcTextContainer}>
                                        <Text style={styles.bcTitle}>Become a Creator</Text>
                                        <Text style={styles.bcSubtitle}>Start selling your services today</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#fff" />
                            </Pressable>
                        )}

                        {/* --- GENERAL --- */}
                        <SectionHeader title="Account" />
                        <MenuItem
                            icon="person-outline"
                            label={t('myDetails')}
                            value="Name, Age, Address"
                            onPress={() => setModalType('personal')}
                        />
                        {profileData?.role === 'creator' ? (
                            <MenuItem
                                icon="briefcase-outline"
                                label="Creator Details"
                                value="Bio, Skills, Rates"
                                onPress={() => setModalType('creator')}
                            />
                        ) : (
                            <MenuItem
                                icon="people-outline"
                                label="Following"
                                value={`${followingList.length} Creators`}
                                onPress={() => setModalType('following')}
                            />
                        )}
                        <MenuItem
                            icon="shield-checkmark-outline"
                            label={t('securitySub')}
                            onPress={() => setModalType('security')}
                        />

                        {/* --- FINANCE --- */}
                        <SectionHeader title="Finance" />
                        {profileData?.role === 'creator' ? (
                            <MenuItem
                                icon="wallet-outline"
                                label="Wallet"
                                value={`₱ ${walletBalance.toFixed(2)}`}
                                onPress={() => setModalType('wallet')}
                            />
                        ) : (
                            <MenuItem
                                icon="card-outline"
                                label="Payment Methods"
                                value="GCash, PayPal, Cards"
                                onPress={() => setModalType('paymentMethods')}
                            />
                        )}

                        {/* --- SETTINGS --- */}
                        <SectionHeader title="Settings" />
                        <MenuItem
                            icon="notifications-outline"
                            label="Notifications"
                            value="Manage preferences"
                            onPress={() => setModalType('notifications')}
                        />
                        <MenuItem
                            icon="lock-closed-outline"
                            label="Privacy"
                            value="Data & permissions"
                            onPress={() => setModalType('privacy')}
                        />
                        <MenuItem
                            icon="document-text-outline"
                            label="Terms & Policies"
                            onPress={() => setModalType('legal')}
                        />
                        <MenuItem
                            icon="help-buoy-outline"
                            label="Help Center"
                            onPress={() => setModalType('help')}
                        />
                        <MenuItem
                            icon="chatbox-ellipses-outline"
                            label="Support"
                            onPress={() => setModalType('support')}
                        />
                        <MenuItem
                            icon="information-circle-outline"
                            label="About"
                            value="v1.0.0"
                            onPress={() => showCustomAlert('About CREATECH', 'Version 1.0.0\n\nA platform connecting clients with talented creators.\n\n© 2025 CREATECH', 'success')}
                        />

                        {/* --- ADMIN PLATFORM SETTINGS --- */}
                        {profileData?.role === 'admin' && (
                            <>
                                <SectionHeader title="Platform Admin" />
                                <MenuItem
                                    icon="settings-outline"
                                    label="Platform Config"
                                    value="Maintenance, Fees, Suspensions"
                                    color="#a855f7"
                                    onPress={() => setModalType('platformConfig')}
                                />
                                <MenuItem
                                    icon="shield-outline"
                                    label="System Logs"
                                    value="View flagged events"
                                    color="#ef4444"
                                    onPress={() => {
                                        setAdminSettingsTab('logs');
                                        setModalType('platformConfig');
                                    }}
                                />
                            </>
                        )}

                        <View style={{ height: 20 }} />
                        <Pressable style={[styles.logoutButton, { borderColor: theme.danger, backgroundColor: theme.card }]} onPress={handleSignOutPress}>
                            <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 16 }}>{t('logout')}</Text>
                        </Pressable>
                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>

            {/* --- ADMIN PLATFORM CONFIG MODAL --- */}
            <Modal visible={modalType === 'platformConfig'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Platform Settings</Text>
                        <Pressable onPress={() => { setModalType('none'); setAdminSettingsTab('config'); }}>
                            <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text>
                        </Pressable>
                    </View>

                    {/* Tab Switch */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingTop: 16, gap: 12 }}>
                        <Pressable
                            onPress={() => setAdminSettingsTab('config')}
                            style={[
                                { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder },
                                adminSettingsTab === 'config' && { backgroundColor: theme.text, borderColor: theme.text }
                            ]}
                        >
                            <Text style={{ color: adminSettingsTab === 'config' ? theme.background : theme.text, fontWeight: '700', fontSize: 14 }}>Configuration</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setAdminSettingsTab('logs')}
                            style={[
                                { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder },
                                adminSettingsTab === 'logs' && { backgroundColor: theme.text, borderColor: theme.text }
                            ]}
                        >
                            <Text style={{ color: adminSettingsTab === 'logs' ? theme.background : theme.text, fontWeight: '700', fontSize: 14 }}>System Logs</Text>
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 80 }}>
                        {adminSettingsTab === 'config' ? (
                            <View style={{ gap: 0 }}>
                                {/* Maintenance Mode Toggle */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.cardBorder }}>
                                    <View style={{ flex: 1, marginRight: 16 }}>
                                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Maintenance Mode</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18 }}>Restricts login access to Admin accounts only while deploying updates.</Text>
                                    </View>
                                    <Pressable
                                        onPress={() => setMaintenanceMode(!maintenanceMode)}
                                        style={{
                                            width: 52, height: 30, borderRadius: 15,
                                            backgroundColor: maintenanceMode ? theme.tint : theme.cardBorder,
                                            justifyContent: 'center', paddingHorizontal: 3
                                        }}
                                    >
                                        <View style={{
                                            width: 24, height: 24, borderRadius: 12,
                                            backgroundColor: '#fff',
                                            alignSelf: maintenanceMode ? 'flex-end' : 'flex-start',
                                            ...Shadows.xl
                                        }} />
                                    </Pressable>
                                </View>

                                {/* Auto-Suspend Toggle */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.cardBorder }}>
                                    <View style={{ flex: 1, marginRight: 16 }}>
                                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Automated Suspensions</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18 }}>Automatically suspend creators whose report count exceeds 5.</Text>
                                    </View>
                                    <Pressable
                                        onPress={() => setAutoSuspend(!autoSuspend)}
                                        style={{
                                            width: 52, height: 30, borderRadius: 15,
                                            backgroundColor: autoSuspend ? '#10b981' : theme.cardBorder,
                                            justifyContent: 'center', paddingHorizontal: 3
                                        }}
                                    >
                                        <View style={{
                                            width: 24, height: 24, borderRadius: 12,
                                            backgroundColor: '#fff',
                                            alignSelf: autoSuspend ? 'flex-end' : 'flex-start',
                                            ...Shadows.xl
                                        }} />
                                    </Pressable>
                                </View>

                                {/* Commission Rate Input */}
                                <View style={{ paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.cardBorder }}>
                                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Platform Commission Rate</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 16 }}>Percentage fee charged on each transaction.</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <TextInput
                                            style={[styles.input, themeStyles.input, { width: 80, textAlign: 'center', fontSize: 18, fontWeight: '700' }]}
                                            value={commissionRate}
                                            onChangeText={setCommissionRate}
                                            keyboardType="numeric"
                                            maxLength={2}
                                        />
                                        <Text style={{ color: theme.textSecondary, fontSize: 18, fontWeight: '600' }}>%</Text>
                                    </View>
                                </View>

                                {/* Save Button */}
                                <Pressable
                                    style={{ backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 }}
                                    onPress={() => showCustomAlert('Saved', 'Platform configuration has been updated.', 'success')}
                                >
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save Configurations</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={{ gap: 16 }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 8 }}>Flagged system anomalies and server events from the last 24 hours.</Text>

                                {[
                                    { id: 'ERR091', time: '10:45 AM', event: 'Failed API Handshake', source: 'Stripe Gateway', color: '#ef4444' },
                                    { id: 'SEC042', time: '09:12 AM', event: 'Anomalous Login Attempt', source: 'IP 192.168.x.x', color: '#eab308' },
                                    { id: 'SEC043', time: '09:10 AM', event: 'Anomalous Login Attempt', source: 'IP 192.168.x.x', color: '#eab308' },
                                ].map(log => (
                                    <View key={log.id} style={[
                                        {
                                            flexDirection: 'row', alignItems: 'center', gap: 14,
                                            padding: 16, borderRadius: 14, borderLeftWidth: 4,
                                            borderLeftColor: log.color,
                                            backgroundColor: `${log.color}08`, borderWidth: 1, borderColor: theme.cardBorder
                                        }
                                    ]}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{log.event}</Text>
                                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{log.time}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{log.id}</Text>
                                                <Text style={{ color: log.color, fontSize: 12, fontWeight: '600' }}>{log.source}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                <Pressable
                                    style={{ borderWidth: 1, borderColor: theme.cardBorder, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 }}
                                    onPress={() => showCustomAlert('Export', 'System logs exported to CSV.', 'success')}
                                >
                                    <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '600' }}>Export Logs CSV</Text>
                                </Pressable>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* --- MODALS --- */}

            {/* 1. PERSONAL INFO */}
            <Modal visible={modalType === 'personal'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>{t('personalDetails')}</Text>
                        <Pressable onPress={() => setModalType('none')}>
                            <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>{t('done')}</Text>
                        </Pressable>
                    </View>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
                            <Text style={[styles.inputLabel, themeStyles.text]}>First Name</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={form.first_name}
                                onChangeText={t => {
                                    // Only allow letters and spaces, but prevent leading spaces
                                    let filtered = t.replace(/[^a-zA-Z\s]/g, '');
                                    if (filtered.startsWith(' ')) {
                                        filtered = filtered.trimStart();
                                    }
                                    setForm({ ...form, first_name: filtered });
                                }}
                                placeholderTextColor={theme.textSecondary}
                            />

                            <Text style={[styles.inputLabel, themeStyles.text]}>Middle Name (Optional)</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={form.middle_name}
                                onChangeText={t => {
                                    // Only allow letters and spaces, but prevent leading spaces
                                    let filtered = t.replace(/[^a-zA-Z\s]/g, '');
                                    if (filtered.startsWith(' ')) {
                                        filtered = filtered.trimStart();
                                    }
                                    setForm({ ...form, middle_name: filtered });
                                }}
                                placeholderTextColor={theme.textSecondary}
                            />

                            <Text style={[styles.inputLabel, themeStyles.text]}>Last Name</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={form.last_name}
                                onChangeText={t => {
                                    // Only allow letters and spaces, but prevent leading spaces
                                    let filtered = t.replace(/[^a-zA-Z\s]/g, '');
                                    if (filtered.startsWith(' ')) {
                                        filtered = filtered.trimStart();
                                    }
                                    setForm({ ...form, last_name: filtered });
                                }}
                                placeholderTextColor={theme.textSecondary}
                            />

                            {/* Birthdate Calendar Trigger */}
                            <Text style={[styles.inputLabel, themeStyles.text]}>Birthdate</Text>
                            <Pressable
                                style={[styles.input, themeStyles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                                onPress={openDatePicker}
                            >
                                <Text style={{ color: form.birthdate ? theme.text : theme.textSecondary }}>
                                    {form.birthdate || 'DD/MM/YYYY'}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={theme.text} />
                            </Pressable>

                            {/* Age with validation */}
                            <Text style={[styles.inputLabel, themeStyles.text]}>{t('age')}</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={form.age}
                                onChangeText={handleAgeChange}
                                keyboardType="numeric"
                                maxLength={2}
                                placeholderTextColor={theme.textSecondary}
                            />

                            <Text style={[styles.inputLabel, themeStyles.text]}>{t('gender')}</Text>
                            <TextInput style={[styles.input, themeStyles.input]} value={form.gender} onChangeText={t => setForm({ ...form, gender: t })} placeholder="e.g. Male, Female" placeholderTextColor={theme.textSecondary} />

                            <Text style={[styles.inputLabel, themeStyles.text]}>{t('nationality')}</Text>
                            <TextInput style={[styles.input, themeStyles.input]} value={form.nationality} onChangeText={t => setForm({ ...form, nationality: t })} placeholderTextColor={theme.textSecondary} />

                            {/* Phone with Country Code */}
                            <Text style={[styles.inputLabel, themeStyles.text]}>{t('phone')}</Text>
                            <View style={[styles.phoneRow, themeStyles.input]}>
                                <Pressable
                                    style={styles.flagButton}
                                    onPress={() => setShowCountryModal(true)}
                                >
                                    <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                                    <Feather name="chevron-down" size={16} color={theme.text} />
                                </Pressable>
                                <Text style={[styles.dialCode, { color: theme.text }]}>({selectedCountry.dialCode})</Text>
                                <TextInput
                                    style={[styles.phoneInput, { color: theme.text }]}
                                    value={form.phone}
                                    onChangeText={t => {
                                        // Only allow digits and limit based on country
                                        const digitsOnly = t.replace(/[^0-9]/g, '');
                                        const maxLength = selectedCountry.code === 'PH' || selectedCountry.code === 'GB' ? 11 : 10;
                                        const limited = digitsOnly.slice(0, maxLength);
                                        setForm({ ...form, phone: limited });
                                    }}
                                    keyboardType="phone-pad"
                                    placeholder={selectedCountry.placeholder}
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>

                            <Text style={[styles.inputLabel, themeStyles.text]}>{t('address')}</Text>
                            <TextInput style={[styles.input, themeStyles.input, { height: 100 }]} value={form.address} onChangeText={t => setForm({ ...form, address: t })} multiline placeholderTextColor={theme.textSecondary} />

                            <Pressable onPress={savePersonalData} style={[styles.saveButton, { backgroundColor: theme.tint }]}>
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>}
                            </Pressable>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* 2. CREATOR DETAILS */}
            <Modal visible={modalType === 'creator'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Creator Profile</Text>
                        <Pressable onPress={() => setModalType('none')}>
                            <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>{t('done')}</Text>
                        </Pressable>
                    </View>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">

                            <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>Profile Overview</Text>

                            <Text style={[styles.inputLabel, themeStyles.text]}>Bio / About</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input, { height: 100 }]}
                                value={creatorForm.bio}
                                onChangeText={t => setCreatorForm({ ...creatorForm, bio: t })}
                                multiline
                                placeholder="Tell clients about your services..."
                                placeholderTextColor={theme.textSecondary}
                            />

                            <Text style={[styles.inputLabel, themeStyles.text]}>Years of Experience</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={creatorForm.experience_years}
                                onChangeText={t => setCreatorForm({ ...creatorForm, experience_years: t })}
                                keyboardType="numeric"
                                placeholder="e.g. 5"
                                placeholderTextColor={theme.textSecondary}
                            />

                            <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>Service Details</Text>

                            <Text style={[styles.inputLabel, themeStyles.text]}>Starting Price (₱)</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={creatorForm.starting_price}
                                onChangeText={t => setCreatorForm({ ...creatorForm, starting_price: t })}
                                keyboardType="numeric"
                                placeholder="e.g. 500"
                                placeholderTextColor={theme.textSecondary}
                            />

                            <Text style={[styles.inputLabel, themeStyles.text]}>Turnaround Time</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={creatorForm.turnaround_time}
                                onChangeText={t => setCreatorForm({ ...creatorForm, turnaround_time: t })}
                                placeholder="e.g. 3-5 days"
                                placeholderTextColor={theme.textSecondary}
                            />

                            <Text style={[styles.inputLabel, themeStyles.text]}>Portfolio URL</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={creatorForm.portfolio_url}
                                onChangeText={t => setCreatorForm({ ...creatorForm, portfolio_url: t })}
                                autoCapitalize="none"
                                placeholder="https://my-portfolio.com"
                                placeholderTextColor={theme.textSecondary}
                            />

                            <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>Skills</Text>
                            <Text style={[styles.inputLabel, themeStyles.textSecondary]}>1. Filter by Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                                {MAIN_CATEGORIES.map((cat) => {
                                    const isActive = activeCategory === cat.label;
                                    return (
                                        <Pressable
                                            key={cat.id}
                                            onPress={() => setActiveCategory(cat.label)}
                                            style={[
                                                styles.categoryCard,
                                                themeStyles.categoryCard,
                                                isActive && { backgroundColor: theme.tint, borderColor: theme.tint }
                                            ]}
                                        >
                                            <Ionicons name={cat.icon as any} size={20} color={isActive ? '#fff' : theme.text} />
                                            <Text style={[styles.categoryCardText, { color: isActive ? '#fff' : theme.text }]}>
                                                {cat.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>

                            {activeCategory && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={[styles.inputLabel, themeStyles.textSecondary]}>2. Select Skills for {activeCategory}</Text>
                                    <View style={styles.chipsContainer}>
                                        {SUBCATEGORY_MAP[activeCategory]?.map((skill) => {
                                            const isSelected = creatorForm.skills.includes(skill);
                                            return (
                                                <Pressable
                                                    key={skill}
                                                    style={[
                                                        styles.chip,
                                                        themeStyles.chip,
                                                        isSelected && { backgroundColor: theme.tint, borderColor: theme.tint }
                                                    ]}
                                                    onPress={() => toggleSkill(skill)}
                                                >
                                                    <Text style={[styles.chipText, themeStyles.text, isSelected && { color: '#fff' }]}>{skill}</Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.inputLabel, themeStyles.text]}>Current Skills:</Text>
                                <View style={styles.chipsContainer}>
                                    {creatorForm.skills.length === 0 && <Text style={themeStyles.textSecondary}>No skills selected.</Text>}
                                    {creatorForm.skills.map((skill, index) => (
                                        <Pressable key={index} style={[styles.chip, { backgroundColor: theme.tint, borderColor: theme.tint }]} onPress={() => toggleSkill(skill)}>
                                            <Text style={[styles.chipText, { color: '#fff' }]}>{skill}</Text>
                                            <Ionicons name="close" size={14} color="#fff" style={{ marginLeft: 4 }} />
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <Pressable onPress={saveCreatorData} style={[styles.saveButton, { backgroundColor: theme.tint, marginTop: 30 }]}>
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>}
                            </Pressable>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* 3. SECURITY */}
            <Modal visible={modalType === 'security'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>{t('security')}</Text>
                        <Pressable onPress={() => setModalType('none')}>
                            <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>{t('done')}</Text>
                        </Pressable>
                    </View>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
                            {isSocialAuth ? (
                                <View style={styles.socialWarning}>
                                    <Ionicons name="warning-outline" size={32} color={theme.text} />
                                    <Text style={[themeStyles.text, { textAlign: 'center', marginTop: 10 }]}>
                                        {t('socialWarning')}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={[styles.inputLabel, themeStyles.text]}>Email Address</Text>
                                    <TextInput
                                        style={[styles.input, themeStyles.input]}
                                        value={newEmail}
                                        onChangeText={(text) => {
                                            // Prevent leading spaces
                                            let filtered = text;
                                            if (filtered.startsWith(' ')) {
                                                filtered = filtered.trimStart();
                                            }
                                            setNewEmail(filtered);
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholderTextColor={theme.textSecondary}
                                        placeholder="your@email.com"
                                    />
                                    <Text style={[styles.helperText, themeStyles.textSecondary]}>
                                        Note: Changing your email requires verification. A link will be sent to your new email.
                                    </Text>

                                    <Text style={[styles.sectionHeaderLabel, themeStyles.textSecondary]}>{t('changePass')}</Text>

                                    <Text style={[styles.inputLabel, themeStyles.text]}>{t('currPass')}</Text>
                                    <TextInput
                                        style={[styles.input, themeStyles.input]}
                                        value={currentPassword}
                                        onChangeText={(text) => {
                                            // Prevent leading spaces
                                            let filtered = text;
                                            if (filtered.startsWith(' ')) {
                                                filtered = filtered.trimStart();
                                            }
                                            setCurrentPassword(filtered);
                                        }}
                                        secureTextEntry
                                        placeholderTextColor={theme.textSecondary}
                                        placeholder="Enter current password"
                                    />

                                    <Text style={[styles.inputLabel, themeStyles.text]}>{t('newPass')}</Text>
                                    <TextInput
                                        style={[styles.input, themeStyles.input]}
                                        value={newPassword}
                                        onChangeText={(text) => {
                                            // Prevent leading spaces
                                            let filtered = text;
                                            if (filtered.startsWith(' ')) {
                                                filtered = filtered.trimStart();
                                            }
                                            setNewPassword(filtered);
                                        }}
                                        secureTextEntry
                                        placeholderTextColor={theme.textSecondary}
                                        placeholder="Enter new password (min 8 chars)"
                                    />

                                    <Text style={[styles.inputLabel, themeStyles.text]}>{t('confirmPass')}</Text>
                                    <TextInput
                                        style={[styles.input, themeStyles.input]}
                                        value={confirmNewPassword}
                                        onChangeText={(text) => {
                                            // Prevent leading spaces
                                            let filtered = text;
                                            if (filtered.startsWith(' ')) {
                                                filtered = filtered.trimStart();
                                            }
                                            setConfirmNewPassword(filtered);
                                        }}
                                        secureTextEntry
                                        placeholderTextColor={theme.textSecondary}
                                        placeholder="Confirm new password"
                                    />

                                    <Pressable onPress={saveSecurityData} style={[styles.saveButton, { backgroundColor: theme.tint }]}>
                                        {securityLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('updateCreds')}</Text>}
                                    </Pressable>

                                    <Pressable onPress={handleForgotPassword} style={{ marginTop: 20, alignItems: 'center', padding: 10 }}>
                                        <Text style={{ color: theme.tint, fontWeight: '600' }}>{t('forgotPass')}</Text>
                                    </Pressable>
                                </>
                            )}
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* 4. FOLLOWING LIST (CLIENT) */}
            <Modal visible={modalType === 'following'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Following</Text>
                        <Pressable onPress={() => setModalType('none')}><Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Close</Text></Pressable>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 24 }}>
                        {followingList.length === 0 ? (
                            <View style={{ alignItems: 'center', marginTop: 50 }}>
                                <Ionicons name="heart-outline" size={64} color={theme.textSecondary} style={{ marginBottom: 16 }} />
                                <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 8 }]}>Not following anyone yet</Text>
                                <Text style={[themeStyles.textSecondary, { textAlign: 'center' }]}>Discover creators and follow them!</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={[styles.sectionHeaderLabel, themeStyles.textSecondary, { marginBottom: 16 }]}>
                                    {followingList.length} {followingList.length === 1 ? 'Creator' : 'Creators'}
                                </Text>
                                {followingList.map((item) => (
                                    <View key={item.id} style={[styles.followCard, themeStyles.card]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <Image
                                                source={{ uri: item.avatar || 'https://placehold.co/100x100' }}
                                                style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme.cardBorder }}
                                            />
                                            <View style={{ marginLeft: 12, flex: 1 }}>
                                                <Text style={[styles.userName, themeStyles.text, { fontSize: 16 }]}>{item.name}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                    <View style={[styles.roleBadge, { backgroundColor: theme.tint + '20' }]}>
                                                        <Text style={[styles.roleBadgeText, { color: theme.tint }]}>
                                                            {item.role?.toUpperCase() || 'CREATOR'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                        <Pressable
                                            onPress={() => handleUnfollow(item.id)}
                                            style={{ paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.danger, borderRadius: 20, backgroundColor: theme.danger + '10' }}
                                        >
                                            <Text style={{ fontSize: 12, color: theme.danger, fontWeight: '600' }}>Unfollow</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* 4. FOLLOWERS (CREATOR) */}
            <Modal visible={modalType === 'followers'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Followers</Text>
                        <Pressable onPress={() => setModalType('none')}><Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Close</Text></Pressable>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 24 }}>
                        {followersList.length === 0 ? (
                            <View style={{ alignItems: 'center', marginTop: 50 }}>
                                <Ionicons name="people-outline" size={64} color={theme.textSecondary} style={{ marginBottom: 16 }} />
                                <Text style={[themeStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 8 }]}>No followers yet</Text>
                                <Text style={[themeStyles.textSecondary, { textAlign: 'center' }]}>Share your profile to gain followers!</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={[styles.sectionHeaderLabel, themeStyles.textSecondary, { marginBottom: 16 }]}>
                                    {followersList.length} {followersList.length === 1 ? 'Follower' : 'Followers'}
                                </Text>
                                {followersList.map((item) => (
                                    <View key={item.id} style={[styles.followCard, themeStyles.card]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <Image
                                                source={{ uri: item.avatar || 'https://placehold.co/100x100' }}
                                                style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme.cardBorder }}
                                            />
                                            <View style={{ marginLeft: 12, flex: 1 }}>
                                                <Text style={[styles.userName, themeStyles.text, { fontSize: 16 }]}>{item.name}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                    <View style={[styles.roleBadge, { backgroundColor: theme.tint + '20' }]}>
                                                        <Text style={[styles.roleBadgeText, { color: theme.tint }]}>
                                                            {item.role?.toUpperCase() || 'CLIENT'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* 5. PAYMENT METHODS (CLIENT) */}
            <Modal visible={modalType === 'paymentMethods'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Payment Methods</Text>
                        <Pressable onPress={() => setModalType('none')}><Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text></Pressable>
                    </View>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ padding: 24 }}>
                            <Text style={[styles.sectionHeaderLabel, themeStyles.textSecondary]}>Saved Methods</Text>
                            {paymentMethods.length === 0 && <Text style={[themeStyles.text, { marginBottom: 20 }]}>No saved payment methods.</Text>}
                            {paymentMethods.map(pm => (
                                <View key={pm.id} style={[styles.paymentCard, themeStyles.card]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Ionicons name={
                                            pm.method_type === 'Credit Card' ? 'card' :
                                                pm.method_type === 'PayPal' ? 'logo-paypal' :
                                                    pm.method_type === 'Bank Transfer' ? 'business' : 'wallet'
                                        } size={24} color={theme.text} />
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={[styles.userName, themeStyles.text, { fontSize: 16 }]}>{pm.method_type}</Text>
                                            <Text style={themeStyles.textSecondary}>{pm.masked_number}</Text>
                                        </View>
                                    </View>
                                    {/* Delete Button */}
                                    <Pressable
                                        onPress={() => handleRemovePaymentMethod(pm.id)}
                                        style={{ padding: 8 }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={theme.danger} />
                                    </Pressable>
                                </View>
                            ))}

                            <View style={[styles.divider, { backgroundColor: theme.cardBorder, marginVertical: 24 }]} />

                            <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>Add New Method</Text>

                            <View style={styles.methodScroll}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
                                    {PAYMENT_OPTIONS.filter(opt => !paymentMethods.some(pm => pm.method_type === opt.type)).map(opt => (
                                        <Pressable
                                            key={opt.type}
                                            onPress={() => setFinanceForm({ ...financeForm, type: opt.type })}
                                            style={[styles.chip, themeStyles.chip, financeForm.type === opt.type && { backgroundColor: theme.tint, borderColor: theme.tint }]}
                                        >
                                            <Ionicons name={opt.icon as any} size={16} color={financeForm.type === opt.type ? '#fff' : theme.text} style={{ marginRight: 6 }} />
                                            <Text style={[styles.chipText, themeStyles.text, financeForm.type === opt.type && { color: '#fff' }]}>{opt.label}</Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>

                            {renderFinanceInputs()}

                            <Pressable onPress={handleAddPaymentMethod} style={[styles.saveButton, { backgroundColor: theme.tint }]}>
                                <Text style={styles.saveButtonText}>Save Payment Method</Text>
                            </Pressable>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* 6. WALLET (CREATOR) */}
            <Modal visible={modalType === 'wallet'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>My Wallet</Text>
                        <Pressable onPress={() => setModalType('none')}><Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text></Pressable>
                    </View>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ padding: 24 }}>
                            {/* Balance Card (CREATOR) */}
                            <View style={[styles.balanceCard, { backgroundColor: theme.tint }]}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Total Earnings</Text>
                                <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700', marginVertical: 8 }}>₱ {walletBalance.toFixed(2)}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Available for withdrawal via stored methods</Text>
                            </View>

                            {/* Saved Payout Methods (CREATOR) */}
                            <Text style={[styles.sectionHeaderLabel, themeStyles.textSecondary]}>Saved Payout Methods</Text>
                            {userWallets.length === 0 && <Text style={[themeStyles.text, { marginBottom: 20 }]}>No saved payout methods.</Text>}
                            {userWallets.map(w => (
                                <View key={w.id} style={[styles.paymentCard, themeStyles.card]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Ionicons name={
                                            w.wallet_type === 'Credit Card' ? 'card' :
                                                w.wallet_type === 'PayPal' ? 'logo-paypal' :
                                                    w.wallet_type === 'Bank Transfer' ? 'business' : 'wallet'
                                        } size={24} color={theme.text} />
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={[styles.userName, themeStyles.text, { fontSize: 16 }]}>{w.wallet_type}</Text>
                                            <Text style={themeStyles.textSecondary}>{w.account_number}</Text>
                                        </View>
                                    </View>

                                    {/* Delete Button */}
                                    <Pressable
                                        onPress={() => handleRemoveWalletMethod(w.id)}
                                        style={{ padding: 8 }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={theme.danger} />
                                    </Pressable>
                                </View>
                            ))}

                            <View style={[styles.divider, { backgroundColor: theme.cardBorder, marginVertical: 24 }]} />

                            {/* Add New Method Section (CREATOR) */}
                            <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>Add New Payout Method</Text>

                            <View style={styles.methodScroll}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
                                    {PAYMENT_OPTIONS.filter(opt => !userWallets.some(w => w.wallet_type === opt.type)).map(opt => (
                                        <Pressable
                                            key={opt.type}
                                            onPress={() => setFinanceForm({ ...financeForm, type: opt.type })}
                                            style={[styles.chip, themeStyles.chip, financeForm.type === opt.type && { backgroundColor: theme.tint, borderColor: theme.tint }]}
                                        >
                                            <Ionicons name={opt.icon as any} size={16} color={financeForm.type === opt.type ? '#fff' : theme.text} style={{ marginRight: 6 }} />
                                            <Text style={[styles.chipText, themeStyles.text, financeForm.type === opt.type && { color: '#fff' }]}>{opt.label}</Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>

                            {renderFinanceInputs()}

                            <Pressable onPress={handleAddWalletMethod} style={[styles.saveButton, { backgroundColor: theme.tint }]}>
                                <Text style={styles.saveButtonText}>Save Payout Method</Text>
                            </Pressable>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* 7. HELP CENTER */}
            <Modal visible={modalType === 'help'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Help Center</Text>
                        <Pressable onPress={() => setModalType('none')}><Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Close</Text></Pressable>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                        <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>Getting Started</Text>
                        {[
                            { q: "How do I create an account?", a: "Download the app, tap 'Sign Up', and enter your email and password. Verify your email to get started." },
                            { q: "What's the difference between Client and Creator?", a: "Clients purchase services from creators. Creators offer and sell their skills and services on the platform." },
                            { q: "How do I become a creator?", a: "Go to your Profile, tap 'Become a Creator', and complete the onboarding process with your skills, bio, and portfolio." },
                        ].map((item, i) => (
                            <View key={i} style={[styles.faqItem, themeStyles.card]}>
                                <Text style={[themeStyles.text, { fontWeight: '700', marginBottom: 4 }]}>{item.q}</Text>
                                <Text style={themeStyles.textSecondary}>{item.a}</Text>
                            </View>
                        ))}

                        <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>Orders & Payments</Text>
                        {[
                            { q: "How does the escrow system work?", a: "When you pay for an order, funds are held in escrow. They're only released to the creator when you approve the delivered work, ensuring safe transactions." },
                            { q: "Can I cancel an order?", a: "Yes, pending orders can be cancelled. Active orders require refund requests which the creator must approve or deliver within 24 hours." },
                            { q: "What payment methods are accepted?", a: "We accept GCash, PayMaya, PayPal, bank transfers, and credit/debit cards. Add your preferred method in Profile > Payment Methods." },
                            { q: "How do refunds work?", a: "If a creator misses the deadline, clients can request a refund. Creators have 24 hours to deliver or approve. Refunds go back to your original payment method." },
                            { q: "Can I extend a deadline?", a: "Yes! Creators can request extensions with a reason. Clients must review and approve or deny the request." },
                        ].map((item, i) => (
                            <View key={i} style={[styles.faqItem, themeStyles.card]}>
                                <Text style={[themeStyles.text, { fontWeight: '700', marginBottom: 4 }]}>{item.q}</Text>
                                <Text style={themeStyles.textSecondary}>{item.a}</Text>
                            </View>
                        ))}

                        <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>Account & Security</Text>
                        {[
                            { q: "How do I reset my password?", a: "Go to Profile > Security and tap 'Forgot Password'. A reset link will be sent to your email." },
                            { q: "How do I change my email?", a: "Go to Profile > Security, enter your current password, input new email, and verify it through the link sent to your new address." },
                            { q: "Is my personal information secure?", a: "Yes! We use industry-standard encryption and never share your data with third parties without consent." },
                            { q: "Can I delete my account?", a: "Yes. Contact support with your request. Note: Active orders must be completed first." },
                        ].map((item, i) => (
                            <View key={i} style={[styles.faqItem, themeStyles.card]}>
                                <Text style={[themeStyles.text, { fontWeight: '700', marginBottom: 4 }]}>{item.q}</Text>
                                <Text style={themeStyles.textSecondary}>{item.a}</Text>
                            </View>
                        ))}

                        <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>For Creators</Text>
                        {[
                            { q: "How do I get paid?", a: "Add payout methods in Wallet. Funds from completed orders appear in your balance. Withdraw anytime to your saved methods." },
                            { q: "What are the platform fees?", a: "The platform takes a small commission from each completed order to maintain the service and support." },
                            { q: "How do I improve my rating?", a: "Deliver high-quality work on time, communicate clearly with clients, and maintain professional service standards." },
                            { q: "Can I offer custom services?", a: "Yes! Clients can request custom services through chat. Discuss details, agree on price and deadline, then create the order." },
                        ].map((item, i) => (
                            <View key={i} style={[styles.faqItem, themeStyles.card]}>
                                <Text style={[themeStyles.text, { fontWeight: '700', marginBottom: 4 }]}>{item.q}</Text>
                                <Text style={themeStyles.textSecondary}>{item.a}</Text>
                            </View>
                        ))}

                        <Text style={[styles.sectionHeaderLabel, themeStyles.text]}>Troubleshooting</Text>
                        {[
                            { q: "I can't log in. What should I do?", a: "Ensure you're using the correct email and password. Try 'Forgot Password' or check if your account needs email verification." },
                            { q: "My payment failed. Why?", a: "Check your payment method details, ensure sufficient funds, and verify your internet connection. Contact support if issues persist." },
                            { q: "I didn't receive a notification. Help!", a: "Check notification settings in your device and app permissions. Ensure the app is updated to the latest version." },
                            { q: "The app is running slow or crashing.", a: "Clear app cache, update to the latest version, or reinstall the app. Contact support if problems continue." },
                        ].map((item, i) => (
                            <View key={i} style={[styles.faqItem, themeStyles.card]}>
                                <Text style={[themeStyles.text, { fontWeight: '700', marginBottom: 4 }]}>{item.q}</Text>
                                <Text style={themeStyles.textSecondary}>{item.a}</Text>
                            </View>
                        ))}

                        <Pressable
                            style={[styles.helpCenterContact, { backgroundColor: theme.tint }]}
                            onPress={() => {
                                setModalType('none');
                                setTimeout(() => setModalType('support'), 300);
                            }}
                        >
                            <Ionicons name="chatbox-ellipses-outline" size={20} color="#fff" />
                            <Text style={styles.helpCenterContactText}>Still need help? Contact Support</Text>
                        </Pressable>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* 8. SUPPORT */}
            <Modal visible={modalType === 'support'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Support</Text>
                        <Pressable onPress={() => setModalType('none')}><Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Close</Text></Pressable>
                    </View>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                            <View style={{ alignItems: 'center', marginBottom: 30 }}>
                                <View style={[styles.supportIconCircle, { backgroundColor: theme.tint + '15' }]}>
                                    <MaterialIcons name="support-agent" size={48} color={theme.tint} />
                                </View>
                                <Text style={[styles.supportTitle, themeStyles.text]}>How can we help?</Text>
                                <Text style={[styles.supportSubtitle, themeStyles.textSecondary]}>We're here to assist you 24/7</Text>
                            </View>

                            {/* Quick Actions */}
                            <Text style={[styles.inputLabel, themeStyles.text]}>Quick Actions</Text>
                            <View style={styles.quickActionsRow}>
                                <Pressable style={[styles.quickActionBtn, themeStyles.card]} onPress={() => setModalType('help')}>
                                    <Ionicons name="help-circle-outline" size={32} color={theme.tint} />
                                    <Text style={[styles.quickActionText, themeStyles.text]}>FAQ</Text>
                                </Pressable>
                                <Pressable style={[styles.quickActionBtn, themeStyles.card]} onPress={() => {
                                    // Open email client
                                    // Linking.openURL('mailto:support@createch.com');
                                    showCustomAlert('Email Support', 'Send us an email at: support@createch.com', 'success');
                                }}>
                                    <Ionicons name="mail-outline" size={32} color={theme.tint} />
                                    <Text style={[styles.quickActionText, themeStyles.text]}>Email</Text>
                                </Pressable>
                                <Pressable style={[styles.quickActionBtn, themeStyles.card]} onPress={() => {
                                    showCustomAlert('Live Chat', 'Live chat coming soon! For now, please submit a ticket or email us.', 'warning');
                                }}>
                                    <Ionicons name="chatbubbles-outline" size={32} color={theme.tint} />
                                    <Text style={[styles.quickActionText, themeStyles.text]}>Live Chat</Text>
                                </Pressable>
                            </View>

                            {/* Issue Category */}
                            <Text style={[styles.inputLabel, themeStyles.text, { marginTop: 20 }]}>What do you need help with?</Text>
                            <View style={styles.categoryGrid}>
                                {[
                                    { label: 'Account Issues', icon: 'person-circle-outline' },
                                    { label: 'Payment Problems', icon: 'card-outline' },
                                    { label: 'Order Disputes', icon: 'alert-circle-outline' },
                                    { label: 'Technical Bug', icon: 'bug-outline' },
                                    { label: 'Feature Request', icon: 'bulb-outline' },
                                    { label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
                                ].map((cat, idx) => (
                                    <Pressable
                                        key={idx}
                                        style={[styles.categoryChip, themeStyles.card]}
                                        onPress={() => setSupportMessage(prev => `[${cat.label}] ` + prev.replace(/^\[.*?\] /, ''))}
                                    >
                                        <Ionicons name={cat.icon as any} size={20} color={theme.text} />
                                        <Text style={[styles.categoryChipText, themeStyles.text]}>{cat.label}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Support Ticket Form */}
                            <Text style={[styles.inputLabel, themeStyles.text, { marginTop: 20 }]}>Describe your issue</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input, { height: 150, textAlignVertical: 'top' }]}
                                multiline
                                placeholder="Please provide as much detail as possible... What happened? When did it occur? Steps to reproduce (if applicable)"
                                placeholderTextColor={theme.textSecondary}
                                value={supportMessage}
                                onChangeText={setSupportMessage}
                            />

                            {/* User Info Display */}
                            <View style={[styles.userInfoCard, themeStyles.card]}>
                                <Text style={[styles.userInfoTitle, themeStyles.textSecondary]}>Your Account Information</Text>
                                <View style={styles.userInfoRow}>
                                    <Text style={themeStyles.textSecondary}>Email:</Text>
                                    <Text style={[themeStyles.text, { fontWeight: '600' }]}>{user?.email || 'Not available'}</Text>
                                </View>
                                <View style={styles.userInfoRow}>
                                    <Text style={themeStyles.textSecondary}>User ID:</Text>
                                    <Text style={[themeStyles.text, { fontWeight: '600', fontSize: 12 }]}>{user?.uid?.slice(0, 20)}...</Text>
                                </View>
                                <View style={styles.userInfoRow}>
                                    <Text style={themeStyles.textSecondary}>Account Type:</Text>
                                    <Text style={[themeStyles.text, { fontWeight: '600' }]}>{profileData?.role?.toUpperCase() || 'CLIENT'}</Text>
                                </View>
                            </View>

                            <Pressable onPress={handleSubmitSupport} style={[styles.saveButton, { backgroundColor: theme.tint, marginBottom: 10 }]}>
                                <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>Submit Support Ticket</Text>
                            </Pressable>

                            {/* Support Hours */}
                            <View style={[styles.supportHoursCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                                <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={[themeStyles.text, { fontWeight: '600', marginBottom: 2 }]}>Support Hours</Text>
                                    <Text style={[themeStyles.textSecondary, { fontSize: 12 }]}>24/7 for urgent issues • Business hours (9 AM - 6 PM PHT) for general inquiries</Text>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* 9. LEGAL (TERMS & DPA) */}
            <Modal visible={modalType === 'legal'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Legal</Text>
                        <Pressable onPress={() => setModalType('none')}><Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Close</Text></Pressable>
                    </View>

                    {/* Tab Switcher */}
                    <View style={styles.legalTabContainer}>
                        <Pressable
                            style={[styles.legalTab, legalTab === 'terms' && { borderBottomColor: theme.tint, borderBottomWidth: 3 }]}
                            onPress={() => setLegalTab('terms')}
                        >
                            <Text style={[themeStyles.text, legalTab === 'terms' && { color: theme.tint, fontWeight: '700' }]}>
                                Terms of Service
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.legalTab, legalTab === 'dpa' && { borderBottomColor: theme.tint, borderBottomWidth: 3 }]}
                            onPress={() => setLegalTab('dpa')}
                        >
                            <Text style={[themeStyles.text, legalTab === 'dpa' && { color: theme.tint, fontWeight: '700' }]}>
                                Privacy Policy
                            </Text>
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                        <Text style={[styles.legalText, themeStyles.text]}>
                            {legalTab === 'terms' ? TERMS_CONTENT : DPA_CONTENT}
                        </Text>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* 10. PRIVACY & DATA */}
            <Modal visible={modalType === 'privacy'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Privacy & Data</Text>
                        <Pressable onPress={() => setModalType('none')}><Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Close</Text></Pressable>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                        {/* Data Security Section */}
                        <View style={[styles.privacySection, themeStyles.card]}>
                            <View style={styles.privacySectionHeader}>
                                <View style={[styles.privacyIconCircle, { backgroundColor: '#10b981' + '20' }]}>
                                    <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.privacySectionTitle, themeStyles.text]}>Data Security</Text>
                                    <Text style={[styles.privacySectionDesc, themeStyles.textSecondary]}>
                                        Your information is protected with enterprise-grade security
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.privacyDetails}>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    <Text style={[styles.privacyDetailText, themeStyles.text]}>End-to-end encryption for messages</Text>
                                </View>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    <Text style={[styles.privacyDetailText, themeStyles.text]}>AES-256 encryption at rest</Text>
                                </View>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    <Text style={[styles.privacyDetailText, themeStyles.text]}>TLS 1.3 encryption in transit</Text>
                                </View>
                            </View>
                        </View>

                        {/* Data Collection Section */}
                        <View style={[styles.privacySection, themeStyles.card]}>
                            <View style={styles.privacySectionHeader}>
                                <View style={[styles.privacyIconCircle, { backgroundColor: '#3b82f6' + '20' }]}>
                                    <Ionicons name="analytics" size={24} color="#3b82f6" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.privacySectionTitle, themeStyles.text]}>Data We Collect</Text>
                                    <Text style={[styles.privacySectionDesc, themeStyles.textSecondary]}>
                                        Information we gather to provide our services
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.privacyDetails}>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="person-circle-outline" size={20} color={theme.text} />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={[styles.privacyDetailTitle, themeStyles.text]}>Account Information</Text>
                                        <Text style={[styles.privacyDetailSubtext, themeStyles.textSecondary]}>
                                            Name, email, phone number, profile picture
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="briefcase-outline" size={20} color={theme.text} />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={[styles.privacyDetailTitle, themeStyles.text]}>Transaction Data</Text>
                                        <Text style={[styles.privacyDetailSubtext, themeStyles.textSecondary]}>
                                            Order history, payment methods, invoices
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="bar-chart-outline" size={20} color={theme.text} />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={[styles.privacyDetailTitle, themeStyles.text]}>Usage Analytics</Text>
                                        <Text style={[styles.privacyDetailSubtext, themeStyles.textSecondary]}>
                                            App interactions, features used, session duration
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="phone-portrait-outline" size={20} color={theme.text} />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={[styles.privacyDetailTitle, themeStyles.text]}>Device Information</Text>
                                        <Text style={[styles.privacyDetailSubtext, themeStyles.textSecondary]}>
                                            Device type, OS version, unique identifiers
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Data Rights Section */}
                        <View style={[styles.privacySection, themeStyles.card]}>
                            <View style={styles.privacySectionHeader}>
                                <View style={[styles.privacyIconCircle, { backgroundColor: '#8b5cf6' + '20' }]}>
                                    <Ionicons name="hand-left" size={24} color="#8b5cf6" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.privacySectionTitle, themeStyles.text]}>Your Rights</Text>
                                    <Text style={[styles.privacySectionDesc, themeStyles.textSecondary]}>
                                        You have full control over your personal data
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.privacyDetails}>
                                <Pressable
                                    style={[styles.privacyActionRow, { borderColor: theme.cardBorder }]}
                                    onPress={handleAccessData}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.privacyActionTitle, themeStyles.text]}>Access Your Data</Text>
                                        <Text style={[styles.privacyActionDesc, themeStyles.textSecondary]}>Download a copy of all your data</Text>
                                    </View>
                                    <Ionicons name="download-outline" size={20} color={theme.tint} />
                                </Pressable>
                                <Pressable
                                    style={[styles.privacyActionRow, { borderColor: theme.cardBorder }]}
                                    onPress={() => {
                                        setModalType('none');
                                        showCustomAlert('Data Correction', 'You can update your personal information in Profile > Personal Details.', 'success');
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.privacyActionTitle, themeStyles.text]}>Correct Your Data</Text>
                                        <Text style={[styles.privacyActionDesc, themeStyles.textSecondary]}>Update inaccurate information</Text>
                                    </View>
                                    <Ionicons name="create-outline" size={20} color={theme.tint} />
                                </Pressable>
                                <Pressable
                                    style={[styles.privacyActionRow, { borderColor: theme.cardBorder }]}
                                    onPress={() => {
                                        setModalType('none');
                                        showCustomAlert('Account Deletion', 'To permanently delete your account and all data, please contact support. This action cannot be undone.', 'warning');
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.privacyActionTitle, themeStyles.text]}>Delete Your Data</Text>
                                        <Text style={[styles.privacyActionDesc, themeStyles.textSecondary]}>Permanently remove your account</Text>
                                    </View>
                                    <Ionicons name="trash-outline" size={20} color={theme.danger} />
                                </Pressable>
                                <Pressable
                                    style={[styles.privacyActionRow, { borderColor: theme.cardBorder }]}
                                    onPress={handleExportData}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.privacyActionTitle, themeStyles.text]}>Export Your Data</Text>
                                        <Text style={[styles.privacyActionDesc, themeStyles.textSecondary]}>Get data in portable format</Text>
                                    </View>
                                    <Ionicons name="code-download-outline" size={20} color={theme.tint} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Data Sharing Section */}
                        <View style={[styles.privacySection, themeStyles.card]}>
                            <View style={styles.privacySectionHeader}>
                                <View style={[styles.privacyIconCircle, { backgroundColor: '#f59e0b' + '20' }]}>
                                    <Ionicons name="share-social" size={24} color="#f59e0b" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.privacySectionTitle, themeStyles.text]}>Data Sharing</Text>
                                    <Text style={[styles.privacySectionDesc, themeStyles.textSecondary]}>
                                        We never sell your personal information
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.privacyDetails}>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                                    <Text style={[styles.privacyDetailText, themeStyles.text]}>We do not sell your data</Text>
                                </View>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    <Text style={[styles.privacyDetailText, themeStyles.text]}>Shared only with trusted service providers</Text>
                                </View>
                                <View style={styles.privacyDetailRow}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    <Text style={[styles.privacyDetailText, themeStyles.text]}>Required by law when necessary</Text>
                                </View>
                            </View>
                        </View>

                        {/* Contact & Policies */}
                        <View style={{ marginTop: 24 }}>
                            <Pressable
                                style={[styles.privacyFooterButton, { backgroundColor: theme.tint }]}
                                onPress={() => {
                                    setModalType('none');
                                    setTimeout(() => setModalType('legal'), 300);
                                }}
                            >
                                <Ionicons name="document-text-outline" size={20} color="#fff" />
                                <Text style={styles.privacyFooterButtonText}>Read Full Privacy Policy</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.privacyFooterButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, marginTop: 10 }]}
                                onPress={() => {
                                    setModalType('none');
                                    setTimeout(() => setModalType('support'), 300);
                                }}
                            >
                                <Ionicons name="mail-outline" size={20} color={theme.text} />
                                <Text style={[styles.privacyFooterButtonText, { color: theme.text }]}>Contact Privacy Team</Text>
                            </Pressable>
                        </View>

                        <Text style={[styles.privacyFooterNote, themeStyles.textSecondary]}>
                            Last updated: {new Date().toLocaleDateString()}
                            {"\n\n"}
                            For privacy concerns, contact: rafaela.ronaldbienn@gmail.com
                        </Text>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* 11. NOTIFICATIONS */}
            <Modal visible={modalType === 'notifications'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalType('none')}>
                <SafeAreaView style={[styles.modalWrapper, themeStyles.modalContainer]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Notification Settings</Text>
                        <Pressable onPress={() => setModalType('none')}><Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Close</Text></Pressable>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                        {/* Push Notifications */}
                        <View style={[styles.notifSection, themeStyles.card]}>
                            <NotificationSectionHeader
                                icon="notifications"
                                iconColor={theme.tint}
                                title="Push Notifications"
                                description="Receive alerts on your device"
                                enabled={notificationPrefs.pushNotifications}
                                onToggle={() => setNotificationPrefs(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                                theme={theme}
                                themeStyles={themeStyles}
                            />
                        </View>

                        {/* Order Updates */}
                        <View style={[styles.notifSection, themeStyles.card]}>
                            <NotificationToggle
                                icon="receipt-outline"
                                label="Order Updates"
                                description="New orders, status changes, deliveries"
                                enabled={notificationPrefs.orderUpdates}
                                onToggle={() => setNotificationPrefs(prev => ({ ...prev, orderUpdates: !prev.orderUpdates }))}
                                disabled={!notificationPrefs.pushNotifications}
                                theme={theme}
                                themeStyles={themeStyles}
                            />

                            <NotificationToggle
                                icon="chatbubble-outline"
                                label="Messages"
                                description="New messages from clients or creators"
                                enabled={notificationPrefs.messages}
                                onToggle={() => setNotificationPrefs(prev => ({ ...prev, messages: !prev.messages }))}
                                disabled={!notificationPrefs.pushNotifications}
                                theme={theme}
                                themeStyles={themeStyles}
                            />

                            <NotificationToggle
                                icon="star-outline"
                                label="Reviews & Ratings"
                                description="New reviews on your profile"
                                enabled={notificationPrefs.reviews}
                                onToggle={() => setNotificationPrefs(prev => ({ ...prev, reviews: !prev.reviews }))}
                                disabled={!notificationPrefs.pushNotifications}
                                theme={theme}
                                themeStyles={themeStyles}
                            />

                            <NotificationToggle
                                icon="megaphone-outline"
                                label="Promotions & Tips"
                                description="Special offers, features, and platform updates"
                                enabled={notificationPrefs.promotions}
                                onToggle={() => setNotificationPrefs(prev => ({ ...prev, promotions: !prev.promotions }))}
                                disabled={!notificationPrefs.pushNotifications}
                                theme={theme}
                                themeStyles={themeStyles}
                            />
                        </View>

                        {/* Email Notifications */}
                        <View style={[styles.notifSection, themeStyles.card]}>
                            <NotificationSectionHeader
                                icon="mail"
                                iconColor="#8b5cf6"
                                title="Email Notifications"
                                description="Important updates via email"
                                enabled={notificationPrefs.emailNotifications}
                                onToggle={() => setNotificationPrefs(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                                theme={theme}
                                themeStyles={themeStyles}
                            />
                            <Text style={[styles.notifNote, themeStyles.textSecondary]}>
                                We'll send important account and security notifications to {user?.email || 'your email'}
                            </Text>
                        </View>

                        {/* Info Banner */}
                        <View style={[styles.notifInfoBanner, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                            <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
                            <Text style={[styles.notifInfoText, themeStyles.textSecondary]}>
                                You can change these preferences anytime. Critical security alerts will always be sent regardless of settings.
                            </Text>
                        </View>

                        {/* Save Button */}
                        <Pressable
                            style={[styles.saveButton, { backgroundColor: theme.tint, marginTop: 24 }]}
                            onPress={handleSaveNotificationPrefs}
                        >
                            <Text style={styles.saveButtonText}>Save Preferences</Text>
                        </Pressable>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* THEME */}
            <Modal visible={modalType === 'theme'} animationType="fade" transparent onRequestClose={() => setModalType('none')}>
                <Pressable style={styles.modalOverlay} onPress={() => setModalType('none')}>
                    <View style={[styles.popupCard, themeStyles.card]}>
                        <Text style={[styles.modalTitle, themeStyles.text, { marginBottom: 16 }]}>Appearance</Text>
                        {(['light', 'dark', 'system'] as const).map((m) => (
                            <Pressable
                                key={m}
                                style={[styles.langOption, mode === m && { backgroundColor: theme.inputBackground }]}
                                onPress={() => { setMode(m); setModalType('none'); }}
                            >
                                <Text style={[themeStyles.text, mode === m && { color: theme.tint, fontWeight: 'bold' }]}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </Text>
                                {mode === m && <Ionicons name="checkmark" size={20} color={theme.tint} />}
                            </Pressable>
                        ))}
                    </View>
                </Pressable>
            </Modal>

            {/* LOGOUT */}
            <Modal visible={modalType === 'logout'} animationType="fade" transparent onRequestClose={() => setModalType('none')}>
                <Pressable style={styles.modalOverlay} onPress={() => setModalType('none')}>
                    <View style={[styles.popupCard, themeStyles.card]}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.danger + '15', marginBottom: 16 }]}>
                            <Ionicons name="log-out-outline" size={32} color={theme.danger} />
                        </View>
                        <Text style={[styles.modalTitle, themeStyles.text, { textAlign: 'center' }]}>Log Out</Text>
                        <Text style={[themeStyles.textSecondary, { textAlign: 'center', marginBottom: 24, marginTop: 8 }]}>
                            Are you sure you want to sign out?
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Pressable
                                style={[styles.popupBtn, { backgroundColor: theme.inputBackground, flex: 1 }]}
                                onPress={() => setModalType('none')}
                            >
                                <Text style={[styles.btnText, themeStyles.text]}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.popupBtn, { backgroundColor: theme.danger, flex: 1 }]}
                                onPress={performLogout}
                            >
                                <Text style={[styles.btnText, { color: '#fff' }]}>Log Out</Text>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* PAYMENT REMOVAL CONFIRMATION MODAL */}
            <Modal visible={showRemoveConfirmModal} animationType="fade" transparent onRequestClose={() => setShowRemoveConfirmModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowRemoveConfirmModal(false)}>
                    <View style={[styles.popupCard, themeStyles.card]}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.danger + '15', marginBottom: 16 }]}>
                            <Ionicons name="trash-outline" size={32} color={theme.danger} />
                        </View>
                        <Text style={[styles.modalTitle, themeStyles.text, { textAlign: 'center' }]}>Remove Method</Text>
                        <Text style={[themeStyles.textSecondary, { textAlign: 'center', marginBottom: 24, marginTop: 8 }]}>
                            Are you sure you want to remove this method?
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Pressable
                                style={[styles.popupBtn, { backgroundColor: theme.inputBackground, flex: 1 }]}
                                onPress={() => setShowRemoveConfirmModal(false)}
                            >
                                <Text style={[styles.btnText, themeStyles.text]}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.popupBtn, { backgroundColor: theme.danger, flex: 1 }]}
                                onPress={confirmDeletion}
                            >
                                <Text style={[styles.btnText, { color: '#fff' }]}>Remove</Text>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* COUNTRY SELECTION MODAL */}
            <Modal visible={showCountryModal} animationType="slide" onRequestClose={() => setShowCountryModal(false)}>
                <View style={[styles.modalWrapper, themeStyles.container]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Select country</Text>
                        <Pressable onPress={() => setShowCountryModal(false)}>
                            <Feather name="x" size={24} color={theme.text} />
                        </Pressable>
                    </View>
                    <FlatList
                        data={COUNTRIES}
                        keyExtractor={(item) => item.code}
                        renderItem={renderCountryItem}
                    />
                </View>
            </Modal>

            {/* DATE PICKER MODAL */}
            <Modal visible={showDateModal} transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
                <View style={styles.dateModalBackdrop}>
                    <View style={[styles.dateModalCard, { backgroundColor: theme.card }]}>
                        <DateTimePicker
                            value={birthDateObj || new Date(2000, 0, 1)}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            style={{ width: '100%' }}
                            textColor={theme.text}
                        />
                        <Pressable style={[styles.datePickerClose, { backgroundColor: theme.tint }]} onPress={() => setShowDateModal(false)}>
                            <Text style={styles.datePickerCloseText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* CUSTOM ALERT MODAL */}
            <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={closeAlert}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.popupCard, themeStyles.card, { alignItems: 'center', padding: 30 }]}>
                        <View style={[styles.iconCircle, {
                            backgroundColor: alertConfig.type === 'error' ? '#ef444415' : alertConfig.type === 'warning' ? '#f59e0b15' : theme.tint + '15',
                            marginBottom: 16
                        }]}>
                            <Ionicons
                                name={alertConfig.type === 'error' ? "close-circle" : alertConfig.type === 'warning' ? "alert-circle" : "checkmark-circle"}
                                size={48}
                                color={alertConfig.type === 'error' ? '#ef4444' : alertConfig.type === 'warning' ? '#f59e0b' : theme.tint}
                            />
                        </View>
                        <Text style={[styles.modalTitle, themeStyles.text, { textAlign: 'center' }]}>{alertConfig.title}</Text>
                        <Text style={[themeStyles.textSecondary, { textAlign: 'center', marginBottom: 24, marginTop: 8 }]}>
                            {alertConfig.message}
                        </Text>
                        <Pressable style={[styles.popupBtn, { backgroundColor: theme.tint, width: '100%' }]} onPress={closeAlert}>
                            <Text style={[styles.btnText, { color: '#fff' }]}>Okay</Text>
                        </Pressable>
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
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        // Shadows
        ...Shadows.lg,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    themeToggle: { padding: 8 },

    scrollContent: { paddingHorizontal: 20, paddingTop: 24 },

    // PROFILE CARD
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
    },
    avatarWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        position: 'relative'
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 36 },
    avatarText: { fontSize: 24, fontWeight: '700', color: '#64748b' },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: 5,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#fff'
    },
    profileInfo: { flex: 1 },
    userName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    userRole: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },

    // CREATOR STATS
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
    },
    statNumber: { fontSize: 18, fontWeight: '700' },
    statLabel: { fontSize: 12, marginTop: 4, textAlign: 'center' },

    // BECOME CREATOR CARD
    becomeCreatorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        ...Shadows.xl,
    },
    bcContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    bcIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bcTextContainer: {},
    bcTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
    bcSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },

    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingLeft: 4
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    menuText: { fontSize: 16, fontWeight: '600' },
    menuSubText: { fontSize: 12, marginTop: 2 },

    logoutButton: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },

    // MODAL STYLES
    modalWrapper: { flex: 1 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 18, fontWeight: '700' },

    inputLabel: { fontSize: 14, marginBottom: 8, fontWeight: '600', marginTop: 10 },
    input: { padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 10 },
    helperText: { fontSize: 12, marginTop: -6, marginBottom: 16, fontStyle: 'italic' },
    saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    sectionHeaderLabel: { fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 20 },
    socialWarning: { alignItems: 'center', padding: 40, opacity: 0.7 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    popupCard: { width: '80%', padding: 24, borderRadius: 24 },
    langOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8 },

    iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
    popupBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 16, fontWeight: '600' },

    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
    chipText: { fontSize: 14, fontWeight: '500' },

    categoryScroll: { gap: 12, paddingBottom: 10 },
    categoryCard: {
        width: 120,
        height: 90,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        gap: 8
    },
    categoryCardText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center'
    },
    // New Styles
    followCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10
    },
    divider: { height: 1, width: '100%' },
    balanceCard: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 24,
        ...Shadows.xl,
    },
    faqItem: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12
    },
    methodScroll: {
        marginBottom: 20
    },
    helpCenterContact: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 12,
        marginTop: 30,
    },
    helpCenterContactText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    supportIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    supportTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    supportSubtitle: {
        fontSize: 14,
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    quickActionBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        flex: 1,
        minWidth: '47%',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    userInfoCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        marginTop: 10,
    },
    userInfoTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    userInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    supportHoursCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        marginTop: 10,
    },
    legalTabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    legalTab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    legalText: {
        fontSize: 14,
        lineHeight: 22,
    },
    privacySection: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    privacySectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    privacyIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    privacySectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    privacySectionDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    privacyDetails: {
        gap: 12,
    },
    privacyDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    privacyDetailText: {
        fontSize: 14,
        flex: 1,
    },
    privacyDetailTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    privacyDetailSubtext: {
        fontSize: 12,
        lineHeight: 16,
    },
    privacyActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 10,
    },
    privacyActionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    privacyActionDesc: {
        fontSize: 12,
    },
    privacyFooterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 12,
    },
    privacyFooterButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    privacyFooterNote: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 24,
    },

    // COUNTRY & PHONE STYLES
    countryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    countryFlag: {
        fontSize: 24,
        marginRight: 12,
    },
    countryName: {
        fontSize: 16,
        fontWeight: '500',
    },
    countryDial: {
        fontSize: 14,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 56,
        marginBottom: 10,
    },
    flagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
        marginRight: 8,
    },
    flagEmoji: {
        fontSize: 20,
        marginRight: 4,
    },
    dialCode: {
        fontSize: 16,
        marginRight: 8,
        fontWeight: '500',
    },
    phoneInput: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        height: '100%',
        fontSize: 16,
    },
    dateModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    dateModalCard: {
        borderRadius: 16,
        width: '100%',
        padding: 20,
    },
    datePickerClose: {
        marginTop: 16,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    datePickerCloseText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // NOTIFICATION SETTINGS STYLES
    notifSection: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        ...Shadows.lg,
    },
    notifSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifSectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 2,
    },
    notifSectionDesc: {
        fontSize: 13,
    },
    notifRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    notifLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    notifDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    notifToggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#cbd5e1',
        padding: 2,
        justifyContent: 'center',
    },
    notifToggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        ...Shadows.xl,
    },
    notifToggleKnobActive: {
        transform: [{ translateX: 20 }],
    },
    notifNote: {
        fontSize: 13,
        marginTop: 12,
        lineHeight: 18,
    },
    notifInfoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        gap: 12,
    },
    notifInfoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});

