import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { onAuthStateChanged, User } from '@/frontend/session';
import React, { createContext, useContext, useEffect, useState } from 'react';

// New type for detailed notifications
type UnreadMessage = {
  id: number;
  sender_id: string;
  content: string;
  media_url?: string | null;
  created_at: string;
  sender_name?: string; 
  sender_avatar?: string;
};

type UnreadContextType = {
  unreadCount: number;
  unreadMessages: UnreadMessage[];
  refreshUnreadCount: () => void;
  markAllAsRead: () => Promise<void>;
};

const UnreadContext = createContext<UnreadContextType>({
  unreadCount: 0,
  unreadMessages: [],
  refreshUnreadCount: () => {},
  markAllAsRead: async () => {},
});

export const useUnread = () => useContext(UnreadContext);

export const UnreadProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const fetchUnread = async () => {
    if (!user) return;

    // 1. Get unread messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, sender_id, content, media_url, created_at')
      .eq('receiver_id', user.uid)
      .eq('is_read', false)
      .eq('is_deleted', false) // Don't count deleted
      .order('created_at', { ascending: false });
    
    if (!error && messages) {
      // 2. Aggregate counts (don't spam user with 50 notifications from 1 person)
      // Actually, for the Bell "List", we might want the latest message per user.
      
      // Let's fetch sender details
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: users } = await supabase
        .from('users')
        .select('firebase_uid, full_name, avatar_url')
        .in('firebase_uid', senderIds);

      const enrichedMessages = messages.map(msg => {
        const sender = users?.find(u => u.firebase_uid === msg.sender_id);
        return {
          ...msg,
          sender_name: sender?.full_name || 'User',
          sender_avatar: sender?.avatar_url
        };
      });

      setUnreadMessages(enrichedMessages);
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadMessages([]);
      return;
    }

    let isMounted = true;
    let channel: any = null;

    const setupSubscription = async () => {
      // Initial fetch
      if (isMounted) {
        await fetchUnread();
      }

      // Setup realtime subscription
      channel = supabase
        .channel(`unread-messages-${user.uid}`)
        .on(
          'postgres_changes',
          {
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${user.uid}`,
          },
          () => {
            if (isMounted) {
              fetchUnread();
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || unreadMessages.length === 0) return;
    const ids = unreadMessages.map(m => m.id);
    await supabase.from('messages').update({ is_read: true }).in('id', ids);
    setUnreadMessages([]);
  };

  return (
    <UnreadContext.Provider value={{ 
        unreadCount: unreadMessages.length, 
        unreadMessages, 
        refreshUnreadCount: fetchUnread,
        markAllAsRead 
    }}>
      {children}
    </UnreadContext.Provider>
  );
};

