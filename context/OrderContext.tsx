import { auth, onAuthStateChanged } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const loadLastSeen = useCallback(async () => {
    try {
      setLastSeenTime((await AsyncStorage.getItem('orders_last_seen')) || new Date(0).toISOString());
    } catch {
      setLastSeenTime(new Date().toISOString());
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!user || !lastSeenTime) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`client_id.eq.${user.uid},creator_id.eq.${user.uid}`)
        .gt('updated_at', lastSeenTime)
        .order('updated_at', { ascending: false });

      if (error || !data) return;

      const notifications = data.filter((order) => {
        if (order.last_updated_by === user.uid) return false;
        if (order.deleted_by_client || order.deleted_by_creator) return false;
        return true;
      });

      setUnseenOrders((prev) => (
        prev.length !== notifications.length ? notifications : prev
      ));
    } catch (err) {
      console.error('Error fetching unseen orders:', err);
    }
  }, [user, lastSeenTime]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadLastSeen();
      } else {
        setUnseenOrders([]);
        setLastSeenTime(null);
      }
    });
    return unsubscribe;
  }, [loadLastSeen]);

  useEffect(() => {
    if (user && lastSeenTime) fetchOrders();
  }, [user, lastSeenTime, fetchOrders]);

  useEffect(() => {
    if (!user) return;

    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') fetchOrders();
    });

    return () => appStateSubscription.remove();
  }, [user, fetchOrders]);

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
      refreshOrderCount: fetchOrders,
    }}>
      {children}
    </OrderContext.Provider>
  );
};
