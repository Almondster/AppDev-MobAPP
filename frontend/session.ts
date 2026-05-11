import { clone, createLocalUserRecord, ensureUserRecord, findUserByEmail } from '@/frontend/seed';
import {
  loginAPI,
  registerAPI,
  clearToken,
  fetchMe,
  getStoredUser,
  setStoredUser as apiSetStoredUser,
  updateUser,
} from '@/frontend/api';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: Array<{ providerId: string }>;
  reload: () => Promise<void>;
  // Backend-specific fields
  role?: string;
  full_name?: string;
};

type AuthState = {
  currentUser: User | null;
};

type Credential = {
  providerId: string;
  token?: string;
  email?: string;
  password?: string;
};

const listeners = new Set<(user: User | null) => void>();
const ENABLE_LOCAL_FALLBACK = process.env.EXPO_PUBLIC_ENABLE_LOCAL_FALLBACK === 'true';
let authReady = false;
let restorePromise: Promise<void> | null = null;

const buildUser = (record: Record<string, any>, providerId = 'password'): User => ({
  uid: String(record.firebase_uid || record.id),
  email: record.email || null,
  displayName: record.full_name || record.username || record.first_name || null,
  photoURL: record.avatar_url || null,
  emailVerified: true,
  providerData: [{ providerId }],
  reload: async () => {},
  role: record.role,
  full_name: record.full_name || record.username,
});

const notify = () => {
  const user = auth.currentUser ? clone(auth.currentUser) : null;
  listeners.forEach((listener) => listener(user));
};

export const auth: AuthState = {
  currentUser: null,
};

export const session = auth;

const setCurrentUserFromRecord = (record: Record<string, any> | null, providerId = 'password') => {
  auth.currentUser = record ? buildUser(record, providerId) : null;
  notify();
};

const normalizeBackendUser = (record: Record<string, any>) => ({
  ...record,
  id: record.id ?? record.firebase_uid,
  firebase_uid: String(record.firebase_uid || record.id),
  full_name: record.full_name || record.username,
});

const restoreStoredSession = async () => {
  if (authReady) return;
  if (!restorePromise) {
    restorePromise = (async () => {
      const stored = await getStoredUser();
      if (!stored) {
        auth.currentUser = null;
        authReady = true;
        return;
      }

      try {
        const freshUser = normalizeBackendUser(await fetchMe());
        await apiSetStoredUser(freshUser);
        ensureUserRecord(freshUser);
        auth.currentUser = buildUser(freshUser);
      } catch {
        await clearToken();
        auth.currentUser = null;
      } finally {
        authReady = true;
      }
    })();
  }
  await restorePromise;
};

const syncRecordFromUser = (user: User) => {
  ensureUserRecord({
    firebase_uid: user.uid,
    full_name: user.displayName || user.email?.split('@')[0] || 'User',
    first_name: user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User',
    avatar_url: user.photoURL,
    email: user.email,
  });
};

export const getAuth = () => auth;

export const onAuthStateChanged = (authState: AuthState, callback: (user: User | null) => void) => {
  listeners.add(callback);
  restoreStoredSession().then(() => {
    callback(authState.currentUser ? clone(authState.currentUser) : null);
  });
  return () => {
    listeners.delete(callback);
  };
};

/**
 * Sign in via the Django backend API.
 * Falls back to local mock if the backend is unreachable.
 */
export const signInWithEmailAndPassword = async (_authState: AuthState, email: string, password: string) => {
  try {
    const data = await loginAPI(email.trim(), password);
    const record = {
      firebase_uid: data.firebase_uid,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      first_name: data.full_name?.split(' ')[0] || data.email.split('@')[0],
    };
    // Ensure local seed has this user for other components
    ensureUserRecord(record);
    setCurrentUserFromRecord(record, 'password');
    return { user: auth.currentUser as User };
  } catch (err: any) {
    if (!ENABLE_LOCAL_FALLBACK) {
      throw err;
    }
    // Fallback to local mock if backend unreachable
    console.warn('Backend login failed, falling back to local:', err.message);
    let record = findUserByEmail(email.trim());
    if (!record) {
      record = createLocalUserRecord({ email: email.trim(), full_name: email.split('@')[0] });
    }
    setCurrentUserFromRecord(record, 'password');
    return { user: auth.currentUser as User };
  }
};

/**
 * Register via the Django backend API.
 * Falls back to local mock if the backend is unreachable.
 */
export const createUserWithEmailAndPassword = async (_authState: AuthState, email: string, password: string) => {
  try {
    const data = await registerAPI({
      email: email.trim(),
      password,
      confirm_password: password,
      first_name: email.split('@')[0],
      last_name: '',
      role: 'client',
    });
    const record = {
      firebase_uid: data.firebase_uid,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      first_name: data.full_name?.split(' ')[0] || data.email.split('@')[0],
    };
    ensureUserRecord(record);
    setCurrentUserFromRecord(record, 'password');
    return { user: auth.currentUser as User };
  } catch (err: any) {
    if (!ENABLE_LOCAL_FALLBACK) {
      throw err;
    }
    console.warn('Backend register failed, falling back to local:', err.message);
    const existing = findUserByEmail(email.trim());
    const record = existing || createLocalUserRecord({ email: email.trim(), full_name: email.split('@')[0] });
    setCurrentUserFromRecord(record, 'password');
    return { user: auth.currentUser as User };
  }
};

export const signInWithCredential = async (_authState: AuthState, credential: Credential) => {
  const email = credential.email || `${credential.providerId.replace('.com', '')}@createch.mock`;
  // Try backend login with the credential email
  try {
    const data = await loginAPI(email, credential.password || 'oauth_placeholder');
    const record = {
      firebase_uid: data.firebase_uid,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
    };
    ensureUserRecord(record);
    setCurrentUserFromRecord(record, credential.providerId);
    return { user: auth.currentUser as User };
  } catch {
    if (!ENABLE_LOCAL_FALLBACK) {
      throw new Error('Social login is not configured for this backend yet. Use email and password.');
    }
    // Fallback to local
    const existing = findUserByEmail(email);
    const providerLabel = credential.providerId.includes('github') ? 'GitHub User' : 'Google User';
    const record = existing || createLocalUserRecord({ email, full_name: providerLabel });
    setCurrentUserFromRecord(record, credential.providerId);
    return { user: auth.currentUser as User };
  }
};

export const sendPasswordResetEmail = async (_authState: AuthState, _email: string) => {};
export const sendEmailVerification = async (_user: User) => {};
export const reauthenticateWithCredential = async (_user: User, _credential: Credential) => ({ user: _user });
export const updatePassword = async (_user: User, _newPassword: string) => {};

export const signOut = async (_authState: AuthState) => {
  await clearToken();
  auth.currentUser = null;
  notify();
};

export const updateProfile = async (user: User, updates: { displayName?: string | null; photoURL?: string | null }) => {
  if (typeof updates.displayName !== 'undefined') {
    user.displayName = updates.displayName;
  }
  if (typeof updates.photoURL !== 'undefined') {
    user.photoURL = updates.photoURL;
  }
  syncRecordFromUser(user);
  try {
    const updated = await updateUser(user.uid, {
      username: user.displayName,
      avatar_url: user.photoURL,
    });
    await apiSetStoredUser(normalizeBackendUser(updated));
  } catch (err) {
    if (!ENABLE_LOCAL_FALLBACK) throw err;
  }
  if (auth.currentUser?.uid === user.uid) {
    auth.currentUser = clone(user);
    notify();
  }
};

export const updateEmail = async (user: User, newEmail: string) => {
  user.email = newEmail;
  syncRecordFromUser(user);
  if (auth.currentUser?.uid === user.uid) {
    auth.currentUser = clone(user);
    notify();
  }
};

export const verifyBeforeUpdateEmail = async (user: User, newEmail: string) => {
  await updateEmail(user, newEmail);
};

export const GoogleAuthProvider = {
  credential: (token?: string) => ({ providerId: 'google.com', token, email: 'google.user@createch.mock' }),
};

export const GithubAuthProvider = {
  credential: (token?: string) => ({ providerId: 'github.com', token, email: 'github.user@createch.mock' }),
};

export const EmailAuthProvider = {
  credential: (email: string, password: string) => ({ providerId: 'password', email, password }),
};
