import { CREATOR_TERMS_OF_SERVICE, getFormattedToS } from '@/constants/creatorTermsOfService';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { Feather, Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
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

const { width } = Dimensions.get('window');

// SMART MATCH DATA CONSTANTS
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

type Category = {
  id: number;
  label: string;
  icon: string;
};

// COUNTRY CONSTANTS 
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

// Validation helper for names (only letters and spaces)
const _validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(name) && name.trim().length > 0;
};

// --- MODERN ALERT TYPES ---
type AlertType = 'success' | 'error' | 'warning' | 'info';
type AlertAction = { text: string; onPress?: () => void; style?: 'cancel' | 'default' };

export default function BecomeCreatorScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const { theme, isDark: _isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // WIZARD STATE
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // FORM STATE
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [_address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [_idImage, _setIdImage] = useState<string | null>(null);
  const [_idBase64, _setIdBase64] = useState<string | null>(null);

  // THREE ID PHOTOS
  const [idFrontImage, setIdFrontImage] = useState<string | null>(null);
  const [idFrontBase64, setIdFrontBase64] = useState<string | null>(null);
  const [idBackImage, setIdBackImage] = useState<string | null>(null);
  const [idBackBase64, setIdBackBase64] = useState<string | null>(null);
  const [idSelfieImage, setIdSelfieImage] = useState<string | null>(null);
  const [idSelfieBase64, setIdSelfieBase64] = useState<string | null>(null);

  // STRUCTURED ADDRESS FIELDS
  const [streetAddress, setStreetAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Philippines');

  // ADDED: Country State
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // CUSTOM SKILLS
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [showCustomSkillModal, setShowCustomSkillModal] = useState(false);

  const [experience, setExperience] = useState('');
  const [minRate, setMinRate] = useState('');
  const [turnaround, setTurnaround] = useState('');
  const [bio, setBio] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const [agreed, setAgreed] = useState(false);
  const [showFullToS, setShowFullToS] = useState(false);

  // DATA
  const [customServices, setCustomServices] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
    actions?: AlertAction[];
  }>({ type: 'info', title: '', message: '' });

  // Helper to trigger the beautiful modal
  const showAlert = (type: AlertType, title: string, message: string, actions?: AlertAction[]) => {
    setAlertConfig({ type, title, message, actions });
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
  };

  // Helper to scroll to top
  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // --- VALIDATORS ---

  // Validate Philippines ID (Strictly 12 digits, numeric)
  const isValidPhilippinesID = (id: string) => {
    const numericRegex = /^\d{12}$/;
    return numericRegex.test(id);
  };

  useEffect(() => {
    const init = async () => {
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('firebase_uid', user.uid).single();
        if (data) {
          if (data.first_name) {
            setFirstName(data.first_name);
            setMiddleName(data.middle_name || '');
            setLastName(data.last_name || '');
          } else if (data.full_name) {
            const parts = data.full_name.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
          }

          let existingPhone = data.phone || '';
          if (existingPhone.startsWith(selectedCountry.dialCode)) {
            existingPhone = existingPhone.substring(selectedCountry.dialCode.length);
          }
          setPhone(existingPhone);

          // Load structured address fields
          setStreetAddress(data.street_address || '');
          setBarangay(data.barangay || '');
          setCity(data.city || '');
          setProvince(data.province || '');
          setPostalCode(data.postal_code || '');
          setCountry(data.country || 'Philippines');

          setAddress(data.address || '');
          setIdNumber(data.id_number || '');
        }
      }
      const { data: services } = await supabase
        .from('services')
        .select('id, label, icon')
        .or('is_deleted.is.null,is_deleted.eq.false');
      if (services) {
        const unique = services.filter((v, i, a) => a.findIndex(t => (t.label === v.label)) === i);
        setCustomServices(unique);
      }
    };
    init();
  }, [user, selectedCountry.dialCode]);

  const pickIdImage = async (type: 'front' | 'back' | 'selfie') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Validate file type
      if (asset.uri && !asset.uri.match(/\.(jpg|jpeg|png)$/i)) {
        Alert.alert('Invalid File', 'ID/Selfie images must be JPG or PNG format.');
        return;
      }

      // Validate file size (max 5MB)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Image must be smaller than 5MB.');
        return;
      }

      // Validate dimensions for verification readability
      if (asset.width && asset.height) {
        if (asset.width < 400 || asset.height < 300) {
          Alert.alert('Image Too Small', 'Image must be at least 400x300 pixels for verification.');
          return;
        }
        if (asset.width > 4096 || asset.height > 4096) {
          Alert.alert('Image Too Large', 'Image must be less than 4096x4096 pixels.');
          return;
        }
      }

      if (!asset.base64) {
        Alert.alert('Error', 'Failed to process image.');
        return;
      }

      const uri = asset.uri;
      const base64 = asset.base64;

      if (type === 'front') {
        setIdFrontImage(uri);
        setIdFrontBase64(base64);
      } else if (type === 'back') {
        setIdBackImage(uri);
        setIdBackBase64(base64);
      } else {
        setIdSelfieImage(uri);
        setIdSelfieBase64(base64);
      }
    }
  };

  // Add and remove custom skills
  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !customSkills.includes(trimmed) && !selectedSkills.includes(trimmed)) {
      setCustomSkills([...customSkills, trimmed]);
      setSelectedSkills([...selectedSkills, trimmed]);
      setCustomSkillInput('');
      setShowCustomSkillModal(false);
    }
  };

  const removeCustomSkill = (skill: string) => {
    setCustomSkills(customSkills.filter(s => s !== skill));
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      // 1. Basic Empty Checks
      if (!firstName.trim() || !lastName.trim() || !phone.trim() || !idNumber.trim()) {
        showAlert('warning', 'Missing Details', 'Please fill out all identity fields. First & Last Name are required.');
        return;
      }

      // 2. Structured Address Validation
      if (!streetAddress.trim() || !city.trim()) {
        showAlert('warning', 'Address Required', 'Please provide at least Street Address and City.');
        return;
      }

      // 3. ID Validation
      if (!isValidPhilippinesID(idNumber)) {
        showAlert('warning', 'Invalid ID Number', 'Please enter a valid 12-digit Government ID number (Numeric only).');
        return;
      }

      // 4. Phone Validation (Strict Regex Check)
      const cleanPhone = phone.replace(/[^0-9]/g, '');

      if (!selectedCountry.validationRegex.test(cleanPhone)) {
        showAlert('warning', 'Invalid Phone Number', selectedCountry.validationError);
        return;
      }

      setPhone(cleanPhone);

      setStep(2);
      scrollToTop();

    } else if (step === 2) {
      if (selectedSkills.length === 0 || !bio.trim() || !experience.trim() || !minRate.trim() || !turnaround.trim()) {
        showAlert('warning', 'Incomplete Profile', 'Please fill in all profile fields: Experience, Rate, Turnaround, Bio & Skills.');
        return;
      }
      if (!selectedCategory && selectedSkills.length > 0) {
        showAlert('warning', 'Category Missing', 'Please select a main service category.');
        return;
      }
      setStep(3);
      scrollToTop();
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    scrollToTop();
  }

  const handleSubmit = async () => {
    if (!user) return;
    if (!agreed) {
      showAlert('warning', 'Agreement Needed', 'You must agree to the terms to continue.');
      return;
    }

    setLoading(true);
    try {
      const uploadVerificationImage = async (suffix: string, base64: string | null) => {
        if (!base64) return null;

        try {
          const fileName = `${user.uid}/${suffix}_${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('id-verification')
            .upload(fileName, decode(base64), { contentType: 'image/jpeg', upsert: false });

          if (uploadError) {
            console.warn(`Skipping ${suffix} upload:`, uploadError.message);
            return null;
          }

          const { data: urlData } = supabase.storage.from('id-verification').getPublicUrl(fileName);
          return urlData.publicUrl;
        } catch (uploadErr: any) {
          console.warn(`Skipping ${suffix} upload:`, uploadErr?.message || uploadErr);
          return null;
        }
      };

      const [idFrontUrl, idBackUrl, idSelfieUrl] = await Promise.all([
        uploadVerificationImage('id_front', idFrontBase64),
        uploadVerificationImage('id_back', idBackBase64),
        uploadVerificationImage('id_selfie', idSelfieBase64),
      ]);

      const fullName = `${firstName.trim()} ${middleName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ').trim();
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const fullPhone = `${selectedCountry.dialCode}${cleanPhone}`;

      // Update users table with structured address and 3 ID URLs
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          full_name: fullName,
          phone: fullPhone,
          street_address: streetAddress,
          barangay: barangay || null,
          city: city,
          province: province || null,
          postal_code: postalCode || null,
          country: country,
          id_number: idNumber,
          id_front_url: idFrontUrl,
          id_back_url: idBackUrl,
          id_selfie_url: idSelfieUrl,
          role: 'creator'
        })
        .eq('firebase_uid', user.uid);

      if (userError) throw new Error(`Failed to update user profile: ${userError.message}`);

      // Create creators profile with custom skills
      const { error: creatorError } = await supabase
        .from('creators')
        .insert({
          user_id: user.uid,
          bio: bio,
          skills: selectedSkills,
          custom_skills: customSkills,
          portfolio_url: portfolio,
          experience_years: experience,
          starting_price: minRate,
          turnaround_time: turnaround
        });

      if (creatorError) throw new Error(`Failed to create creator profile: ${creatorError.message}`);

      showAlert(
        'success',
        "Welcome, Creator!",
        "Your creator profile has been created successfully!",
        [
          { text: "Go to Dashboard", onPress: () => router.replace('/(tabs)/profile') }
        ]
      );
    } catch (err: any) {
      console.error('Full submission error:', err);
      showAlert('error', "Submission Error", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

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

  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    input: { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder, borderWidth: 1 },
    chip: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    modal: { backgroundColor: theme.background },
    header: { backgroundColor: theme.card },
    placeholderBox: { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
    categoryCard: { backgroundColor: theme.card, borderColor: theme.cardBorder },
  };

  const renderStep1 = () => (
    <View>
      <View style={styles.trustBanner}>
        <Ionicons name="shield-checkmark" size={24} color="#10b981" />
        <Text style={styles.trustText}>
          To ensure trust and safety on Createch, we collect your personal information. ID photos are optional for now and will only be used once verification storage is fully wired up.
        </Text>
      </View>

      <Text style={[styles.inputLabel, themeStyles.text]}>First Name</Text>
      <TextInput
        style={[styles.input, themeStyles.input]}
        placeholder="Given Name"
        placeholderTextColor={theme.textSecondary}
        value={firstName}
        onChangeText={(text) => {
          // Only allow letters and spaces, but prevent leading spaces
          let filtered = text.replace(/[^a-zA-Z\s]/g, '');
          if (filtered.startsWith(' ')) {
            filtered = filtered.trimStart();
          }
          setFirstName(filtered);
        }}
      />

      <Text style={[styles.inputLabel, themeStyles.text]}>Middle Name (Optional)</Text>
      <TextInput
        style={[styles.input, themeStyles.input]}
        placeholder="Middle Name"
        placeholderTextColor={theme.textSecondary}
        value={middleName}
        onChangeText={(text) => {
          // Only allow letters and spaces, but prevent leading spaces
          let filtered = text.replace(/[^a-zA-Z\s]/g, '');
          if (filtered.startsWith(' ')) {
            filtered = filtered.trimStart();
          }
          setMiddleName(filtered);
        }}
      />

      <Text style={[styles.inputLabel, themeStyles.text]}>Last Name</Text>
      <TextInput
        style={[styles.input, themeStyles.input]}
        placeholder="Surname"
        placeholderTextColor={theme.textSecondary}
        value={lastName}
        onChangeText={(text) => {
          // Only allow letters and spaces, but prevent leading spaces
          let filtered = text.replace(/[^a-zA-Z\s]/g, '');
          if (filtered.startsWith(' ')) {
            filtered = filtered.trimStart();
          }
          setLastName(filtered);
        }}
      />

      <Text style={[styles.inputLabel, themeStyles.text]}>Government ID Number (12 Digits) *</Text>
      <TextInput
        style={[styles.input, themeStyles.input]}
        placeholder="123456789012"
        placeholderTextColor={theme.textSecondary}
        value={idNumber}
        onChangeText={(text) => setIdNumber(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        maxLength={12}
      />

      {/* THREE ID PHOTOS */}
      <Text style={[styles.inputLabel, themeStyles.text]}>Front of ID (Optional)</Text>
      <Text style={[styles.uploadHint, themeStyles.textSecondary]}>Optional for now. Add a clear photo of the front side of your government-issued ID if you want to save it.</Text>
      <Pressable onPress={() => pickIdImage('front')} style={[styles.uploadBox, themeStyles.placeholderBox]}>
        {idFrontImage ? (
          <Image source={{ uri: idFrontImage }} style={styles.idPreview} resizeMode="cover" />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="camera-outline" size={28} color={theme.textSecondary} />
            <Text style={[styles.uploadText, themeStyles.textSecondary]}>Tap to upload</Text>
          </View>
        )}
      </Pressable>

      <Text style={[styles.inputLabel, themeStyles.text]}>Back of ID (Optional)</Text>
      <Text style={[styles.uploadHint, themeStyles.textSecondary]}>Optional for now. Add the back side of your ID if you want it stored.</Text>
      <Pressable onPress={() => pickIdImage('back')} style={[styles.uploadBox, themeStyles.placeholderBox]}>
        {idBackImage ? (
          <Image source={{ uri: idBackImage }} style={styles.idPreview} resizeMode="cover" />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="camera-outline" size={28} color={theme.textSecondary} />
            <Text style={[styles.uploadText, themeStyles.textSecondary]}>Tap to upload</Text>
          </View>
        )}
      </Pressable>

      <Text style={[styles.inputLabel, themeStyles.text]}>Selfie with ID (Optional)</Text>
      <Text style={[styles.uploadHint, themeStyles.textSecondary]}>Optional for now. You can skip this until creator verification is connected to a real backend flow.</Text>
      <Pressable onPress={() => pickIdImage('selfie')} style={[styles.uploadBox, themeStyles.placeholderBox]}>
        {idSelfieImage ? (
          <Image source={{ uri: idSelfieImage }} style={styles.idPreview} resizeMode="cover" />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="camera-outline" size={28} color={theme.textSecondary} />
            <Text style={[styles.uploadText, themeStyles.textSecondary]}>Tap to upload</Text>
          </View>
        )}
      </Pressable>

      {/* PHONE FIELD */}
      <Text style={[styles.inputLabel, themeStyles.text]}>Phone Number *</Text>
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
          value={phone}
          onChangeText={(text) => {
            const digitsOnly = text.replace(/[^0-9]/g, '');
            const maxLength = selectedCountry.code === 'PH' || selectedCountry.code === 'GB' ? 11 : 10;
            const limited = digitsOnly.slice(0, maxLength);
            setPhone(limited);
          }}
          keyboardType="phone-pad"
          placeholder={selectedCountry.placeholder}
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      {/* STRUCTURED ADDRESS FIELDS */}
      <Text style={[styles.sectionTitle, themeStyles.text]}>Residential Address</Text>

      <Text style={[styles.inputLabel, themeStyles.text]}>Street / Building / House No. *</Text>
      <TextInput
        style={[styles.input, themeStyles.input]}
        placeholder="e.g., 123 Main St, Building A"
        placeholderTextColor={theme.textSecondary}
        value={streetAddress}
        onChangeText={setStreetAddress}
      />

      <Text style={[styles.inputLabel, themeStyles.text]}>Barangay / District (Optional)</Text>
      <TextInput
        style={[styles.input, themeStyles.input]}
        placeholder="e.g., Barangay San Antonio"
        placeholderTextColor={theme.textSecondary}
        value={barangay}
        onChangeText={setBarangay}
      />

      <View style={styles.addressRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.inputLabel, themeStyles.text]}>City / Municipality *</Text>
          <TextInput
            style={[styles.input, themeStyles.input]}
            placeholder="e.g., Manila"
            placeholderTextColor={theme.textSecondary}
            value={city}
            onChangeText={setCity}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.inputLabel, themeStyles.text]}>Postal Code</Text>
          <TextInput
            style={[styles.input, themeStyles.input]}
            placeholder="e.g., 1000"
            placeholderTextColor={theme.textSecondary}
            value={postalCode}
            onChangeText={(text) => setPostalCode(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>

      <Text style={[styles.inputLabel, themeStyles.text]}>Province / State (Optional)</Text>
      <TextInput
        style={[styles.input, themeStyles.input]}
        placeholder="e.g., Metro Manila"
        placeholderTextColor={theme.textSecondary}
        value={province}
        onChangeText={setProvince}
      />

      <Text style={[styles.inputLabel, themeStyles.text]}>Country</Text>
      <TextInput
        style={[styles.input, themeStyles.input]}
        placeholder="Philippines"
        placeholderTextColor={theme.textSecondary}
        value={country}
        onChangeText={setCountry}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={[styles.sectionTitle, themeStyles.text]}>Select Service Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {MAIN_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.label;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.label)}
              style={[
                styles.categoryCard,
                themeStyles.categoryCard,
                isSelected && { backgroundColor: theme.tint, borderColor: theme.tint }
              ]}
            >
              <Ionicons name={cat.icon as any} size={24} color={isSelected ? '#fff' : theme.text} />
              <Text style={[styles.categoryCardText, { color: isSelected ? '#fff' : theme.text }]}>{cat.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedCategory && (
        <>
          <Text style={[styles.sectionTitle, themeStyles.text]}>Skills for {selectedCategory}</Text>
          <View style={styles.chipsContainer}>
            {SUBCATEGORY_MAP[selectedCategory].map(skill => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <Pressable
                  key={skill}
                  style={[styles.chip, themeStyles.chip, isSelected && { backgroundColor: theme.tint, borderColor: theme.tint }]}
                  onPress={() => toggleSkill(skill)}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.text }]}>{skill}</Text>
                </Pressable>
              );
            })}

            {/* Show custom skills */}
            {customSkills.map(skill => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <Pressable
                  key={skill}
                  style={[styles.chip, themeStyles.chip, isSelected && { backgroundColor: theme.tint, borderColor: theme.tint }]}
                  onPress={() => toggleSkill(skill)}
                  onLongPress={() => removeCustomSkill(skill)}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.text }]}>{skill}</Text>
                  <Pressable onPress={() => removeCustomSkill(skill)} style={{ marginLeft: 4 }}>
                    <Ionicons name="close-circle" size={14} color={isSelected ? '#fff' : theme.textSecondary} />
                  </Pressable>
                </Pressable>
              );
            })}

            <Pressable style={[styles.chip, themeStyles.chip, { borderStyle: 'dashed' }]} onPress={() => setShowCustomSkillModal(true)}>
              <Ionicons name="add" size={16} color={theme.text} />
              <Text style={[styles.chipText, themeStyles.text]}>Add Custom Skill</Text>
            </Pressable>
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, themeStyles.text]}>Years of Experience</Text>
      <TextInput style={[styles.input, themeStyles.input]} placeholder="e.g. 5" placeholderTextColor={theme.textSecondary} value={experience} onChangeText={setExperience} keyboardType="numeric" />

      <Text style={[styles.sectionTitle, themeStyles.text]}>Minimum Starting Price (₱)</Text>
      <TextInput style={[styles.input, themeStyles.input]} placeholder="e.g. 500" placeholderTextColor={theme.textSecondary} value={minRate} onChangeText={setMinRate} keyboardType="numeric" />

      <Text style={[styles.sectionTitle, themeStyles.text]}>Typical Turnaround Time</Text>
      <TextInput style={[styles.input, themeStyles.input]} placeholder="e.g. 3-5 days, 1 week" placeholderTextColor={theme.textSecondary} value={turnaround} onChangeText={setTurnaround} />

      <Text style={[styles.sectionTitle, themeStyles.text]}>Bio</Text>
      <TextInput style={[styles.input, styles.textArea, themeStyles.input]} placeholder="Tell clients about your expertise..." placeholderTextColor={theme.textSecondary} multiline numberOfLines={4} value={bio} onChangeText={setBio} />

      <Text style={[styles.sectionTitle, themeStyles.text]}>Portfolio Link (Optional)</Text>
      <TextInput style={[styles.input, themeStyles.input]} placeholder="https://myportfolio.com" placeholderTextColor={theme.textSecondary} value={portfolio} onChangeText={setPortfolio} autoCapitalize="none" />
    </View>
  );

  const renderStep3 = () => (
    <View>
      <View style={[styles.agreementCard, themeStyles.card]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.agreementTitle, themeStyles.text]}>Terms of Service</Text>
          <Pressable
            onPress={() => setShowFullToS(true)}
            style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: theme.tint + '15', borderRadius: 8, marginBottom: 12 }}
          >
            <Text style={{ color: theme.tint, fontSize: 14, fontWeight: '600', }}>Read Full Terms</Text>
          </Pressable>
        </View>

        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={true}>
          <Text style={[styles.agreementText, themeStyles.textSecondary]}>
            {CREATOR_TERMS_OF_SERVICE.summary}
            {'\n\n'}
            <Text style={{ fontWeight: '700', color: theme.text }}>Key Highlights:</Text>
            {'\n'}
            {CREATOR_TERMS_OF_SERVICE.highlights.map((highlight, _index) => (
              `\n• ${highlight}`
            )).join('')}
            {'\n\n'}
            <Text style={{ fontStyle: 'italic', fontSize: 12 }}>
              Tap "Read Full Terms" above to view all {CREATOR_TERMS_OF_SERVICE.sections.length} sections including payment terms, deadline policies, refund procedures, and dispute resolution.
            </Text>
          </Text>
        </ScrollView>
      </View>

      <Pressable style={styles.checkboxRow} onPress={() => setAgreed(!agreed)}>
        <Ionicons name={agreed ? "checkbox" : "square-outline"} size={24} color={theme.tint} />
        <Text style={[styles.checkboxText, themeStyles.text]}>
          I have read, understood, and agree to the Creator Terms of Service. I verify that all information provided is accurate.
        </Text>
      </Pressable>
    </View>
  );

  const renderModernAlert = () => {
    const getIcon = () => {
      switch (alertConfig.type) {
        case 'success': return { name: 'checkmark-circle', color: '#10b981' }; // Green
        case 'error': return { name: 'alert-circle', color: '#ef4444' }; // Red
        case 'warning': return { name: 'warning', color: '#f59e0b' }; // Orange
        default: return { name: 'information-circle', color: theme.tint }; // Blue
      }
    };

    const iconData = getIcon();

    return (
      <Modal transparent visible={alertVisible} animationType="fade" onRequestClose={closeAlert}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.alertContainer, { backgroundColor: theme.card }]}>

            {/* ICON HEADER */}
            <View style={[styles.alertIconBubble, { backgroundColor: iconData.color + '20' }]}>
              <Ionicons name={iconData.name as any} size={32} color={iconData.color} />
            </View>

            {/* TEXT CONTENT */}
            <Text style={[styles.alertTitle, { color: theme.text }]}>{alertConfig.title}</Text>
            <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>{alertConfig.message}</Text>

            {/* ACTIONS */}
            <View style={styles.alertActions}>
              {alertConfig.actions ? (
                alertConfig.actions.map((action, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.alertButton,
                      {
                        backgroundColor: action.style === 'cancel' ? 'transparent' : theme.tint,
                        borderColor: action.style === 'cancel' ? theme.cardBorder : 'transparent',
                        borderWidth: action.style === 'cancel' ? 1 : 0
                      }
                    ]}
                    onPress={() => {
                      closeAlert();
                      if (action.onPress) action.onPress();
                    }}
                  >
                    <Text style={[
                      styles.alertButtonText,
                      { color: action.style === 'cancel' ? theme.text : '#fff' }
                    ]}>
                      {action.text}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Pressable style={[styles.alertButton, { backgroundColor: theme.tint }]} onPress={closeAlert}>
                  <Text style={[styles.alertButtonText, { color: '#fff' }]}>Okay</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={theme.text} />
          </Pressable>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && { backgroundColor: theme.tint }]} />
            <View style={[styles.stepLine, step >= 2 && { backgroundColor: theme.tint }]} />
            <View style={[styles.stepDot, step >= 2 && { backgroundColor: theme.tint }]} />
            <View style={[styles.stepLine, step >= 3 && { backgroundColor: theme.tint }]} />
            <View style={[styles.stepDot, step >= 3 && { backgroundColor: theme.tint }]} />
          </View>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, themeStyles.text]}>
            {step === 1 ? "Identity Verification" : step === 2 ? "Professional Profile" : "Review & Agree"}
          </Text>
          <Text style={[styles.subtitle, themeStyles.textSecondary]}>
            {step === 1 ? "Step 1 of 3" : step === 2 ? "Step 2 of 3" : "Step 3 of 3"}
          </Text>
        </View>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={styles.footer}>
            {step > 1 && (
              <Pressable
                onPress={handleBack}
                style={[styles.navButton, styles.prevButton, { borderColor: theme.cardBorder }]}
              >
                <Text style={[styles.prevText, themeStyles.text]}>Back</Text>
              </Pressable>
            )}
            <Pressable
              onPress={step === 3 ? handleSubmit : handleNext}
              style={[styles.navButton, styles.nextButton, { backgroundColor: theme.tint, flex: step === 1 ? 1 : 0.6 }]}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>{step === 3 ? "Submit Application" : "Next Step"}</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderModernAlert()}

      {/* CUSTOM SKILL MODAL */}
      <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCategoryModal(false)}>
        <SafeAreaView style={[styles.modalContainer, themeStyles.modal]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Select Custom Skills</Text>
            <Pressable onPress={() => setShowCategoryModal(false)}>
              <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </Pressable>
          </View>
          <FlatList
            data={customServices}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => {
              const isSelected = selectedSkills.includes(item.label);
              return (
                <Pressable
                  style={[styles.categoryRow, { borderBottomColor: theme.cardBorder }, isSelected && { backgroundColor: theme.card }]}
                  onPress={() => toggleSkill(item.label)}
                >
                  <Text style={[styles.categoryText, themeStyles.text]}>{item.label}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={24} color={theme.tint} />}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* CUSTOM SKILL MODAL */}
      <Modal visible={showCustomSkillModal} animationType="slide" onRequestClose={() => {
        setShowCustomSkillModal(false);
        setCustomSkillInput('');
      }}>
        <SafeAreaView style={[styles.modalContainer, themeStyles.modal]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Add Custom Skill</Text>
            <Pressable onPress={() => {
              setShowCustomSkillModal(false);
              setCustomSkillInput('');
            }}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <View style={{ padding: 24 }}>
            <Text style={[styles.inputLabel, themeStyles.text]}>Custom Skill Name</Text>
            <TextInput
              style={[styles.input, themeStyles.input]}
              placeholder="e.g., 3D Modeling, Voice Acting"
              placeholderTextColor={theme.textSecondary}
              value={customSkillInput}
              onChangeText={setCustomSkillInput}
              autoFocus
            />
            <Text style={[styles.uploadHint, themeStyles.textSecondary, { marginBottom: 20 }]}>
              Add skills not listed in the predefined categories. These will be visible to clients and used by AI matching.
            </Text>
            <Pressable
              onPress={addCustomSkill}
              disabled={!customSkillInput.trim()}
              style={{
                backgroundColor: theme.tint,
                opacity: customSkillInput.trim() ? 1 : 0.5,
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                ...Shadows.lg,
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 17,
                fontWeight: '700',
                letterSpacing: 0.5
              }}>
                Add Skill
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* FULL ToS MODAL */}
      <Modal visible={showFullToS} animationType="slide" onRequestClose={() => setShowFullToS(false)}>
        <SafeAreaView style={[styles.modalContainer, themeStyles.modal]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, themeStyles.text]}>Creator Terms of Service</Text>
            <Pressable onPress={() => setShowFullToS(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <Text style={[styles.tosFullText, themeStyles.text]}>
              {getFormattedToS()}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* COUNTRY SELECTION MODAL */}
      <Modal visible={showCountryModal} animationType="slide" onRequestClose={() => setShowCountryModal(false)}>
        <View style={[styles.modalContainer, themeStyles.container]}>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, justifyContent: 'space-between' },
  backButton: { padding: 8 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    ...Shadows.md,
  },
  stepLine: { width: 30, height: 3, backgroundColor: '#e5e7eb', marginHorizontal: 6, borderRadius: 2 },
  headerTextContainer: { paddingHorizontal: 24, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  content: { padding: 24 },
  trustBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 18,
    borderRadius: 16,
    marginBottom: 28,
    alignItems: 'center',
    gap: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    ...Shadows.lg,
    shadowColor: '#10b981'
  },
  trustText: { flex: 1, fontSize: 13, color: '#059669', lineHeight: 20, fontWeight: '500' },
  inputLabel: { fontSize: 15, fontWeight: '600', marginBottom: 10, marginTop: 8, letterSpacing: 0.3 },
  input: {
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    marginBottom: 24,
    ...Shadows.md,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  uploadBox: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  uploadPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  uploadText: { marginTop: 10, fontSize: 14, fontWeight: '500', letterSpacing: 0.2 },
  uploadHint: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  idPreview: { width: '100%', height: '100%' },
  addressRow: { flexDirection: 'row', marginBottom: 0 },
  categoryScroll: { gap: 12, marginBottom: 20, paddingRight: 20 },
  categoryCard: {
    width: 150,
    height: 110,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    ...Shadows.lg,
  },
  categoryCardText: { fontSize: 13, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24, gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    ...Shadows.md,
  },
  chipText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
  agreementCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 28,
    ...Shadows.xl,
  },
  agreementTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, letterSpacing: 0.3 },
  agreementText: { fontSize: 14, lineHeight: 22 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 12 },
  checkboxText: { flex: 1, fontSize: 14, lineHeight: 20 },
  tosFullText: { fontSize: 14, lineHeight: 24, letterSpacing: 0.2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 16,
    letterSpacing: 0.4
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 48, gap: 14, marginBottom: 48 },
  navButton: {
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  prevButton: { flex: 0.4, borderWidth: 2 },
  prevText: { fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  nextButton: { flex: 0.6 },
  nextText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    ...Shadows.md,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.4 },
  modalActionButton: {
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xl,
    marginTop: 8
  },
  modalActionButtonText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  categoryText: { fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  alertContainer: {
    width: width * 0.85,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Shadows.xl,
  },
  alertIconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertActions: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
  },
  alertButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
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
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 24,
    ...Shadows.md,
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
});
