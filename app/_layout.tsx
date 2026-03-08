import ErrorBoundary from '@/components/ErrorBoundary';
import { LanguageProvider } from '@/context/LanguageContext';
import { OrderProvider } from '@/context/OrderContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { UnreadProvider } from '@/context/UnreadContext';
import { useUserSync } from '@/hooks/useUserSync';
import { Stack, useRouter, useSegments } from 'expo-router';
import { auth, onAuthStateChanged, User } from '@/frontend/session';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  useUserSync();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    if (initializing) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inAuthRoute = segments[0] === 'login' || segments[0] === 'register';

    if (user) {
      if (inAuthRoute) {
        router.replace('/(tabs)');
      }
    } else {
      if (inTabsGroup || segments[0] === 'chat') {
        router.replace('/login');
      }
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <OrderProvider>
            <UnreadProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="(tabs)" />

                {/* Search - No Animation */}
                <Stack.Screen
                  name="search"
                  options={{
                    animation: 'none',
                    headerShown: false
                  }}
                />
                <Stack.Screen
                  name="smart-match"
                  options={{
                    animation: 'none',
                    headerShown: false
                  }}
                />
                <Stack.Screen
                  name="chat/[id]"
                  options={{
                    animation: 'none'
                  }}
                />
              </Stack>
            </UnreadProvider>
          </OrderProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

