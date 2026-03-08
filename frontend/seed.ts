type Row = Record<string, any>;

const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

const clientUser = {
  firebase_uid: 'mock-client-1',
  full_name: 'Alex Rivera',
  first_name: 'Alex',
  last_name: 'Rivera',
  avatar_url: 'https://placehold.co/200x200/png?text=AR',
  role: 'client',
  email: 'alex@createch.app',
  phone: '+63 912 345 6789',
  language: 'en',
  notifications_enabled: true,
  created_at: daysAgo(45),
};

const adminUser = {
  firebase_uid: 'mock-admin-1',
  full_name: 'Sys Admin',
  first_name: 'Sys',
  last_name: 'Admin',
  avatar_url: 'https://placehold.co/200x200/png?text=AD',
  role: 'admin',
  email: 'admin@createch.app',
  phone: '+63 900 000 0000',
  language: 'en',
  notifications_enabled: true,
  created_at: daysAgo(100),
};

const creatorUsers = [
  {
    firebase_uid: 'mock-creator-1',
    full_name: 'Maya Santos',
    first_name: 'Maya',
    last_name: 'Santos',
    avatar_url: 'https://placehold.co/200x200/png?text=MS',
    role: 'creator',
    email: 'maya@createch.app',
    phone: '+63 917 000 0001',
    language: 'en',
    notifications_enabled: true,
    created_at: daysAgo(120),
  },
  {
    firebase_uid: 'mock-creator-2',
    full_name: 'Noah Lim',
    first_name: 'Noah',
    last_name: 'Lim',
    avatar_url: 'https://placehold.co/200x200/png?text=NL',
    role: 'creator',
    email: 'noah@createch.app',
    phone: '+63 917 000 0002',
    language: 'en',
    notifications_enabled: true,
    created_at: daysAgo(96),
  },
  {
    firebase_uid: 'mock-creator-3',
    full_name: 'Iris Chen',
    first_name: 'Iris',
    last_name: 'Chen',
    avatar_url: 'https://placehold.co/200x200/png?text=IC',
    role: 'creator',
    email: 'iris@createch.app',
    phone: '+63 917 000 0003',
    language: 'en',
    notifications_enabled: true,
    created_at: daysAgo(88),
  },
];

const creatorProfiles = [
  {
    id: 1,
    user_id: 'mock-creator-1',
    bio: 'Brand designer focused on logos, visual identity, and product-ready UI mockups.',
    skills: ['Logo Design', 'Brand Style Guides', 'UI/UX Design'],
    experience_years: 6,
    starting_price: '3500',
    turnaround_time: '5-7 days',
    portfolio_url: 'https://portfolio.mock/maya',
  },
  {
    id: 2,
    user_id: 'mock-creator-2',
    bio: 'Full-stack developer building web apps, mobile MVPs, and admin tools.',
    skills: ['Web Development', 'Mobile App Development', 'Support & IT'],
    experience_years: 5,
    starting_price: '8500',
    turnaround_time: '1-2 weeks',
    portfolio_url: 'https://portfolio.mock/noah',
  },
  {
    id: 3,
    user_id: 'mock-creator-3',
    bio: 'Video editor and motion designer for product promos, reels, and launch campaigns.',
    skills: ['Video Editing', 'Visual Effects', 'Animation for Kids'],
    experience_years: 4,
    starting_price: '5000',
    turnaround_time: '3-5 days',
    portfolio_url: 'https://portfolio.mock/iris',
  },
];

const serviceRows = [
  {
    id: 101,
    title: 'Modern brand identity kit',
    description: 'Logo, palette, typography system, and social-ready brand assets.',
    price: '3500',
    image_url: 'https://placehold.co/600x400/png?text=Brand+Kit',
    creator_id: 'mock-creator-1',
    label: 'Logo Design',
    created_at: hoursAgo(8),
    is_public: true,
    is_deleted: false,
  },
  {
    id: 102,
    title: 'Mobile app UI prototype',
    description: 'Clean mobile screens and clickable prototype for startup validation.',
    price: '7200',
    image_url: 'https://placehold.co/600x400/png?text=UI+Prototype',
    creator_id: 'mock-creator-1',
    label: 'UI/UX Design',
    created_at: hoursAgo(32),
    is_public: true,
    is_deleted: false,
  },
  {
    id: 103,
    title: 'Landing page development',
    description: 'Responsive landing page with polished sections and strong conversion flow.',
    price: '9500',
    image_url: 'https://placehold.co/600x400/png?text=Landing+Page',
    creator_id: 'mock-creator-2',
    label: 'Web Development',
    created_at: hoursAgo(12),
    is_public: true,
    is_deleted: false,
  },
  {
    id: 104,
    title: 'Custom app feature build',
    description: 'Focused sprint to implement one mobile app feature end to end.',
    price: '15000',
    image_url: 'https://placehold.co/600x400/png?text=App+Feature',
    creator_id: 'mock-creator-2',
    label: 'Mobile App Development',
    created_at: hoursAgo(48),
    is_public: true,
    is_deleted: false,
  },
  {
    id: 105,
    title: 'Launch trailer edit',
    description: 'Fast-paced promotional video edit with captions, music, and motion graphics.',
    price: '5600',
    image_url: 'https://placehold.co/600x400/png?text=Trailer+Edit',
    creator_id: 'mock-creator-3',
    label: 'Video Editing',
    created_at: hoursAgo(5),
    is_public: true,
    is_deleted: false,
  },
];

const reviewRows = [
  {
    id: 301,
    reviewer_id: 'mock-client-1',
    reviewee_id: 'mock-creator-1',
    order_id: 201,
    rating: 5,
    review_text: 'Quick turnaround and very clean design work.',
    created_at: daysAgo(3),
  },
  {
    id: 302,
    reviewer_id: 'mock-client-1',
    reviewee_id: 'mock-creator-2',
    order_id: 202,
    rating: 4,
    review_text: 'Solid development work and clear updates.',
    created_at: daysAgo(6),
  },
  {
    id: 303,
    reviewer_id: 'mock-client-1',
    reviewee_id: 'mock-creator-3',
    order_id: 203,
    rating: 5,
    review_text: 'Video came out sharp and on-brand.',
    created_at: daysAgo(9),
  },
];

const orderRows = [
  {
    id: 201,
    client_id: 'mock-client-1',
    creator_id: 'mock-creator-1',
    client_name: 'Alex Rivera',
    creator_name: 'Maya Santos',
    service_title: 'Modern brand identity kit',
    service_description: 'Logo, palette, typography system, and social-ready brand assets.',
    service_id: 101,
    price: '3500',
    status: 'in_progress',
    requirements: 'Need a clean fintech visual identity.',
    revisions_included: 2,
    payment_method: 'GCash',
    created_at: daysAgo(2),
    updated_at: hoursAgo(18),
    deadline: daysFromNow(5),
    deleted_by_creator: null,
    refund_requested_at: null,
    is_deleted: false,
  },
  {
    id: 202,
    client_id: 'mock-client-1',
    creator_id: 'mock-creator-2',
    client_name: 'Alex Rivera',
    creator_name: 'Noah Lim',
    service_title: 'Landing page development',
    service_description: 'Responsive landing page with polished sections and strong conversion flow.',
    service_id: 103,
    price: '9500',
    status: 'completed',
    requirements: 'Need a product launch page with signup section.',
    revisions_included: 1,
    payment_method: 'PayPal',
    created_at: daysAgo(12),
    updated_at: daysAgo(6),
    deadline: daysAgo(7),
    deleted_by_creator: null,
    refund_requested_at: null,
    is_deleted: false,
  },
];

const messageRows = [
  {
    id: 401,
    sender_id: 'mock-creator-1',
    receiver_id: 'mock-client-1',
    content: 'I drafted three logo directions for you.',
    created_at: hoursAgo(6),
    is_read: false,
    is_deleted: false,
    media_url: null,
  },
  {
    id: 402,
    sender_id: 'mock-client-1',
    receiver_id: 'mock-creator-1',
    content: 'Perfect, send over the strongest option first.',
    created_at: hoursAgo(5),
    is_read: true,
    is_deleted: false,
    media_url: null,
  },
  {
    id: 403,
    sender_id: 'mock-creator-2',
    receiver_id: 'mock-client-1',
    content: 'The landing page build is ready for review.',
    created_at: daysAgo(1),
    is_read: false,
    is_deleted: false,
    media_url: null,
  },
];

const matchRows = [
  {
    id: 501,
    client_id: 'mock-client-1',
    creator_id: 'mock-creator-1',
    match_score: 91,
    created_at: hoursAgo(9),
  },
  {
    id: 502,
    client_id: 'mock-client-1',
    creator_id: 'mock-creator-2',
    match_score: 86,
    created_at: hoursAgo(16),
  },
  {
    id: 503,
    client_id: 'mock-client-1',
    creator_id: 'mock-creator-3',
    match_score: 79,
    created_at: daysAgo(2),
  },
];

const followRows = [
  {
    id: 601,
    follower_id: 'mock-client-1',
    following_id: 'mock-creator-1',
    created_at: daysAgo(7),
  },
];

const paymentMethodRows = [
  {
    id: 701,
    user_id: 'mock-client-1',
    type: 'GCash',
    account_name: 'Alex Rivera',
    account_number: '09123456789',
    is_active: true,
  },
  {
    id: 702,
    user_id: 'mock-creator-1',
    type: 'PayPal',
    account_name: 'Maya Santos',
    account_number: 'maya@paypal.mock',
    is_active: true,
  },
];

const walletRows = [
  {
    id: 801,
    user_id: 'mock-client-1',
    wallet_type: 'Createch Wallet',
    balance: 1200,
    is_active: true,
  },
  {
    id: 802,
    user_id: 'mock-creator-1',
    wallet_type: 'Createch Wallet',
    balance: 5400,
    is_active: true,
  },
];

const categories = [
  { id: 1, label: 'Design & Creative', icon: 'color-palette-outline', color: '#8b5cf6' },
  { id: 2, label: 'Development & IT', icon: 'code-slash-outline', color: '#3b82f6' },
  { id: 3, label: 'Writing & Translation', icon: 'document-text-outline', color: '#f97316' },
  { id: 4, label: 'Digital Marketing', icon: 'trending-up-outline', color: '#10b981' },
  { id: 5, label: 'Video & Animation', icon: 'videocam-outline', color: '#ef4444' },
  { id: 6, label: 'Music & Audio', icon: 'musical-notes-outline', color: '#f59e0b' },
];

const users = [clientUser, adminUser, ...creatorUsers];

const creatorStatsRows = creatorUsers.map((user, index) => ({
  id: 900 + index,
  firebase_uid: user.firebase_uid,
  avg_rating: index === 1 ? 4.7 : 5,
  total_reviews: index === 1 ? 6 : 4,
}));

const dailyAnalyticsRows = [
  {
    id: 1001,
    creator_id: 'mock-creator-1',
    date: daysAgo(1).slice(0, 10),
    profile_views: 12,
    service_clicks: 7,
  },
];

const orderTimelineRows = [
  {
    id: 1101,
    order_id: 201,
    event_type: 'created',
    content: 'Order created',
    created_at: daysAgo(2),
  },
  {
    id: 1102,
    order_id: 201,
    event_type: 'accepted',
    content: 'Creator accepted the order',
    created_at: daysAgo(1),
  },
];

export const localData: Record<string, Row[]> = {
  users,
  creators: creatorProfiles,
  services: serviceRows,
  reviews: reviewRows,
  matches: matchRows,
  messages: messageRows,
  orders: orderRows,
  follows: followRows,
  blocks: [],
  reports: [],
  support_tickets: [],
  payment_methods: paymentMethodRows,
  user_wallets: walletRows,
  categories,
  creator_stats: creatorStatsRows,
  daily_analytics: dailyAnalyticsRows,
  order_timeline: orderTimelineRows,
  deadline_notifications: [],
};

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const getTable = (table: string): Row[] => {
  if (!localData[table]) {
    localData[table] = [];
  }
  return localData[table];
};

export const findUserByUid = (uid: string) =>
  getTable('users').find((user) => user.firebase_uid === uid) || null;

export const findUserByEmail = (email: string) =>
  getTable('users').find((user) => String(user.email || '').toLowerCase() === email.toLowerCase()) || null;

export const ensureUserRecord = (record: Row) => {
  const usersTable = getTable('users');
  const existingIndex = usersTable.findIndex((user) => user.firebase_uid === record.firebase_uid);

  if (existingIndex >= 0) {
    usersTable[existingIndex] = { ...usersTable[existingIndex], ...record };
    return usersTable[existingIndex];
  }

  usersTable.push(record);
  return record;
};

export const createLocalUserRecord = (overrides: Partial<Row> = {}) => {
  const baseId = Date.now();
  const email = String(overrides.email || `user${baseId}@createch.mock`);
  const fullName = String(overrides.full_name || overrides.first_name || email.split('@')[0]);
  const record = {
    firebase_uid: String(overrides.firebase_uid || `mock-user-${baseId}`),
    full_name: fullName,
    first_name: fullName.split(' ')[0],
    last_name: fullName.split(' ').slice(1).join(' '),
    avatar_url: String(overrides.avatar_url || `https://placehold.co/200x200/png?text=${encodeURIComponent(fullName.slice(0, 2).toUpperCase())}`),
    role: String(overrides.role || 'client'),
    email,
    phone: String(overrides.phone || ''),
    language: String(overrides.language || 'en'),
    notifications_enabled: overrides.notifications_enabled ?? true,
    created_at: String(overrides.created_at || new Date().toISOString()),
  };

  return ensureUserRecord(record);
};

export const nextId = (table: string) => {
  const rows = getTable(table);
  return rows.reduce((max, row) => {
    const value = typeof row.id === 'number' ? row.id : 0;
    return value > max ? value : max;
  }, 0) + 1;
};

export const initialSessionUserId = clientUser.firebase_uid;
