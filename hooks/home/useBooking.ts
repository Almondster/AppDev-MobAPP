import { Alert } from 'react-native';
import { supabase } from '../../frontend/store';

export const handleBookService = async (
  service: any,
  user: any,
  blockedIds: string[],
  callbacks: {
    onBlocked: () => void;
    onDuplicate: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
  }
) => {
  if (!user) {
    Alert.alert("Login Required", "You must be logged in to book a service.");
    return;
  }
  
  if (blockedIds.includes(service.creator_id)) {
    callbacks.onBlocked();
    return;
  }

  try {
    const { data: existingOrders, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('client_id', user.uid)
      .eq('creator_id', service.creator_id)
      .eq('service_title', service.title)
      .in('status', ['pending', 'accepted', 'in_progress', 'delivered', 'active']);

    if (checkError) throw checkError;

    if (existingOrders && existingOrders.length > 0) {
      callbacks.onDuplicate();
      return;
    }

    const { data: clientData } = await supabase
      .from('users')
      .select('full_name')
      .eq('firebase_uid', user.uid)
      .single();

    const { error } = await supabase
      .from('orders')
      .insert({
        client_id: user.uid,
        creator_id: service.creator_id,
        service_title: service.title,
        price: service.price,
        status: 'pending',
        client_name: clientData?.full_name || 'Client',
        creator_name: service.creator?.full_name || 'Creator',
        image_url: service.image_url,
        last_updated_by: user.uid, 
        updated_at: new Date().toISOString() 
      });

    if (error) throw error;

    callbacks.onSuccess();

  } catch (err: any) {
    callbacks.onError(err.message);
  }
};

export const isBlocked = (uid: string, blockedIds: string[]) => blockedIds.includes(uid);
