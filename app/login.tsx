import { DPA_CONTENT, TERMS_CONTENT } from '@/constants/legal';
import { useTheme } from '@/context/ThemeContext';
import { Shadows } from '@/constants/theme';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import {
  auth,
  GithubAuthProvider,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut
} from '@/frontend/session';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const _router = useRouter();
  const { theme, isDark } = useTheme();
  const _insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      const credential =
        provider === 'google'
          ? GoogleAuthProvider.credential('mock-google-token')
          : GithubAuthProvider.credential('mock-github-token');

      await signInWithCredential(auth, credential);
    } catch (error: any) {
      showAlert('Sign In Error', error?.message || `Could not sign in with ${provider}.`, 'error');
      setLoading(false);
    }
  };

  // --- EMAIL LOGIN LOGIC ---
  const handleLogin = async () => {
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else {
      const regex = /\S+@\S+\.\S+/;
      if (!regex.test(email.trim())) {
        setEmailError('Enter a valid email');
        hasError = true;
      } else {
        setEmailError('');
      }
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) {
      showAlert('Incomplete Form', 'Please check the form for errors.', 'warning');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);

    } catch (error: any) {
      let errorMessage = 'Unable to sign in securely. Please try again.';
      if (error.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password.';
      else if (error.code === 'auth/user-not-found') errorMessage = 'No account found with this email.';
      else if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password.';
      showAlert('Error', errorMessage, 'error');
      setLoading(false);
    }
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
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showAlert(
        'Check Your Email',
        `We sent a password reset link to ${resetEmail}. Please check your inbox and spam folder.`,
        'success'
      );
      setForgotModalVisible(false);
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
      if (error.code === 'auth/invalid-email') msg = "That email address is invalid.";
      showAlert('Error', msg, 'error');
    } finally {
      setResetLoading(false);
    }
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={[styles.hero, themeStyles.container]}>
            <Image 
              source={isDark ? require('../assets/images/splash-icon-light.png') : require('../assets/images/splash-icon-dark.png')} 
              style={{ width: '100%', height: 140, resizeMode: 'contain', marginTop: -30, marginBottom: -10 }} 
            />
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
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.tint, opacity: pressed || loading ? 0.8 : 1 }
              ]}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Log In</Text>
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
                onPress={() => handleSocialLogin('google')}
                disabled={loading}>
                <AntDesign name="google" size={18} color="#EA4335" />
                <Text style={[styles.socialLabel, themeStyles.text]}>Google</Text>
              </Pressable>

              <Pressable
                style={[styles.socialButton, themeStyles.socialButton]}
                onPress={() => handleSocialLogin('github')}
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 60,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 40,
  },
  logoAccent: {
    color: '#2563EB',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  inlineLink: {
    color: '#387BFF',
    fontWeight: '500',
  },
  card: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
  },
  errorText: {
    color: '#DC2626',
    marginTop: 6,
    fontSize: 12,
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 24,
  },
  linkText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    flex: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginHorizontal: 4,
  },
  socialLabel: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },

  // MODAL STYLES
  modalContainer: { flex: 1, paddingTop: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeText: { color: '#387BFF', fontSize: 16, fontWeight: '600' },
  modalScroll: { padding: 20 },
  legalText: { fontSize: 14, lineHeight: 22 },

  // FORGOT PASSWORD MODAL
  forgotBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  forgotCard: {
    borderRadius: 24,
    padding: 24,
  },
  forgotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  forgotTitle: { fontSize: 20, fontWeight: '700' },
  forgotDesc: { fontSize: 14, marginBottom: 20, lineHeight: 20 },

  // MODERN MODAL ALERT STYLES 
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalAlertCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Shadows.xl,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAlertTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalAlertMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalAlertButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalAlertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

