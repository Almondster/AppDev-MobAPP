import { DPA_CONTENT, TERMS_CONTENT } from '@/constants/legal';
import { useTheme } from '@/context/ThemeContext';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { styles } from '../styles/LoginScreen.styles';

export default function LoginScreen() {
  const _router = useRouter();
  const { theme, isDark: _isDark, mode, setMode } = useTheme();
  const _insets = useSafeAreaInsets();

  const toggleDarkMode = () => {
    const newMode = _isDark ? 'light' : 'dark';
    setMode(newMode as 'light' | 'dark' | 'system');
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [lastUsedCode, setLastUsedCode] = useState<string | null>(null);

  // MODAL STATES
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoContent, setInfoContent] = useState<'terms' | 'dpa'>('terms');

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // ALERT MODAL STATES
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');

  // --- HELPER: SHOW ALERT MODAL ---
  const showAlert = (title: string, message: string, type: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertModalVisible(true);
  };

  const handleLoginAsClient = async () => {
    let hasError = false;

    if (!email.trim() || !password) {
      if (!email.trim()) setEmailError('Email is required');
      if (!password) setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) {
      showAlert('Incomplete Form', 'Please enter some mock credentials.', 'warning');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      _router.replace('/(tabs)' as never);
    }, 1000);
  };

  const handleLoginAsCreator = async () => {
    let hasError = false;

    if (!email.trim() || !password) {
      if (!email.trim()) setEmailError('Email is required');
      if (!password) setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) {
      showAlert('Incomplete Form', 'Please enter some mock credentials.', 'warning');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      _router.replace('/creator' as never);
    }, 1000);
  };

  // --- ACTIONS ---
  const openInfoModal = (type: 'terms' | 'dpa') => {
    setInfoContent(type);
    setInfoModalVisible(true);
  };

  const handleForgotPress = () => {
    setResetEmail(email);
    setForgotModalVisible(true);
  };

  const performPasswordReset = async () => {
    if (!resetEmail.trim()) {
      showAlert('Required', 'Please enter your email address.', 'warning');
      return;
    }
    setResetLoading(true);
    setTimeout(() => {
      showAlert(
        'Check Your Email',
        `We sent a password reset link to ${resetEmail}. Please check your inbox and spam folder.`,
        'success'
      );
      setForgotModalVisible(false);
      setResetLoading(false);
    }, 1200);
  };

  // MODERN MODAL ALERT COMPONENT
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
    divider: { backgroundColor: theme.cardBorder },
    socialButton: { borderColor: theme.cardBorder, backgroundColor: theme.card },
    modalBg: { backgroundColor: theme.card },
  };

  return (
    <View style={[styles.safe, themeStyles.container]}>
      <View style={[styles.themeToggleContainer, { paddingTop: _insets.top }]}>
        <Pressable onPress={toggleDarkMode} style={styles.themeToggleButton}>
          <Ionicons
            name={_isDark ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={theme.text}
          />
        </Pressable>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={[styles.hero, themeStyles.container]}>
            <Text style={[styles.logo, { color: theme.text }]}>
              CREA<Text style={styles.logoAccent}>TECH</Text>
            </Text>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Sign in to your Account</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
              <Link href="/register" style={styles.inlineLink}>
                Sign Up
              </Link>
            </Text>
          </View>

          <View style={[styles.card, themeStyles.card]}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, themeStyles.text]}>Email</Text>
              <TextInput
                placeholder="example@gmail.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, themeStyles.input]}
                returnKeyType="next"
              />
              {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, themeStyles.text]}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="********"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                  style={[styles.input, themeStyles.input, styles.passwordInput]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={() => setPasswordVisible((prev) => !prev)}
                  style={styles.passwordToggle}>
                  <Ionicons
                    name={passwordVisible ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.icon}
                  />
                </Pressable>
              </View>
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            </View>

            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }} />
              <Pressable onPress={handleForgotPress}>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleLoginAsClient}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.tint, opacity: pressed || loading ? 0.8 : 1, marginBottom: 12 }
              ]}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Log In as Client</Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleLoginAsCreator}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.tint, opacity: pressed || loading ? 0.8 : 1 }
              ]}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Log In as Creator</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, themeStyles.divider]} />
              <Text style={[styles.dividerText, themeStyles.subText]}>Or login with</Text>
              <View style={[styles.divider, themeStyles.divider]} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                style={[styles.socialButton, themeStyles.socialButton]}
                onPress={() => showAlert('Notice', 'Social login is mocked out in this preview.', 'info')}
                disabled={loading}>
                <AntDesign name="google" size={18} color="#EA4335" />
                <Text style={[styles.socialLabel, themeStyles.text]}>Google</Text>
              </Pressable>

              <Pressable
                style={[styles.socialButton, themeStyles.socialButton]}
                onPress={() => showAlert('Notice', 'Social login is mocked out in this preview.', 'info')}
                disabled={loading}>
                <AntDesign name="github" size={18} color={theme.text} />
                <Text style={[styles.socialLabel, themeStyles.text]}>GitHub</Text>
              </Pressable>
            </View>

            <Text style={[styles.termsText, { color: theme.textSecondary }]}>
              By signing up, you agree to the <Text style={styles.inlineLink} onPress={() => openInfoModal('terms')}>Terms of Service</Text> and{' '}
              <Text style={styles.inlineLink} onPress={() => openInfoModal('dpa')}>Data Processing Agreement</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* TERMS MODAL */}
      <Modal visible={infoModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setInfoModalVisible(false)}>
        <View style={[styles.modalContainer, themeStyles.modalBg]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, themeStyles.text]}>
              {infoContent === 'terms' ? 'Terms of Service' : 'Data Processing Agreement'}
            </Text>
            <Pressable onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={[styles.legalText, themeStyles.text]}>
              {infoContent === 'terms' ? TERMS_CONTENT : DPA_CONTENT}
            </Text>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* FORGOT PASSWORD MODAL */}
      <Modal visible={forgotModalVisible} transparent animationType="fade" onRequestClose={() => setForgotModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.forgotBackdrop}>
          <View style={[styles.forgotCard, themeStyles.card]}>
            <View style={styles.forgotHeader}>
              <Text style={[styles.forgotTitle, themeStyles.text]}>Reset Password</Text>
              <Pressable onPress={() => setForgotModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.forgotDesc, themeStyles.subText]}>
              Enter your email address and we will send you a link to reset your password.
            </Text>

            <TextInput
              style={[styles.input, themeStyles.input, { marginBottom: 20 }]}
              placeholder="Enter your email"
              placeholderTextColor={theme.textSecondary}
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Pressable
              style={[styles.primaryButton, { backgroundColor: theme.tint, marginBottom: 0 }]}
              onPress={performPasswordReset}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Reset Link</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* NEW MODERN ALERT MODAL */}
      <ModalAlert
        visible={alertModalVisible}
        onClose={() => setAlertModalVisible(false)}
        title={alertTitle}
        message={alertMessage}
        type={alertType === 'error' ? 'error' : 'info'}
      />

    </View>
  );
}
