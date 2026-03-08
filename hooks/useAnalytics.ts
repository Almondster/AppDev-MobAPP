import { getAuth } from '@/frontend/session';
import { supabase } from '../frontend/store';

export const useAnalytics = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  /**
   * Tracks a profile view.
   * Only increments if the viewer is NOT the creator themselves.
   */
  const trackProfileView = async (creatorId: string) => {
    // 1. If no user logged in, or user is viewing their own profile, DO NOT COUNT.
    if (!currentUser || currentUser.uid === creatorId) {
      console.log(`👁️ View NOT tracked - ${!currentUser ? 'no user' : 'own profile'}`);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('increment_analytic', {
        target_creator_id: creatorId,
        metric_type: 'view'
      });
      
      if (error) {
        console.error('❌ Failed to track view:', error);
      } else {
        console.log(`✅ View tracked for creator ${creatorId}`);
      }
    } catch (error) {
      console.error('❌ Exception tracking view:', error);
    }
  };

  /**
   * Tracks a service click.
   * Only increments if the clicker is NOT the creator themselves.
   */
  const trackServiceClick = async (creatorId: string) => {
    // 1. If no user logged in, or creator clicked their own service, DO NOT COUNT.
    if (!currentUser || currentUser.uid === creatorId) {
      console.log(`🖱️ Click NOT tracked - ${!currentUser ? 'no user' : 'own service'}`);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('increment_analytic', {
        target_creator_id: creatorId,
        metric_type: 'click'
      });
      
      if (error) {
        console.error('❌ Failed to track click:', error);
      } else {
        console.log(`✅ Click tracked for creator ${creatorId}`);
      }
    } catch (error) {
      console.error('❌ Exception tracking click:', error);
    }
  };

  return { trackProfileView, trackServiceClick };
};

