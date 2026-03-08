import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { onAuthStateChanged } from '@/frontend/session';
import { useEffect } from 'react';

export function useUserSync() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // CHECK: Is this a Social Login (Google/GitHub) OR is the Email Verified?
        const isSocial = firebaseUser.providerData.some(
            (p) => p.providerId === 'google.com' || p.providerId === 'github.com'
        );
        const isVerified = firebaseUser.emailVerified;

        // Only sync if they are verified OR using a trusted social provider
        if (isVerified || isSocial) {
            try {
            // 1. Check if user exists in Supabase
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('firebase_uid', firebaseUser.uid)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                console.error('Error checking user:', error);
            }

            // 2. If they don't exist, create them
            if (!data) {
                const { error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                    firebase_uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    full_name: firebaseUser.displayName,
                    avatar_url: firebaseUser.photoURL,
                    role: 'client' // Default role
                    }
                ]);
                
                if (insertError) console.error('Error creating user:', insertError);
                else console.log('User synced to Supabase!');
            }
            } catch (err) {
                console.error('Sync failed:', err);
            }
        }
      }
    });

    return unsubscribe;
  }, []);
}

