<div align="center">
  <h1>
    CREATECH
  </h1>
</div>

**AI-Powered Creative Services Freelance App**

*Connect. Create. Collaborate.*

---

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.84-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue?style=flat-square)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

**Categories:** 🎨 Design | 💻 Development | 🎵 Music | 🎬 Video | 📈 Marketing | ✍️ Writing

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Core Features Breakdown](#core-features-breakdown)
- [Authentication Flow](#authentication-flow)
- [Smart Match System](#smart-match-system)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Contributing](#contributing)

---

## 🌟 Overview

**CREATECH** is a cutting-edge mobile freelance app that bridges the gap between clients and creative professionals.

Built with **React Native** and **Expo**, powered by **Google's Gemini AI**.

### 🎯 Service Categories

**🎨 Creative Services**
- Graphics & Design
- Brand Identity  
- Illustrations
- UI/UX Design

**💻 Tech Solutions**
- Web Development
- Mobile Apps
- Game Development
- IT Support

**🎬 Media Production**
- Video Editing
- Animation
- Music Production
- Voice Over

### ⚡ Core Innovation

> **AI-Powered Smart Match System** — Our proprietary algorithm uses Google's Gemini AI to analyze project requirements and intelligently match clients with the perfect creators based on skills, experience, budget, and timeline compatibility.

---

## ✨ Key Features

### 👥 For Clients
- 🔍 **Advanced Search** - Browse services and creators by category, skills, ratings
- 🤖 **AI Smart Match** - Get AI-powered creator recommendations based on project requirements
- 📊 **Recently Matched** - View your match history and scores
- 💬 **Real-time Chat** - Communicate with creators instantly
- 📦 **Order Management** - Track service requests from pending to completion
- 🔔 **Live Notifications** - Get updates on order status changes and new messages
- ⭐ **Reviews & Ratings** - Rate creators and view their reputation
- 🚫 **Block/Unblock** - Control who can interact with you

### 🎨 For Creators
- 🎓 **Identity Verification** - Secure 3-step onboarding with government ID verification
- 📝 **Service Listings** - Create and manage custom service offerings
- 💼 **Portfolio Management** - Showcase your work and expertise
- 💰 **Pricing Control** - Set your own rates and turnaround times
- 📊 **Order Dashboard** - Manage incoming requests efficiently
- 💬 **Client Communication** - Real-time chat with clients
- 📈 **Analytics** - Track your performance and bookings

### ⚙️ Platform Features
- 🌓 **Dark/Light Mode** - Full theme support with system preference detection
- 🔐 **Secure Authentication** - Firebase Auth with email, Google, and GitHub
- 📱 **Cross-platform** - iOS, Android, and Web support
- 🎨 **Modern UI/UX** - Clean, intuitive interface with smooth animations
- 📸 **Image Management** - Profile pictures, service photos, ID verification
- 🔄 **Real-time Sync** - Supabase real-time subscriptions for instant updates

---

## 🛠 Technology Stack

### Core Framework
- **React Native** (0.81.5) - Mobile app framework
- **Expo** (~54.0) - Development platform and build tools
- **TypeScript** (5.9) - Type-safe JavaScript

### Backend & Database
- **Firebase** (12.6)
  - Authentication (Email/Password, Google OAuth, GitHub OAuth)
  - User management
  - Secure credential storage
- **Supabase** (2.84)
  - PostgreSQL database
  - Real-time subscriptions
  - Storage (ID verification photos, profile images, service photos)
  - Row Level Security (RLS)

### AI & Intelligence
- **Google Gemini AI** (2.5-flash)
  - Natural language project analysis
  - Intelligent skill extraction
  - Creator ranking algorithm
  - Smart matching recommendations

### Navigation & Routing
- **Expo Router** (~6.0) - File-based navigation
- **React Navigation** (7.x) - Stack and tab navigation

### UI Components & Styling
- **React Native Gesture Handler** - Touch interactions
- **React Native Reanimated** - Smooth animations
- **Expo Vector Icons** - Icon library (Ionicons, Feather, FontAwesome)
- **Lucide React Native** - Modern icon set

### State Management
- **React Context API** - Global state (Theme, Language, Orders, Messages)
- **AsyncStorage** - Local data persistence
- **Expo Secure Store** - Encrypted credential storage

### Media & Files
- **Expo Image Picker** - Photo selection and camera access
- **Expo Image** - Optimized image rendering
- **Expo File System** - File operations
- **Base64 ArrayBuffer** - Image encoding for uploads

### Additional Libraries
- **React Native Safe Area Context** - Handle device notches/insets
- **React Native SVG** - Vector graphics support
- **React Native URL Polyfill** - URL handling
- **dotenv** - Environment variable management

---

## 📁 Project Structure

```
createch-app/
├── app/                          # Main application screens (Expo Router)
│   ├── (tabs)/                   # Bottom tab navigation screens
│   │   ├── index.tsx            # Home feed (services, creators, matches)
│   │   ├── search.tsx           # Search & discover
│   │   ├── order.tsx            # Order management
│   │   ├── message.tsx          # Chat inbox
│   │   ├── profile.tsx          # User profile & settings
│   │   ├── AnalyticsScreen.tsx  # Analytics dashboard
│   │   ├── ManageService.tsx    # Service management for creators
│   │   └── _layout.tsx          # Tab navigation config
│   ├── chat/
│   │   └── [id].tsx             # Individual chat conversation
│   ├── creator/
│   │   └── [id].tsx             # Creator profile view
│   ├── onboarding/
│   │   └── become-creator.tsx   # Creator registration & verification
│   ├── search/                   # Search category screens
│   │   ├── services.tsx         # All services listing
│   │   ├── creators.tsx         # All creators listing
│   │   ├── listings.tsx         # Service listings
│   │   ├── subcategory.tsx      # Subcategory browse
│   │   └── recentmatch.tsx      # Match history
│   ├── smart-match/              # AI matching flow
│   │   ├── match.tsx            # Step 1: Category selection
│   │   ├── step2.tsx            # Step 2: Skills selection
│   │   ├── step3.tsx            # Step 3: Project description
│   │   ├── step4.tsx            # Step 4: Budget & timeline
│   │   ├── loading.tsx          # AI analysis & results
│   │   └── _layout.tsx          # Match flow layout
│   ├── index.tsx                # Login screen
│   ├── register.tsx             # Registration screen
│   ├── login.tsx                # Alternative login (if needed)
│   ├── notifications.tsx        # Notification center
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable UI components
│   ├── home/
│   │   ├── cards/               # Card components
│   │   │   ├── CategoryCard.tsx
│   │   │   ├── CreatorCard.tsx
│   │   │   ├── MatchCard.tsx
│   │   │   ├── ServiceCard.tsx
│   │   │   └── SeeAllCard.tsx
│   │   ├── modals/              # Modal dialogs
│   │   │   ├── BookingModal.tsx
│   │   │   ├── CreatorModal.tsx
│   │   │   └── ServiceModal.tsx
│   │   └── sections/            # Home screen sections
│   │       ├── CategorySection.tsx
│   │       ├── CreatorsSection.tsx
│   │       ├── MatchesSection.tsx
│   │       └── ServicesSection.tsx
│   ├── ui/                      # Generic UI components
│   │   ├── icon-symbol.tsx
│   │   └── icon-symbol.ios.tsx
│   ├── SmartMatchProgressHeader.tsx
│   ├── themed-text.tsx
│   └── themed-view.tsx
├── context/                      # React Context providers
│   ├── ThemeContext.tsx         # Dark/Light mode
│   ├── LanguageContext.tsx      # Internationalization (i18n)
│   ├── OrderContext.tsx         # Order notifications
│   └── UnreadContext.tsx        # Unread message counter
├── hooks/                        # Custom React hooks
│   ├── home/
│   │   ├── useHomeData.ts       # Fetch home screen data
│   │   └── useBooking.ts        # Booking logic
│   ├── useAnalytics.ts
│   ├── useUserSync.ts           # Firebase-Supabase sync
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── constants/                    # App constants
│   ├── theme.ts                 # Color schemes
│   ├── storage.ts               # AsyncStorage keys
│   └── creatorTermsOfService.ts # Legal terms
├── assets/                       # Static assets
│   └── images/
├── firebaseConfig.ts            # Firebase initialization
├── supabaseConfig.ts            # Supabase client
├── app.config.js                # Expo config
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Firebase Project** (with Auth enabled)
- **Supabase Project** (with database and storage configured)
- **Google Gemini API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://bitbucket.org/almondster/createch-app.git
   cd createch-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key

   # Google Gemini AI
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

   # OAuth (Optional)
   EXPO_PUBLIC_FACEBOOK_APP_ID=your_fb_app_id
   EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN=your_fb_client_token
   ```

4. **Configure Firebase**
   - Download `google-services.json` (Android) from Firebase Console
   - Place it in the root directory
   - Enable Email/Password, Google, and GitHub authentication

5. **Configure Supabase**
   - Set up the following tables (see [Database Schema](#-database-schema))
   - Create storage buckets: `id-verification`, `avatars`, `service-images`
   - Configure Row Level Security policies

6. **Run the app**
   ```bash
   # Development server
   npm start

   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

---

## 🎯 Core Features Breakdown

### 1. **Home Feed** (`app/(tabs)/index.tsx`)

The main dashboard displays:
- **Service Categories** - Browse by main categories (Design, Development, etc.)
- **Recently Matched** - Your AI match history with scores
- **Top Creators** - Featured verified creators
- **Creator Services** - Latest service offerings

**Data Flow:**
- Fetches data using `useHomeData` hook
- Real-time updates via Supabase subscriptions
- Implements lazy loading and caching
- Respects blocked user lists

### 2. **Smart Match System** (`app/smart-match/*`)

#### Two Modes:

**🤖 AI Smart Match** (One-Step)
1. User describes their project in natural language
2. Gemini AI analyzes and extracts:
   - Category
   - Required skills
   - Budget range
   - Timeline
3. AI ranks creators with detailed reasoning
4. Shows match scores (0-100%) with explanations

**📝 Guided Match** (4-Step Wizard)
1. **Step 1**: Select category
2. **Step 2**: Choose required skills
3. **Step 3**: Describe project details
4. **Step 4**: Set budget & timeline

**Matching Algorithm:**
- Skills overlap percentage
- Experience level
- Availability
- Price range compatibility
- Historical performance
- AI-enhanced insights (strength, concerns, recommendations)

**Implementation:**
```typescript
// AI Ranking with Gemini
const rankCreators = async (creators, skills, description, budget) => {
  const prompt = `Analyze ${creators.length} creators and rank them...`;
  const response = await fetch(GEMINI_API, {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
  
  return parsedRankings.map(rank => ({
    ...creators[rank.index],
    matchScore: rank.score,
    matchReason: rank.reason,
    matchStrength: rank.strength,
    matchConcern: rank.concern
  }));
};
```

### 3. **Order Management** (`app/(tabs)/order.tsx`)

**For Clients:**
- View all service requests (pending, in progress, completed)
- Cancel pending requests
- Mark orders as complete
- Leave reviews and ratings
- **Request Refunds**: Initiate refund requests for undelivered or unsatisfactory work.
- **Approve Extensions**: Grant creators more time, which automatically voids any pending refund requests.

**For Creators:**
- Accept or reject incoming requests
- Track active projects
- Mark deliveries as delivered
- View client feedback
- **Respond to Refunds**: Approve or deny refund requests.
- **Request Extensions**: Ask for more time to complete a project.

**Refund & Extension Logic:**
- **Auto-Processing**: Refunds are automatically processed if a creator fails to respond or deliver within 24 hours of a request or denial.
- **Extension Impact**: Approving a deadline extension effectively resets the order status, voiding any active refund requests to allow the creator to continue working.

**Status Flow:**
```
PENDING → ACCEPTED → IN_PROGRESS → DELIVERED → COMPLETED
         ↓
      REJECTED
         ↓
      CANCELLED
```

**Real-time Updates:**
- `OrderContext` polls for new orders every 30 seconds
- Displays unseen order count on tab badge
- Shows notifications for status changes

### 4. **Real-time Chat** (`app/(tabs)/message.tsx`, `app/chat/[id].tsx`)

**Features:**
- 1-on-1 messaging between clients and creators
- Real-time message delivery (Supabase subscriptions)
- Unread message counters
- Image sharing support
- Message status indicators (sent, delivered, read)

**Data Structure:**
```typescript
// messages table
{
  id: uuid,
  sender_id: string,
  receiver_id: string,
  content: text,
  image_url: string?,
  created_at: timestamp,
  read_at: timestamp?
}
```

### 5. **Creator Onboarding** (`app/onboarding/become-creator.tsx`)

**3-Step Verification Process:**

**Step 1: Identity Verification**
- First, Middle, Last Name
- Government ID Number (12 digits)
- 3 Photo Uploads:
  - Front of ID
  - Back of ID
  - Selfie with ID
- Phone Number with country code
- Structured Address (Street, Barangay, City, Province, Postal Code)

**Step 2: Professional Profile**
- Service Category selection
- Skills (predefined + custom)
- Years of Experience
- Minimum Starting Price
- Typical Turnaround Time
- Bio
- Portfolio Link (optional)

**Step 3: Terms of Service**
- Display scrollable ToS with highlights
- Full terms modal
- Agreement checkbox
- Final submission

**Security:**
- ID photos stored in Supabase Storage (`id-verification` bucket)
- Phone number validation per country
- Email verification required
- Admin review process (optional)

### 6. **Search & Discovery** (`app/(tabs)/search.tsx`)

**Search Modes:**
- **Services Tab**: Browse all service listings
- **Creators Tab**: Find creators by skills/rating

**Filters:**
- Category
- Skills
- Price Range
- Rating
- Availability

**Recent Match History:**
- View all past AI matches
- Sort by match date
- Re-contact matched creators

### 7. **Profile Management** (`app/(tabs)/profile.tsx`)

**Personal Details:**
- Avatar upload
- Name, birthdate, age
- Gender, nationality
- Contact information
- Email change (requires verification)

**Settings:**
- Theme toggle (Dark/Light/Auto)

- Notification preferences

**Creator Mode:**
- Switch to Creator view
- "Become a Creator" button (if not registered)

**Blocked Users:**
- View blocked list
- Unblock users
- Privacy controls

---

## 🔐 Authentication Flow

### Registration (`app/register.tsx`)

1. **User Input**
   - First & Last Name
   - Email
   - Birthdate
   - Phone Number (with country selector)
   - Password (min 6 characters)
   - Confirm Password

2. **Validation**
   - Email format check
   - Password strength
   - Age verification (must be 18+)
   - Phone number format (country-specific regex)

3. **Firebase Account Creation**
   ```typescript
   const userCredential = await createUserWithEmailAndPassword(
     auth, 
     email, 
     password
   );
   ```

4. **Supabase Profile Creation**
   ```typescript
   await supabase.from('users').insert({
     firebase_uid: user.uid,
     email: email.trim(),
     full_name: `${firstName} ${lastName}`,
     phone: `${dialCode}${phone}`,
     birthdate: birthDate.toISOString(),
     role: 'client',
     created_at: new Date().toISOString()
   });
   ```

5. **Email Verification**
   ```typescript
   await sendEmailVerification(user);
   ```

6. **Redirect**
   - Success: Navigate to home
   - Error: Display error message

### Login (`app/index.tsx`)

**Email/Password Login:**
1. Input validation (email format, password length)
2. Firebase authentication
3. Email verification check
4. Remember me functionality (encrypted storage)
5. Supabase session sync

**OAuth Login:**
- **Google Sign-In**: `expo-auth-session/providers/google`
- **GitHub Sign-In**: GitHub auth integration
- Automatic Supabase profile creation on first login

**Security Features:**
- Password visibility toggle
- Secure credential storage (Expo SecureStore)
- SHA-256 password hashing for "Remember Me"
- Session persistence with AsyncStorage

---

## 🤖 Smart Match System

### Architecture

```
User Input → AI Analysis → Creator Ranking → Results
```

### AI Analysis Process

**Input:**
```typescript
{
  projectDescription: string,  // Natural language
  category?: string,           // Optional
  skills?: string[],          // Optional
  budget?: string,            // Optional
  timeline?: string           // Optional
}
```

**Gemini AI Prompt:**
```
You are a professional project analyzer for a creative services marketplace.

Analyze this project: "${description}"

Extract and return JSON:
{
  "category": "detected category",
  "skills": ["skill1", "skill2", ...],
  "description": "cleaned description",
  "budget": "budget range",
  "timeline": "estimated timeline"
}
```

**Creator Ranking Prompt:**
```
You are an expert talent matcher.

Analyze ${creators.length} creators for this project.

For each creator, provide:
- score (0-100): Match percentage
- reason: Why this score
- strength: Best qualities
- concern: Potential issues

Required skills: ${skills}
Budget: ${budget}
Timeline: ${timeline}

Return JSON array sorted by score (highest first).
```

### Fallback Matching

If AI fails, uses basic skill overlap:
```typescript
const matchScore = (matchedSkills / requiredSkills.length) * 100;
```

### Match Storage

```typescript
// Save top 5 matches to database
await supabase.from('matches').insert(
  topMatches.map(creator => ({
    client_id: user.uid,
    creator_id: creator.id,
    match_score: creator.matchScore,
    created_at: new Date().toISOString()
  }))
);
```

---

## 🗄 Database Schema

### Supabase Tables

#### `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  phone TEXT,
  birthdate DATE,
  gender TEXT,
  nationality TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'client', -- 'client' | 'creator' | 'admin'
  
  -- Address
  street_address TEXT,
  barangay TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Philippines',
  
  -- ID Verification (for creators)
  id_number TEXT,
  id_front_url TEXT,
  id_back_url TEXT,
  id_selfie_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `creators`
```sql
CREATE TABLE creators (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(firebase_uid) ON DELETE CASCADE,
  bio TEXT,
  skills TEXT[], -- Array of skill names
  custom_skills TEXT[], -- User-added skills
  portfolio_url TEXT,
  experience_years TEXT,
  starting_price TEXT,
  turnaround_time TEXT,
  
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `services`
```sql
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  creator_id TEXT REFERENCES users(firebase_uid) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  skills TEXT[],
  price NUMERIC,
  turnaround TEXT,
  image_url TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `orders`
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  client_id TEXT REFERENCES users(firebase_uid),
  creator_id TEXT REFERENCES users(firebase_uid),
  service_title TEXT NOT NULL,
  price NUMERIC,
  status TEXT DEFAULT 'pending', 
  -- pending | accepted | in_progress | delivered | completed | rejected | cancelled
  
  client_name TEXT,
  creator_name TEXT,
  image_url TEXT,
  
  last_updated_by TEXT, -- firebase_uid of user who made last update
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id TEXT REFERENCES users(firebase_uid),
  receiver_id TEXT REFERENCES users(firebase_uid),
  content TEXT NOT NULL,
  image_url TEXT,
  
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
```

#### `matches`
```sql
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  client_id TEXT REFERENCES users(firebase_uid),
  creator_id TEXT REFERENCES users(firebase_uid),
  match_score INTEGER, -- 0-100
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(client_id, creator_id)
);
```

#### `reviews`
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  client_id TEXT REFERENCES users(firebase_uid),
  creator_id TEXT REFERENCES users(firebase_uid),
  order_id INTEGER REFERENCES orders(id),
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `blocked_users`
```sql
CREATE TABLE blocked_users (
  id SERIAL PRIMARY KEY,
  blocker_id TEXT REFERENCES users(firebase_uid),
  blocked_id TEXT REFERENCES users(firebase_uid),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(blocker_id, blocked_id)
);
```

---

## 🔧 Environment Variables

Required environment variables in `.env`:

```env
# Firebase Authentication
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=

# Supabase Database & Storage
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_KEY=

# Google Gemini AI
EXPO_PUBLIC_GEMINI_API_KEY=

# OAuth (Optional)
EXPO_PUBLIC_FACEBOOK_APP_ID=
EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN=
```

---

## 💻 Development

### Code Style
- **TypeScript** for type safety
- **Functional components** with hooks
- **Context API** for global state
- **Custom hooks** for reusable logic

### Key Patterns

**Context Usage:**
```typescript
// Using theme
import { useTheme } from '@/context/ThemeContext';
const { theme, isDark, toggleTheme } = useTheme();

// Using language
import { useLanguage } from '@/context/LanguageContext';
const { t, language, setLanguage } = useLanguage();

// Using order notifications
import { useOrderUpdates } from '@/context/OrderContext';
const { unseenOrderCount, markOrdersAsSeen } = useOrderUpdates();
```

**Navigation:**
```typescript
import { useRouter } from 'expo-router';
const router = useRouter();

// Navigate
router.push('/creator/123');
router.replace('/(tabs)');
router.back();

// With params
router.push({
  pathname: '/smart-match/loading',
  params: { category, skills: JSON.stringify(skills) }
});
```

**Supabase Queries:**
```typescript
// Fetch data
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('firebase_uid', uid)
  .single();

// Insert
await supabase.from('orders').insert({ client_id, creator_id, ... });

// Update
await supabase.from('users').update({ avatar_url }).eq('firebase_uid', uid);

// Real-time subscription
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${uid}`
  }, payload => {
    // Handle new message
  })
  .subscribe();
```

### Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

### Building

```bash
# Preview build
eas build --profile preview --platform android

# Development build
eas build --profile development --platform android

# Production build
eas build --profile production --platform ios
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] No console.log statements in production code
- [ ] All new features have proper error handling
- [ ] UI is responsive and supports dark mode
- [ ] Translations added for new text (EN & TL)
- [ ] No hardcoded sensitive data

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

## 🙏 Acknowledgments

- **Expo Team** - Amazing React Native development platform
- **Firebase** - Robust authentication and user management
- **Supabase** - Excellent PostgreSQL backend and real-time capabilities
- **Google Gemini AI** - Powerful language model for intelligent matching
- **React Native Community** - Invaluable libraries and support

---

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on Bitbucket
- Contact: support@createch.app
- Repository: [bitbucket.org/almondster/createch-app](https://bitbucket.org/almondster/createch-app)

---

👾 CREATECH TEAM
