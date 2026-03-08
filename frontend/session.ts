import { clone, createLocalUserRecord, ensureUserRecord, findUserByEmail, findUserByUid, initialSessionUserId } from '@/frontend/seed';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: Array<{ providerId: string }>;
  reload: () => Promise<void>;
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

const buildUser = (record: Record<string, any>, providerId = 'password'): User => ({
  uid: record.firebase_uid,
  email: record.email || null,
  displayName: record.full_name || record.first_name || null,
  photoURL: record.avatar_url || null,
  emailVerified: true,
  providerData: [{ providerId }],
  reload: async () => {},
});

const notify = () => {
  const user = auth.currentUser ? clone(auth.currentUser) : null;
  listeners.forEach((listener) => listener(user));
};

const getInitialUser = () => {
  const record = findUserByUid(initialSessionUserId);
  return record ? buildUser(record) : null;
};

export const auth: AuthState = {
  currentUser: getInitialUser(),
};

export const session = auth;

const setCurrentUserFromRecord = (record: Record<string, any> | null, providerId = 'password') => {
  auth.currentUser = record ? buildUser(record, providerId) : null;
  notify();
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
  setTimeout(() => callback(authState.currentUser ? clone(authState.currentUser) : null), 0);
  return () => {
    listeners.delete(callback);
  };
};

export const signInWithEmailAndPassword = async (_authState: AuthState, email: string, _password: string) => {
  let record = findUserByEmail(email.trim());
  if (!record) {
    record = createLocalUserRecord({ email: email.trim(), full_name: email.split('@')[0] });
  }

  setCurrentUserFromRecord(record, 'password');
  return { user: auth.currentUser as User };
};

export const createUserWithEmailAndPassword = async (_authState: AuthState, email: string, _password: string) => {
  const existing = findUserByEmail(email.trim());
  const record = existing || createLocalUserRecord({ email: email.trim(), full_name: email.split('@')[0] });
  setCurrentUserFromRecord(record, 'password');
  return { user: auth.currentUser as User };
};

export const signInWithCredential = async (_authState: AuthState, credential: Credential) => {
  const email = credential.email || `${credential.providerId.replace('.com', '')}@createch.mock`;
  const existing = findUserByEmail(email);
  const providerLabel = credential.providerId.includes('github') ? 'GitHub User' : 'Google User';
  const record = existing || createLocalUserRecord({ email, full_name: providerLabel });
  setCurrentUserFromRecord(record, credential.providerId);
  return { user: auth.currentUser as User };
};

export const sendPasswordResetEmail = async (_authState: AuthState, _email: string) => {};
export const sendEmailVerification = async (_user: User) => {};
export const reauthenticateWithCredential = async (_user: User, _credential: Credential) => ({ user: _user });
export const updatePassword = async (_user: User, _newPassword: string) => {};

export const signOut = async (_authState: AuthState) => {
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
