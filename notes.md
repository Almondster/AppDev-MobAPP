# Installation Instructions

## 🔑 Debug Keystore

To list the debug keystore details, run:

```sh
keytool -keystore ./android/app/debug.keystore -list -v
# Password: android
```
# Updated message.tsx

To let someone message each other add this on that specific file:

```sh
onPress={() => {
  // Navigate directly to the chat room with their ID
  router.push(`/chat/${creator.id}`);
}}
```

## 📦 Install Dependencies

Run the following commands separately to install all required dependencies.

### React Navigation, Expo Router, and Core Libraries

```sh
npx expo install \
  @react-navigation/native \
  @react-navigation/stack \
  expo-router \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  react-native-reanimated \
  expo-image \
  expo-secure-store \
  expo-crypto \
  expo-web-browser \
  @expo/vector-icons \
  @react-native-community/datetimepicker
```

### Expo Modules

```sh
npx expo install \
  expo \
  expo-auth-session \
  expo-constants \
  expo-font \
  expo-haptics \
  expo-linear-gradient \
  expo-linking \
  expo-splash-screen \
  expo-status-bar \
  expo-symbols \
  expo-system-ui
```

### React and React Native

```sh
npx expo install react react-dom react-native
```

### TypeScript Types

```sh
npm install -D @types/react @types/react-native
```
### New Dependencies

```sh
npm install firebase
npm install @react-native-async-storage/async-storage
npm install dotenv
npm install expo-constants
npm install react-native-vector-icons @react-native-vector-icons/material-icons
npx expo install expo-image-picker expo-file-system
npx expo install base64-arraybuffer
npx expo install expo-auth-session expo-crypto expo-web-browser
npm install lucide-react-native react-native-svg
```

### Install Supabase SDK

```sh
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
```

### Development Build

```sh
npx --package eas-cli eas build --profile development --platform android
```