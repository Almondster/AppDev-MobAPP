import { useTheme } from '@/context/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles/RegisterScreen.styles';

type Country = {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  placeholder: string;
  validationRegex: RegExp;
  validationError: string;
};

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

export default function RegisterScreen() {
  const router = useRouter();
  const { theme, isDark: _isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors for all fields
  const [firstNameError, setFirstNameError] = useState('');
  const [middleNameError, setMiddleNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [loading, setLoading] = useState(false);

  // Modal states for alerts
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showRegistrationErrorModal, setShowRegistrationErrorModal] = useState(false);
  const [incompleteModalMessage, setIncompleteModalMessage] = useState('');
  const [registrationErrorMessage, setRegistrationErrorMessage] = useState('');

  const lastNameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const [flexToggle, setFlexToggle] = useState(false);

  const birthDateLabel = birthDate
    ? birthDate.toLocaleDateString('en-GB')
    : 'DD/MM/YYYY';

  const handleBirthDateSelection = (_event: unknown, selected?: Date) => {
    if (selected) {
      setBirthDate(selected);
      setBirthDateError('');
    }
    if (Platform.OS === 'android') {
      return;
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: birthDate ?? new Date(2000, 0, 1),
        onChange: handleBirthDateSelection,
        mode: 'date',
        maximumDate: new Date(),
      });
    } else {
      setShowDateModal(true);
    }
  };

  // Helper function to calculate age
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Validation helper for names (only letters and spaces)
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name) && name.trim().length > 0; // Must have actual content, not just spaces
  };

  // Common weak passwords to block
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321'
  ];

  // Password strength validation
  const validatePasswordStrength = (pwd: string, userEmail?: string): string => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must include at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must include at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must include at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must include at least one special character (!@#$%^&*...)';

    // Check for common passwords
    const lowerPwd = pwd.toLowerCase();
    if (commonPasswords.some(common => lowerPwd.includes(common))) {
      return 'Password is too common. Please choose a stronger password';
    }

    // Check if password contains part of email
    if (userEmail) {
      const emailPart = userEmail.split('@')[0].toLowerCase();
      if (emailPart.length > 3 && lowerPwd.includes(emailPart)) {
        return 'Password should not contain your email address';
      }
    }

    // Check for repeated characters (e.g., "aaaa" or "1111")
    if (/(.)\1{3,}/.test(pwd)) {
      return 'Password contains too many repeated characters';
    }

    // Check for sequential characters (e.g., "1234" or "abcd")
    const hasSequential = /(?:abc|bcd|cde|def|123|234|345|456|567|678|789)/i.test(pwd);
    if (hasSequential) {
      return 'Password contains sequential characters. Please use a more random combination';
    }

    return '';
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // First Name validation
    if (!firstName.trim()) {
      setFirstNameError('First Name is required');
      isValid = false;
    } else if (!validateName(firstName)) {
      setFirstNameError('First Name can only contain letters and spaces');
      isValid = false;
    } else if (firstName.trim().length < 2) {
      setFirstNameError('First Name must be at least 2 characters');
      isValid = false;
    } else {
      setFirstNameError('');
    }

    // Middle Name validation (optional but must be valid if provided)
    if (middleName.trim() && !validateName(middleName)) {
      setMiddleNameError('Middle Name can only contain letters and spaces');
      isValid = false;
    } else {
      setMiddleNameError('');
    }

    // Last Name validation
    if (!lastName.trim()) {
      setLastNameError('Last Name is required');
      isValid = false;
    } else if (!validateName(lastName)) {
      setLastNameError('Last Name can only contain letters and spaces');
      isValid = false;
    } else if (lastName.trim().length < 2) {
      setLastNameError('Last Name must be at least 2 characters');
      isValid = false;
    } else {
      setLastNameError('');
    }

    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else {
      const regex = /\S+@\S+\.\S+/;
      if (!regex.test(email.trim())) {
        setEmailError('Enter a valid email address');
        isValid = false;
      } else {
        setEmailError('');
      }
    }

    // Birth Date validation
    if (!birthDate) {
      setBirthDateError('Date of Birth is required');
      isValid = false;
    } else {
      const age = parseInt(calculateAge(birthDate));
      if (age < 13) {
        setBirthDateError('You must be at least 13 years old to register');
        isValid = false;
      } else if (age > 120) {
        setBirthDateError('Please enter a valid birth date');
        isValid = false;
      } else {
        setBirthDateError('');
      }
    }

    // Phone validation
    if (!phoneNumber.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else {
      // Remove spaces, dashes, parentheses to get just digits
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

      // Check against the selected country's specific regex
      if (!selectedCountry.validationRegex.test(cleanNumber)) {
        setPhoneError(selectedCountry.validationError);
        isValid = false;
      } else {
        setPhoneError('');
      }
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      const strengthError = validatePasswordStrength(password, email);
      if (strengthError) {
        setPasswordError(strengthError);
        isValid = false;
      } else {
        setPasswordError('');
      }
    }

    // Confirm Password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

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

  const handleSignUp = async () => {
    if (!validateForm()) {
      setIncompleteModalMessage('Please check the form for errors.');
      setShowIncompleteModal(true);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Verification Sent',
        `We've sent a verification link to ${email}. Please check your inbox or spam folder and verify your account before logging in.`,
        [
          {
            text: 'Ok',
            onPress: () => router.replace('/login')
          }
        ]
      );
    }, 1500);
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <Pressable
      style={[styles.countryRow, { borderBottomColor: theme.cardBorder, borderBottomWidth: 1 }]}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryModal(false);
        setPhoneError('');
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
    subText: { color: theme.textSecondary },
    card: { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
    input: {
      backgroundColor: theme.inputBackground,
      borderColor: theme.inputBorder,
      color: theme.text
    },
    modal: { backgroundColor: theme.card },
    placeholder: theme.textSecondary,
  };

  const ModalAlert = ({
    visible,
    onClose,
    title,
    message,
    type = 'info'
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'error';
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalAlertCard, { backgroundColor: theme.card }]}>
          <View style={[
            styles.modalIconContainer,
            { backgroundColor: type === 'error' ? theme.danger + '20' : theme.tint + '20' }
          ]}>
            <Ionicons
              name={type === 'error' ? 'warning-outline' : 'information-circle-outline'}
              size={32}
              color={type === 'error' ? theme.danger : theme.tint}
            />
          </View>

          <Text style={[styles.modalAlertTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.modalAlertMessage, { color: theme.textSecondary }]}>{message}</Text>

          <Pressable
            style={[
              styles.modalAlertButton,
              { backgroundColor: type === 'error' ? theme.danger : theme.tint }
            ]}
            onPress={onClose}
          >
            <Text style={styles.modalAlertButtonText}>Okay</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <View style={[styles.safe, themeStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={
          flexToggle
            ? [{ flexGrow: 1 }, themeStyles.container]
            : [{ flex: 1 }, themeStyles.container]
        }
        enabled={!flexToggle}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 0 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
            <Text style={[styles.logo, { color: theme.text }]}>
              CREA<Text style={styles.logoAccent}>TECH</Text>
            </Text>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Register</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Already have an account?{' '}
              <Text style={styles.inlineLink} onPress={() => router.replace('/login')}>
                Log In
              </Text>
            </Text>
          </View>

          <View style={[styles.card, themeStyles.card]}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, themeStyles.text]}>First Name</Text>
                <TextInput
                  placeholder="Example"
                  placeholderTextColor={themeStyles.placeholder}
                  value={firstName}
                  onChangeText={(text) => {
                    // Only allow letters and spaces, but prevent leading spaces
                    let filtered = text.replace(/[^a-zA-Z\s]/g, '');
                    // Prevent leading spaces
                    if (filtered.startsWith(' ')) {
                      filtered = filtered.trimStart();
                    }
                    setFirstName(filtered);
                    if (filtered.trim()) {
                      if (!validateName(filtered)) {
                        setFirstNameError('Only letters and spaces allowed');
                      } else if (filtered.trim().length < 2) {
                        setFirstNameError('Must be at least 2 characters');
                      } else {
                        setFirstNameError('');
                      }
                    }
                  }}
                  style={[
                    styles.input,
                    themeStyles.input,
                    firstNameError ? styles.inputError : {}
                  ]}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameInputRef.current?.focus()}
                  editable={!loading}
                />
                {!!firstNameError && <Text style={styles.errorText}>{firstNameError}</Text>}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.label, themeStyles.text]}>Last Name</Text>
                <TextInput
                  ref={lastNameInputRef}
                  placeholder="Name"
                  placeholderTextColor={themeStyles.placeholder}
                  value={lastName}
                  onChangeText={(text) => {
                    // Only allow letters and spaces, but prevent leading spaces
                    let filtered = text.replace(/[^a-zA-Z\s]/g, '');
                    // Prevent leading spaces
                    if (filtered.startsWith(' ')) {
                      filtered = filtered.trimStart();
                    }
                    setLastName(filtered);
                    if (filtered.trim()) {
                      if (!validateName(filtered)) {
                        setLastNameError('Only letters and spaces allowed');
                      } else if (filtered.trim().length < 2) {
                        setLastNameError('Must be at least 2 characters');
                      } else {
                        setLastNameError('');
                      }
                    }
                  }}
                  style={[
                    styles.input,
                    themeStyles.input,
                    lastNameError ? styles.inputError : {}
                  ]}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => setEmail('')}
                  editable={!loading}
                />
                {!!lastNameError && <Text style={styles.errorText}>{lastNameError}</Text>}
              </View>
            </View>

            {/* Middle Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, themeStyles.text]}>Middle Name (Optional)</Text>
              <TextInput
                placeholder="Middle Name"
                placeholderTextColor={themeStyles.placeholder}
                value={middleName}
                onChangeText={(text) => {
                  // Only allow letters and spaces, but prevent leading spaces
                  let filtered = text.replace(/[^a-zA-Z\s]/g, '');
                  // Prevent leading spaces
                  if (filtered.startsWith(' ')) {
                    filtered = filtered.trimStart();
                  }
                  setMiddleName(filtered);
                  if (filtered.trim() && !validateName(filtered)) {
                    setMiddleNameError('Only letters and spaces allowed');
                  } else {
                    setMiddleNameError('');
                  }
                }}
                style={[
                  styles.input,
                  themeStyles.input,
                  middleNameError ? styles.inputError : {}
                ]}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => setEmail('')}
                editable={!loading}
              />
              {!!middleNameError && <Text style={styles.errorText}>{middleNameError}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, themeStyles.text]}>Email</Text>
              <TextInput
                placeholder="example@gmail.com"
                placeholderTextColor={themeStyles.placeholder}
                value={email}
                onChangeText={(text) => {
                  // Prevent leading spaces
                  let filtered = text;
                  if (filtered.startsWith(' ')) {
                    filtered = filtered.trimStart();
                  }
                  setEmail(filtered);
                  if (filtered.trim()) {
                    const emailRegex = /\S+@\S+\.\S+/;
                    if (!emailRegex.test(filtered.trim())) {
                      setEmailError('Please enter a valid email address');
                    } else {
                      setEmailError('');
                    }
                  }
                }}
                style={[
                  styles.input,
                  themeStyles.input,
                  emailError ? styles.inputError : {}
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => phoneInputRef.current?.focus()}
                editable={!loading}
              />
              {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, themeStyles.text]}>Date of Birth</Text>
              <Pressable
                style={[
                  styles.input,
                  themeStyles.input,
                  styles.pickerInput,
                  birthDateError ? styles.inputError : {}
                ]}
                onPress={openDatePicker}
                disabled={loading}
              >
                <Text style={[styles.birthDateText, { color: birthDate ? theme.text : theme.textSecondary }]}>
                  {birthDateLabel}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={theme.text} />
              </Pressable>
              {!!birthDateError && <Text style={styles.errorText}>{birthDateError}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, themeStyles.text]}>Phone Number</Text>
              <View style={[
                styles.phoneRow,
                themeStyles.input,
                phoneError ? styles.inputError : {}
              ]}>
                <Pressable
                  style={[styles.flagButton, { backgroundColor: theme.background }]}
                  onPress={() => setShowCountryModal(true)}
                  disabled={loading}
                >
                  <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                  <Feather name="chevron-down" size={16} color={theme.text} />
                </Pressable>
                <Text style={[styles.dialCode, { color: theme.text }]}>({selectedCountry.dialCode})</Text>
                <TextInput
                  ref={phoneInputRef}
                  style={[styles.phoneInput, { color: theme.text }]}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    // Only allow digits and limit based on country
                    const digitsOnly = text.replace(/[^0-9]/g, '');

                    // Limit max length based on country (PH: 11, US/CA: 10, UK: 11, AU: 10)
                    const maxLength = selectedCountry.code === 'PH' || selectedCountry.code === 'GB' ? 11 : 10;
                    const limited = digitsOnly.slice(0, maxLength);

                    setPhoneNumber(limited);

                    // Real-time validation
                    if (limited.trim()) {
                      if (!selectedCountry.validationRegex.test(limited)) {
                        setPhoneError(selectedCountry.validationError);
                      } else {
                        setPhoneError('');
                      }
                    }
                  }}
                  placeholder={selectedCountry.placeholder}
                  placeholderTextColor={themeStyles.placeholder}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  editable={!loading}
                />
              </View>
              {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, themeStyles.text]}>Set Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  ref={passwordInputRef}
                  placeholder="********"
                  placeholderTextColor={themeStyles.placeholder}
                  value={password}
                  onChangeText={(text) => {
                    // Prevent leading spaces
                    let filtered = text;
                    if (filtered.startsWith(' ')) {
                      filtered = filtered.trimStart();
                    }
                    setPassword(filtered);
                    if (filtered) {
                      const strengthError = validatePasswordStrength(filtered, email);
                      if (strengthError) {
                        setPasswordError(strengthError);
                      } else {
                        setPasswordError('');
                      }

                      // Also check confirm password match if it's filled
                      if (confirmPassword && filtered !== confirmPassword) {
                        setConfirmPasswordError('Passwords do not match');
                      } else if (confirmPassword) {
                        setConfirmPasswordError('');
                      }
                    }
                  }}
                  secureTextEntry={!showPassword}
                  style={[
                    styles.input,
                    themeStyles.input,
                    styles.passwordInput,
                    passwordError ? styles.inputError : {}
                  ]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  editable={!loading}
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                >
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.text} />
                </Pressable>
              </View>
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, themeStyles.text]}>Confirm Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  ref={confirmPasswordInputRef}
                  placeholder="********"
                  placeholderTextColor={themeStyles.placeholder}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    // Prevent leading spaces
                    let filtered = text;
                    if (filtered.startsWith(' ')) {
                      filtered = filtered.trimStart();
                    }
                    setConfirmPassword(filtered);
                    if (filtered) {
                      if (password !== filtered) {
                        setConfirmPasswordError('Passwords do not match');
                      } else {
                        setConfirmPasswordError('');
                      }
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  style={[
                    styles.input,
                    themeStyles.input,
                    styles.passwordInput,
                    confirmPasswordError ? styles.inputError : {}
                  ]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  editable={!loading}
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={loading}
                >
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={theme.text} />
                </Pressable>
              </View>
              {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}
            </View>

            <Pressable
              onPress={handleSignUp}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.tint, opacity: pressed || loading ? 0.8 : 1 }
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* COUNTRY MODAL */}
      <Modal visible={showCountryModal} animationType="slide" onRequestClose={() => setShowCountryModal(false)}>
        <View style={[styles.modalContainer, themeStyles.container, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
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
              value={birthDate ?? new Date(2000, 0, 1)}
              mode="date"
              display="spinner"
              onChange={handleBirthDateSelection}
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

      {/* MODERN MODAL ALERTS */}
      <ModalAlert
        visible={showIncompleteModal}
        onClose={() => setShowIncompleteModal(false)}
        title="Incomplete Form"
        message={incompleteModalMessage}
        type="info"
      />

      <ModalAlert
        visible={showRegistrationErrorModal}
        onClose={() => setShowRegistrationErrorModal(false)}
        title="Registration Error"
        message={registrationErrorMessage}
        type="error"
      />
    </View>
  );
}


