import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from '@/frontend/session';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export type OrderNotification = {
  id: number;
  service_title: string;
  status: string;
  updated_at: string;
  last_updated_by: string;
  client_name?: string;
  creator_name?: string;
  client_id: string;
  creator_id: string;
  image_url?: string;
};

type OrderContextType = {
  unseenOrderCount: number;
  unseenOrders: OrderNotification[];
  lastSeenTime: string | null;
  markOrdersAsSeen: () => Promise<void>;
  refreshOrderCount: () => void;
};

const OrderContext = createContext<OrderContextType>({
  unseenOrderCount: 0,
  unseenOrders: [],
  lastSeenTime: null,
  markOrdersAsSeen: async () => {},
  refreshOrderCount: () => {},
});

export const useOrderUpdates = () => useContext(OrderContext);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unseenOrders, setUnseenOrders] = useState<OrderNotification[]>([]); 
  const [lastSeenTime, setLastSeenTime] = useState<string | null>(null);
  const [user, setUser] = useState(auth.currentUser);

  // 1. Load Last Seen Time
  const loadLastSeen = useCallback(async () => {
    try {
      const time = await AsyncStorage.getItem('orders_last_seen');
      // Default to 1970 if never seen, so all initial notifs show up
      setLastSeenTime(time || new Date(0).toISOString());
    } catch (error) {
      setLastSeenTime(new Date().toISOString());
    }
  }, []);

  // 2. Fetch Orders
  const fetchOrders = useCallback(async () => {
    if (!user || !lastSeenTime) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`client_id.eq.${user.uid},creator_id.eq.${user.uid}`)
        .gt('updated_at', lastSeenTime) 
        .order('updated_at', { ascending: false });

      if (!error && data) {
        const notifications = data.filter(order => {
            // Don't notify if user updated it themselves
            if (order.last_updated_by === user.uid) return false;
            // Don't notify about orders deleted by EITHER user (client or creator)
            if (order.deleted_by_client || order.deleted_by_creator) return false;
            return true;
        });

        // Update state if different
        setUnseenOrders(prev => {
            if (prev.length !== notifications.length) {
                console.log(`🔔 Notifications Updated: ${notifications.length} new`);
                return notifications;
            }
            return prev;
        });
      }
    } catch (err) {
      console.error('Error fetching unseen orders:', err);
    }
  }, [user, lastSeenTime]);

  // 3. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadLastSeen();
      } else {
        setUnseenOrders([]);
      }
    });
    return unsubscribe;
  }, []);

  // 4. Polling 
  useEffect(() => {
    if (user && lastSeenTime) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 3000);
      return () => clearInterval(interval);
    }
  }, [user, lastSeenTime, fetchOrders]);

  // 5. Realtime Subscription
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let channel: any = null;
    let appStateSubscription: any = null;

    const setupSubscription = async () => {
      console.log("🔌 Subscribing to Order Updates...");

      channel = supabase
        .channel('public:orders')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
          },
          () => {
            if (isMounted) {
              console.log('⚡ Realtime Triggered: Refetching...');
              fetchOrders();
            }
          }
        )
        .subscribe();

      appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && user && isMounted) {
          fetchOrders();
        }
      });
    };

    setupSubscription();

    return () => { 
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, [user, fetchOrders]);

  // 6. Mark As Seen
  const markOrdersAsSeen = useCallback(async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem('orders_last_seen', now);
    setLastSeenTime(now);
    setUnseenOrders([]); 
  }, []);

  return (
    <OrderContext.Provider value={{ 
      unseenOrderCount: unseenOrders.length,
      unseenOrders, 
      lastSeenTime, 
      markOrdersAsSeen, 
      refreshOrderCount: fetchOrders 
    }}>
      {children}
    </OrderContext.Provider>
  );
};

