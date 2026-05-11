/**
 * Centralized API client for the CREATECH mobile app.
 *
 * Features:
 * - AsyncStorage for JWT token persistence
 * - In-memory request cache (avoids redundant fetches during session)
 * - Request deduplication (concurrent identical GETs share a single fetch)
 * - Retry with exponential back-off for network failures
 * - Request timeout (15s default)
 * - Automatic 401 handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_BASE =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://localhost:8000/api';
const configuredApiBase =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ||
  DEFAULT_API_BASE;
const API_BASE = configuredApiBase.replace(/\/$/, '');

const TOKEN_KEY = 'createch_token';
const USER_KEY = 'createch_user';
const REQUEST_TIMEOUT = 15_000;   // 15 second timeout
const MAX_RETRIES = 2;

// ── Token helpers (with memory cache) ──────────────────────────────────────

let cachedToken: string | null = null;
let cachedUser: Record<string, any> | null = null;

export const getToken = async (): Promise<string | null> => {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
};

export const setToken = async (token: string) => {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = async () => {
  cachedToken = null;
  cachedUser = null;
  clearAllCache();
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

export const getStoredUser = async (): Promise<Record<string, any> | null> => {
  if (cachedUser) return cachedUser;
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    cachedUser = raw ? JSON.parse(raw) : null;
    return cachedUser;
  } catch {
    return null;
  }
};

export const setStoredUser = async (user: Record<string, any>) => {
  cachedUser = user;
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

// ── Request cache ──────────────────────────────────────────────────────────

const cache = new Map<string, { data: any; timestamp: number }>();
const inflight = new Map<string, Promise<any>>();

const DEFAULT_TTL = 30_000;
const SHORT_TTL  = 10_000;
const LONG_TTL   = 120_000;

const ENDPOINT_TTL: Record<string, number> = {
  '/categories/': LONG_TTL,
  '/users/':      SHORT_TTL,
  '/orders/':     SHORT_TTL,
  '/messages/':   SHORT_TTL,
  '/services/':   DEFAULT_TTL,
};

function getCacheTTL(endpoint: string): number {
  for (const [pattern, ttl] of Object.entries(ENDPOINT_TTL)) {
    if (endpoint.startsWith(pattern)) return ttl;
  }
  return DEFAULT_TTL;
}

function buildCacheKey(endpoint: string, params?: Record<string, any>): string {
  const sorted = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${endpoint}::${sorted}`;
}

export function invalidateCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function clearAllCache() {
  cache.clear();
}

// ── Generic fetcher ────────────────────────────────────────────────────────

type RequestOptions = {
  method?: string;
  body?: Record<string, any>;
  params?: Record<string, any>;
  auth?: boolean;
  skipCache?: boolean;
  timeout?: number;
};

async function request(endpoint: string, options: RequestOptions = {}): Promise<any> {
  const { method = 'GET', body, params, auth = true, skipCache = false, timeout = REQUEST_TIMEOUT } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // Cache hit for GET
  if (method === 'GET' && !skipCache) {
    const cacheKey = buildCacheKey(endpoint, params);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < getCacheTTL(endpoint)) {
      return cached.data;
    }
    // Deduplication
    if (inflight.has(cacheKey)) {
      return inflight.get(cacheKey);
    }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  // Fetch with timeout + retry
  const doFetch = async (attempt = 0): Promise<any> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 204) return null;

      // Auto-logout on 401
      if (res.status === 401 && auth) {
        cachedToken = null;
        cachedUser = null;
        clearAllCache();
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        const err: any = new Error('Session expired');
        err.status = 401;
        throw err;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error || data?.detail || `Request failed (${res.status})`;
        const err: any = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const timeoutErr: any = new Error('Request timed out');
        timeoutErr.status = 408;
        // Retry timeouts
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(1000 * 2 ** attempt, 5000);
          await new Promise(r => setTimeout(r, delay));
          return doFetch(attempt + 1);
        }
        throw timeoutErr;
      }
      // Don't retry 4xx errors
      if (err.status && err.status >= 400 && err.status < 500) throw err;
      // Retry network/5xx errors
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** attempt, 5000);
        await new Promise(r => setTimeout(r, delay));
        return doFetch(attempt + 1);
      }
      throw err;
    }
  };

  // Wrap GETs in cache + dedup
  if (method === 'GET' && !skipCache) {
    const cacheKey = buildCacheKey(endpoint, params);
    const promise = doFetch()
      .then(data => {
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      })
      .finally(() => inflight.delete(cacheKey));

    inflight.set(cacheKey, promise);
    return promise;
  }

  // Mutations — execute then bust cache
  const result = await doFetch();
  if (method !== 'GET') {
    const basePath = endpoint.replace(/\/[^/]+\/?$/, '/');
    invalidateCache(basePath);
  }
  return result;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function loginAPI(email: string, password: string) {
  const data = await request('/auth/login/', { method: 'POST', body: { email, password }, auth: false });
  await setToken(data.access);
  await setStoredUser({
    firebase_uid: data.firebase_uid,
    id: data.firebase_uid,
    email: data.email,
    role: data.role,
    full_name: data.full_name,
    username: data.full_name,
  });
  clearAllCache();
  return data;
}

export async function registerAPI(payload: {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
}) {
  const data = await request('/auth/register/', { method: 'POST', body: payload, auth: false });
  await setToken(data.access);
  await setStoredUser({
    firebase_uid: data.firebase_uid,
    id: data.firebase_uid,
    email: data.email,
    role: data.role,
    full_name: data.full_name,
    username: data.full_name,
  });
  clearAllCache();
  return data;
}

export async function fetchMe() {
  return request('/auth/me/', { skipCache: true });
}

// ── Users ──────────────────────────────────────────────────────────────────

export const fetchUsers = (params?: Record<string, any>) => request('/users/', { params });
export const fetchUser = (id: string) => request(`/users/${id}/`);
export const updateUser = (id: string, body: Record<string, any>) => request(`/users/${id}/`, { method: 'PATCH', body });

// ── Creators ───────────────────────────────────────────────────────────────

export const fetchCreators = (params?: Record<string, any>) => request('/creators/', { params });
export const fetchCreatorByUid = (uid: string) => request(`/creators/by-uid/${uid}/`);
export const createCreator = (body: Record<string, any>) => request('/creators/', { method: 'POST', body });
export const updateCreator = (id: string | number, body: Record<string, any>) => request(`/creators/${id}/`, { method: 'PATCH', body });

// ── Categories ─────────────────────────────────────────────────────────────

export const fetchCategories = (params?: Record<string, any>) => request('/categories/', { params });

// ── Services ───────────────────────────────────────────────────────────────

export const fetchServices = (params?: Record<string, any>) => request('/services/', { params });
export const fetchService = (id: string | number) => request(`/services/${id}/`);
export const createService = (body: Record<string, any>) => request('/services/', {
  method: 'POST',
  body: {
    title: body.title,
    category: body.category || body.label || 'General',
    description: body.description,
    price: Number(body.price || 0),
    creator_id: Number(body.creator_id || 0),
    image_url: body.image_url || null,
    is_public: body.is_public ?? true,
  },
});
export const updateService = (id: string | number, body: Record<string, any>) => request(`/services/${id}/`, { method: 'PATCH', body });
export const deleteService = (id: string | number) => request(`/services/${id}/`, { method: 'DELETE' });

// ── Orders ─────────────────────────────────────────────────────────────────

export const fetchOrders = (params?: Record<string, any>) => request('/orders/', { params });
export const fetchOrder = (id: string | number) => request(`/orders/${id}/`);
export const createOrder = async (body: Record<string, any>) => {
  let serviceId = body.service_id || body.id;
  if (!serviceId && body.creator_id && body.service_title) {
    const services = await fetchServices({ creator_id: body.creator_id });
    const rows = services?.results || services || [];
    const match = rows.find((service: any) => service.title === body.service_title);
    serviceId = match?.id;
  }
  return request('/orders/', { method: 'POST', body: { service_id: Number(serviceId) } });
};
export const updateOrder = (id: string | number, body: Record<string, any>) => request(`/orders/${id}/`, { method: 'PATCH', body });
export const updateOrderStatus = (id: string | number, status: string) => request(`/orders/${id}/update_status/`, { method: 'POST', body: { status } });

// ── Order Timeline ─────────────────────────────────────────────────────────

export const fetchOrderTimeline = (params?: Record<string, any>) => request('/order-timeline/', { params });

// ── Reviews ────────────────────────────────────────────────────────────────

export const fetchReviews = (params?: Record<string, any>) => request('/reviews/', { params });
export const createReview = (body: Record<string, any>) => request('/reviews/', {
  method: 'POST',
  body: {
    order_id: Number(body.order_id),
    reviewer_id: Number(body.reviewer_id || 0),
    reviewee_id: Number(body.reviewee_id),
    rating: Number(body.rating),
    comment: body.comment || body.review_text || '',
  },
});
export const updateReview = (id: string | number, body: Record<string, any>) => request(`/reviews/${id}/`, {
  method: 'PUT',
  body: {
    rating: body.rating == null ? undefined : Number(body.rating),
    comment: body.comment || body.review_text,
  },
});

// ── Messages ───────────────────────────────────────────────────────────────

export const fetchMessages = (params?: Record<string, any>) => request('/messages/', { params });
export const sendMessage = (body: Record<string, any>) => request('/messages/', {
  method: 'POST',
  body: {
    order_id: body.order_id == null ? null : Number(body.order_id),
    receiver_id: Number(body.receiver_id),
    content: body.content || (body.media_url ? 'Image attachment' : ''),
    media_url: body.media_url || null,
    is_read: !!body.is_read,
    is_deleted: !!body.is_deleted,
    from_smart_match: !!body.from_smart_match,
    service_data: body.service_data || null,
  },
});
export const updateMessage = (id: string | number, body: Record<string, any>) => request(`/messages/${id}/`, {
  method: 'PATCH',
  body: {
    content: body.content,
    media_url: body.media_url,
    is_read: body.is_read,
    is_deleted: body.is_deleted,
    from_smart_match: body.from_smart_match,
    service_data: body.service_data,
  },
});

// ── Follows ────────────────────────────────────────────────────────────────

export const fetchFollows = (params?: Record<string, any>) => request('/follows/', { params });
export const createFollow = (body: Record<string, any>) => request('/follows/', { method: 'POST', body });
export const deleteFollow = (id: string | number) => request(`/follows/${id}/`, { method: 'DELETE' });

// ── Blocks ─────────────────────────────────────────────────────────────────

export const fetchBlocks = (params?: Record<string, any>) => request('/blocks/', { params });
export const createBlock = (body: Record<string, any>) => request('/blocks/', { method: 'POST', body });
export const deleteBlock = (id: string | number) => request(`/blocks/${id}/`, { method: 'DELETE' });

// ── Reports ────────────────────────────────────────────────────────────────

export const fetchReports = (params?: Record<string, any>) => request('/reports/', { params });
export const createReport = (body: Record<string, any>) => request('/reports/', { method: 'POST', body });

// ── Matches ────────────────────────────────────────────────────────────────

export const fetchMatches = (params?: Record<string, any>) => request('/matches/', { params });
export const createMatch = (body: Record<string, any>) => request('/matches/', { method: 'POST', body });
export const updateMatch = (id: string | number, body: Record<string, any>) => request(`/matches/${id}/`, { method: 'PUT', body });

// ── Payment Methods ────────────────────────────────────────────────────────

export const fetchPaymentMethods = (params?: Record<string, any>) => request('/payment-methods/', { params });
export const createPaymentMethod = (body: Record<string, any>) => request('/payment-methods/', {
  method: 'POST',
  body: {
    user_id: Number(body.user_id || 0),
    method_type: body.method_type || body.type || body.wallet_type || 'Payment Method',
    masked_number: body.masked_number || body.account_number || body.account_details || '',
  },
});
export const deletePaymentMethod = (id: string | number) => request(`/payment-methods/${id}/`, { method: 'DELETE' });

// ── Support Tickets ────────────────────────────────────────────────────────

export const fetchSupportTickets = (params?: Record<string, any>) => request('/support-tickets/', { params });
export const createSupportTicket = (body: Record<string, any>) => request('/support-tickets/', { method: 'POST', body });
export const updateSupportTicket = (id: string | number, body: Record<string, any>) => request(`/support-tickets/${id}/`, { method: 'PATCH', body });

// ── Wallets ────────────────────────────────────────────────────────────────

export const fetchWallets = (params?: Record<string, any>) => request('/wallets/', { params });
export const createWallet = (body: Record<string, any>) => request('/wallets/', {
  method: 'POST',
  body: {
    user_id: Number(body.user_id || 0),
    wallet_type: body.wallet_type || body.type || 'Createch Wallet',
    account_name: body.account_name || 'Account',
    account_number: body.account_number || '',
  },
});
export const updateWallet = (id: string | number, body: Record<string, any>) => request(`/wallets/${id}/`, { method: 'PATCH', body });
export const deleteWallet = (id: string | number) => request(`/wallets/${id}/`, { method: 'DELETE' });

// ── Withdrawals ────────────────────────────────────────────────────────────

export const fetchWithdrawals = (params?: Record<string, any>) => request('/withdrawals/', { params });
export const createWithdrawal = (body: Record<string, any>) => request('/withdrawals/', { method: 'POST', body });

// ── Deadline Notifications ─────────────────────────────────────────────────

export const fetchDeadlineNotifications = (params?: Record<string, any>) => request('/deadline-notifications/', { params });

// ── Daily Analytics ────────────────────────────────────────────────────────

export const fetchDailyAnalytics = (params?: Record<string, any>) => request('/daily-analytics/', { params });
