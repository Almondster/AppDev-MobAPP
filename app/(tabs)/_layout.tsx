import { Ionicons, Octicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOrderUpdates } from '@/context/OrderContext';
import { useTheme } from '@/context/ThemeContext';
import { useUnread } from '@/context/UnreadContext';
import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { Shadows } from '@/constants/theme';

export default function TabLayout() {
  const { theme } = useTheme();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { unreadCount, refreshUnreadCount } = useUnread();
  const { unseenOrderCount, markOrdersAsSeen } = useOrderUpdates();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('firebase_uid', user.uid)
          .single();
        if (data) setRole(data.role);
      }
      setLoading(false);
    };
    fetchRole();
  }, []);

  // Set up real-time subscription for unread counts (Messages)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const channel = supabase
      .channel('unread-counts-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.uid}`,
        },
        () => {
          refreshUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshUnreadCount]);

  // Center Button
  const CenterButton = () => {
    const isCreator = role === 'creator';
    return (
      <View style={[styles.plusButton, { backgroundColor: theme.tint, borderColor: theme.background }]}>
        {isCreator ? (
          <Ionicons name="add" size={30} color="#fff" />
        ) : (
          <Octicons name="sparkle-fill" size={28} color="#fff" />
        )}
      </View>
    );
  };

  const handleOrderPress = () => {
    markOrdersAsSeen();
    // Navigate to order screen
    router.push('/order');
  };

  // Show loading indicator while fetching role
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          ...Shadows.md,
          shadowOffset: { width: 0, height: -2 },
        },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: role === 'admin' ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color, focused }) => (
            role === 'admin'
              ? <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={26} color={color} />
              : <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          )
        }}
      />

      {/* Admin Specific Routes */}
      <Tabs.Screen
        name="admin_projects"
        options={{
          title: 'All Projects',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={26} color={color} />,
          href: role === 'admin' ? undefined : null
        }}
      />
      <Tabs.Screen
        name="admin_users"
        options={{
          title: 'Manage Users',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "people" : "people-outline"} size={26} color={color} />,
          href: role === 'admin' ? undefined : null
        }}
      />
      <Tabs.Screen
        name="admin_disputes"
        options={{
          title: 'Disputes',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "warning" : "warning-outline"} size={26} color={color} />,
          href: role === 'admin' ? undefined : null
        }}
      />
      <Tabs.Screen
        name="admin_settings"
        options={{
          title: 'Settings',
          href: null
        }}
      />

      {/* For Creators: Show briefcase icon that goes to ManageService */}
      <Tabs.Screen
        name="ManageService"
        options={{
          title: 'My Services',
          tabBarIcon: ({ color, focused }) =>
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={26} color={color} />,
          href: role === 'creator' ? undefined : null
        }}
      />

      {/* For Regular Users: Show search icon that goes to search */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) =>
            <Ionicons name={focused ? "search" : "search-outline"} size={26} color={color} />,
          href: (role === 'creator' || role === 'admin') ? null : undefined
        }}
      />

      <Tabs.Screen
        name="create_placeholder"
        options={{
          title: '',
          ...(role === 'admin'
            ? { href: null as any }
            : {
                tabBarButton: () => (
                  <Pressable
                    style={styles.plusContainer}
                    onPress={() => {
                      if (role === 'creator') {
                        router.push('/add-service');
                      } else {
                        router.push('/smart-match/match');
                      }
                    }}
                  >
                    <CenterButton />
                  </Pressable>
                )
              }
          )
        }}
        listeners={() => ({ tabPress: (e) => { (e as any).preventDefault(); }, })}
      />

      <Tabs.Screen
        name="message"
        options={{
          title: 'Message',
          href: role === 'admin' ? null : undefined,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.danger,
            fontSize: 10,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            lineHeight: 16
          },
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "chatbox-ellipses" : "chatbox-ellipses-outline"} size={26} color={color} />
        }}
      />

      {/* ORDERS TAB */}
      <Tabs.Screen
        name="order"
        options={{
          title: 'Orders',
          href: role === 'admin' ? null : undefined,
          tabBarBadge: unseenOrderCount > 0 ? unseenOrderCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.danger,
            fontSize: 10,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            lineHeight: 16
          },
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "clipboard" : "clipboard-outline"} size={26} color={color} />
        }}
        listeners={() => ({
          tabPress: (_e) => {
            handleOrderPress();
          },
        })}
      />

      {/* Hidden Routes */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="AnalyticsScreen" options={{ href: null }} />
      <Tabs.Screen name="AdminDashboardScreen" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusContainer: { top: -20, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    ...Shadows.xl,
  }
});

