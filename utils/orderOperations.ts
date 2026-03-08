/**
 * Order Operations
 * Database operations for deadline, escrow, and timeline management
 */

import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import { calculateExtendedDeadline, calculateInitialDueDate } from './deadlineCalculations';

interface ExtensionRequestResult {
  success: boolean;
  error?: string;
}

interface RefundRequestResult {
  success: boolean;
  error?: string;
}

/**
 * Request a deadline extension for an order (CREATOR ONLY)
 * Creators request more time, clients approve or reject.
 * Supports days, hours, and minutes for precise extensions.
 */
export const requestDeadlineExtension = async (
  orderId: string,
  extensionDays: number,
  extensionHours: number = 0,
  extensionMinutes: number = 0,
  reason: string
): Promise<ExtensionRequestResult> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get current order data
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('due_date, creator_id, client_id, status, deadline_extension_requested_at, deadline_extension_approved')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Validate: Only the CREATOR can request extensions
    if (userId !== order.creator_id) {
      console.error('Only creator can request extension. User:', userId, 'Creator:', order.creator_id);
      return { success: false, error: 'Only the creator can request an extension' };
    }

    // Validate: Order must be in progress
    if (order.status !== 'in_progress') {
      return { success: false, error: 'Can only request extension for in-progress orders' };
    }

    // Validate: Can't request if there's already a pending request
    if (order.deadline_extension_requested_at && order.deadline_extension_approved === null) {
      return { success: false, error: 'Extension request already pending' };
    }

    // Creators can request again even if previously rejected (removed restriction)

    // Calculate new deadline with hours and minutes
    const newDeadline = calculateExtendedDeadline(order.due_date, extensionDays, extensionHours, extensionMinutes);

    // Convert total extension to minutes for storage (database uses integer)
    // We'll store total minutes in deadline_extension_days column (misnamed but works)
    const totalMinutes = (extensionDays * 1440) + (extensionHours * 60) + extensionMinutes;

    // Update order with extension request
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        deadline_extension_days: totalMinutes, // Store as total minutes (integer)
        deadline_extension_requested_at: new Date().toISOString(),
        deadline_extension_approved: null, // Reset to null for new request
        deadline_extension_reason: reason,
        last_updated_by: userId, // Creator updated it, so client gets notified
      })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log timeline event
    await logOrderEvent(orderId, 'extension_requested', userId, {
      days: extensionDays,
      hours: extensionHours,
      minutes: extensionMinutes,
      total_minutes: totalMinutes,
      reason,
      new_deadline: newDeadline,
    });

    // Client will be notified via OrderContext (checks last_updated_by !== client_id)

    return { success: true };
  } catch (error) {
    console.error('Error requesting extension:', error);
    return { success: false, error: 'Failed to request extension' };
  }
};

/**
 * Approve or reject a deadline extension request (CLIENT ONLY)
 * Creators request extensions, clients approve or reject them.
 */
export const reviewExtensionRequest = async (
  orderId: string,
  approved: boolean,
  creatorNote?: string
): Promise<ExtensionRequestResult> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get current order data
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('due_date, deadline_extension_days, client_id, creator_id, deadline_extension_requested_at, deadline_extension_approved')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Validate: Only the CLIENT can review extension requests
    if (userId !== order.client_id) {
      console.error('Only client can review extension requests. User:', userId, 'Client:', order.client_id);
      return { success: false, error: 'Only the client can review extension requests' };
    }

    // Validate: Must have a pending extension request
    if (!order.deadline_extension_requested_at) {
      return { success: false, error: 'No extension request found' };
    }

    // Validate: Can't review if already reviewed
    if (order.deadline_extension_approved !== null) {
      return { success: false, error: 'Extension request already reviewed' };
    }

    if (approved && order.deadline_extension_days) {
      // Approve - update deadline
      // Extension is stored as total minutes in deadline_extension_days (integer)
      const totalMinutes = order.deadline_extension_days;
      const days = Math.floor(totalMinutes / 1440);
      const remainingMinutes = totalMinutes % 1440;
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;

      const newDeadline = calculateExtendedDeadline(order.due_date, days, hours, minutes);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          due_date: newDeadline,
          deadline_extension_approved: true,
          deadline_passed: false,
          // Clear refund request state when extension is approved
          // Client approving extension = giving creator more time, refund request is void
          refund_requested_at: null,
          refund_responded_at: null,
          refund_approved: null,
          last_updated_by: userId, // Client updated it, so creator gets notified
        })
        .eq('id', orderId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await logOrderEvent(orderId, 'extension_approved', userId, {
        days: days,
        hours: hours,
        minutes: minutes,
        total_minutes: totalMinutes,
        new_deadline: newDeadline,
        note: creatorNote,
      });

      // Creator will be notified via OrderContext
    } else {
      // Reject - clear extension request
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          deadline_extension_approved: false,
          last_updated_by: userId, // Client updated it, so creator gets notified
        })
        .eq('id', orderId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await logOrderEvent(orderId, 'extension_rejected', userId, {
        note: creatorNote,
      });

      // Creator will be notified via OrderContext
    }

    return { success: true };
  } catch (error) {
    console.error('Error reviewing extension:', error);
    return { success: false, error: 'Failed to review extension request' };
  }
};

/**
 * Request a refund for an order
 */
export const requestRefund = async (orderId: string, reason: string): Promise<RefundRequestResult> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if this is a second refund request (after creator denied first one)
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('refund_approved, refund_responded_at, escrow_amount, client_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Second refund request (after denial) → Auto-process immediately
    if (order.refund_approved === false && order.refund_responded_at) {
      // Check if 24h have passed since denial
      const now = new Date();
      const deniedAt = new Date(order.refund_responded_at);
      const hoursSinceDenial = (now.getTime() - deniedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceDenial >= 24) {
        // Auto-process second refund immediately
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            refund_requested_at: new Date().toISOString(),
            refund_approved: true,
            refund_responded_at: new Date().toISOString(),
            escrow_status: 'refunded_to_client',
            status: 'refunded',
            last_updated_by: userId,
          })
          .eq('id', orderId);

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        await logOrderEvent(orderId, 'refund_auto_processed', userId, {
          amount: order.escrow_amount,
          reason: 'Second refund request - auto-processed (24h passed since denial without delivery)',
        });

        // Process refund to client's wallet (Direct Update)
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('id, balance')
          .eq('user_id', order.client_id)
          .eq('wallet_type', 'Createch Wallet')
          .single();

        if (wallet) {
          const newBalance = (wallet.balance || 0) + order.escrow_amount;
          const { error: walletError } = await supabase
            .from('user_wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id);

          if (walletError) console.error('Error updating wallet balance:', walletError);
        } else {
          // Create new wallet if not exists
          const { error: createError } = await supabase
            .from('user_wallets')
            .insert({
              user_id: order.client_id,
              wallet_type: 'Createch Wallet',
              balance: order.escrow_amount,
              is_active: true,
              account_name: 'Createch Balance',
              account_number: `WALLET-${order.client_id.substring(0, 8).toUpperCase()}`
            });

          if (createError) console.error('Error creating wallet:', createError);
        }

        return { success: true };
      } else {
        return {
          success: false,
          error: `Please wait ${Math.ceil(24 - hoursSinceDenial)} more hours before requesting another refund`
        };
      }
    }

    // First refund request - normal flow
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        refund_requested_at: new Date().toISOString(),
        refund_approved: null,
        refund_responded_at: null, // Reset response timestamp for new request
        last_updated_by: userId, // Client updated it, so creator gets notified
      })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log timeline event
    await logOrderEvent(orderId, 'refund_requested', userId, {
      reason,
    });

    // TODO: Send notification to creator (24h to deliver)
    // TODO: Set up automated refund after 24h if no delivery

    return { success: true };
  } catch (error) {
    console.error('Error requesting refund:', error);
    return { success: false, error: 'Failed to request refund' };
  }
};

/**
 * Creator responds to refund request (approve or deny)
 */
export const respondToRefund = async (
  orderId: string,
  approve: boolean,
  response: string
): Promise<RefundRequestResult> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get order to validate creator ownership and check refund request time
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('creator_id, escrow_amount, client_id, refund_requested_at, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    if (userId !== order.creator_id) {
      return { success: false, error: 'Only creator can respond to refund requests' };
    }

    const now = new Date().toISOString();

    if (approve) {
      // Creator accepts refund - process it immediately
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          refund_approved: true,
          refund_responded_at: now,
          escrow_status: 'refunded_to_client',
          status: 'refunded',
          last_updated_by: userId,
        })
        .eq('id', orderId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Log approval
      await logOrderEvent(orderId, 'refund_approved', userId, {
        amount: order.escrow_amount,
        creator_response: response,
      });

      // Process refund to client's wallet (Direct Update)
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('id, balance')
        .eq('user_id', order.client_id)
        .eq('wallet_type', 'Createch Wallet')
        .single();

      if (wallet) {
        const newBalance = (wallet.balance || 0) + order.escrow_amount;
        const { error: walletError } = await supabase
          .from('user_wallets')
          .update({ balance: newBalance })
          .eq('id', wallet.id);

        if (walletError) console.error('Error updating wallet balance:', walletError);
      } else {
        // Create new wallet if not exists
        const { error: createError } = await supabase
          .from('user_wallets')
          .insert({
            user_id: order.client_id,
            wallet_type: 'Createch Wallet',
            balance: order.escrow_amount,
            is_active: true,
            account_name: 'Createch Balance',
            account_number: `WALLET-${order.client_id.substring(0, 8).toUpperCase()}`
          });

        if (createError) console.error('Error creating wallet:', createError);
      }
    } else {
      // Creator denies refund - they have 24h from NOW to deliver
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          refund_approved: false,
          refund_responded_at: now, // Track when they denied (24h window starts here)
          last_updated_by: userId,
        })
        .eq('id', orderId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Log denial
      await logOrderEvent(orderId, 'refund_denied', userId, {
        creator_response: response,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error responding to refund:', error);
    return { success: false, error: 'Failed to respond to refund request' };
  }
};

/**
 * Check and auto-process refunds for orders where:
 * - Client requested refund
 * - Creator didn't respond OR denied but didn't deliver
 * - 24 hours have passed since creator's response (or original request if no response)
 * - No work was delivered (status still 'in_progress')
 * 
 * Call this function periodically (e.g., when user opens order screen)
 */
export const checkAndProcessOverdueRefunds = async (): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find orders with refund requests that need auto-processing
    const { data: ordersWithRefundRequests, error } = await supabase
      .from('orders')
      .select('id, escrow_amount, refund_requested_at, refund_responded_at, refund_approved, status, client_id, creator_id, preview_url, final_file_url, delivery_url')
      .or(`client_id.eq.${userId},creator_id.eq.${userId}`) // Only check user's orders
      .eq('status', 'in_progress') // Only in-progress orders (not delivered/completed)
      .not('refund_requested_at', 'is', null); // Has refund request

    if (error || !ordersWithRefundRequests || ordersWithRefundRequests.length === 0) {
      return;
    }

    // Process each order
    for (const order of ordersWithRefundRequests) {
      // Skip if already approved (processed)
      if (order.refund_approved === true) continue;

      // Check if work was delivered (preview, final file, or delivery URL)
      const workDelivered = !!(order.preview_url || order.final_file_url || order.delivery_url);
      if (workDelivered) {
        // Work was delivered, no auto-refund
        continue;
      }

      // Determine which timestamp to use for 24h calculation
      let deadlineTimestamp: Date;

      if (order.refund_responded_at) {
        // Creator responded (approved or denied) - use response time
        deadlineTimestamp = new Date(order.refund_responded_at);
      } else {
        // Creator never responded - use original request time
        deadlineTimestamp = new Date(order.refund_requested_at);
      }

      // Check if 24h have passed
      if (deadlineTimestamp.getTime() > twentyFourHoursAgo.getTime()) {
        // Not yet 24h, skip
        continue;
      }

      // Auto-process refund
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          refund_approved: true,
          escrow_status: 'refunded_to_client',
          status: 'refunded',
          last_updated_by: 'system',
        })
        .eq('id', order.id);

      if (!updateError) {
        const reason = order.refund_approved === false
          ? '24h passed since creator denied refund without delivering work'
          : '24h passed without creator response to refund request';

        await logOrderEvent(order.id, 'refund_auto_processed', 'system', {
          amount: order.escrow_amount,
          reason,
        });

        console.log(`Auto-processed refund for order ${order.id}: ${reason}`);

        // Process refund to client's wallet (Direct Update)
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('id, balance')
          .eq('user_id', order.client_id)
          .eq('wallet_type', 'Createch Wallet')
          .single();

        if (wallet) {
          const newBalance = (wallet.balance || 0) + order.escrow_amount;
          const { error: walletError } = await supabase
            .from('user_wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id);

          if (walletError) console.error('Error updating wallet balance:', walletError);
        } else {
          // Create new wallet if not exists
          const { error: createError } = await supabase
            .from('user_wallets')
            .insert({
              user_id: order.client_id,
              wallet_type: 'Createch Wallet',
              balance: order.escrow_amount,
              is_active: true,
              account_name: 'Createch Balance',
              account_number: `WALLET-${order.client_id.substring(0, 8).toUpperCase()}`
            });

          if (createError) console.error('Error creating wallet:', createError);
        }
      }
    }
  } catch (error) {
    console.error('Error checking overdue refunds:', error);
  }
};

/**
 * Process a refund (admin/automated function)
 */
export const processRefund = async (orderId: string, adminNote?: string): Promise<RefundRequestResult> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get order data
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('escrow_amount, client_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        refund_approved: true,
        escrow_status: 'refunded_to_client',
        status: 'cancelled',
        last_updated_by: userId, // System/admin updated it
      })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Process refund to client's wallet (Direct Update)
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('id, balance')
      .eq('user_id', order.client_id)
      .eq('wallet_type', 'Createch Wallet')
      .single();

    if (wallet) {
      const newBalance = (wallet.balance || 0) + order.escrow_amount;
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (walletError) console.error('Error updating wallet balance:', walletError);
    } else {
      // Create new wallet if not exists
      const { error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: order.client_id,
          wallet_type: 'Createch Wallet',
          balance: order.escrow_amount,
          is_active: true,
          account_name: 'Createch Balance',
          account_number: `WALLET-${order.client_id.substring(0, 8).toUpperCase()}`
        });

      if (createError) console.error('Error creating wallet:', createError);
    }

    // Log timeline event
    await logOrderEvent(orderId, 'refund_approved', userId, {
      amount: order.escrow_amount,
      note: adminNote,
    });

    // TODO: Send notifications to both client and creator

    return { success: true };
  } catch (error) {
    console.error('Error processing refund:', error);
    return { success: false, error: 'Failed to process refund' };
  }
};

/**
 * Set initial due date when order is accepted
 */
export const setInitialDueDate = async (orderId: string, estimatedDays: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const dueDate = calculateInitialDueDate(estimatedDays);

    const { error } = await supabase
      .from('orders')
      .update({
        due_date: dueDate,
        work_started_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    const userId = auth.currentUser?.uid;
    if (userId) {
      await logOrderEvent(orderId, 'work_started', userId, {
        due_date: dueDate,
        estimated_days: estimatedDays,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting due date:', error);
    return { success: false, error: 'Failed to set due date' };
  }
};

/**
 * Release escrow to creator upon delivery approval
 */
export const releaseEscrow = async (orderId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get order data
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('escrow_amount, creator_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        escrow_status: 'released_to_creator',
        status: 'completed',
      })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // TODO: Transfer funds to creator's wallet
    // This would depend on your payment system implementation

    // Log timeline event
    await logOrderEvent(orderId, 'completed', userId, {
      amount: order.escrow_amount,
    });

    // TODO: Send notifications

    return { success: true };
  } catch (error) {
    console.error('Error releasing escrow:', error);
    return { success: false, error: 'Failed to release escrow' };
  }
};

/**
 * Log an event to the order timeline
 */
export const logOrderEvent = async (
  orderId: string,
  eventType: string,
  actorId: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    // Generate message based on event type
    const message = generateEventMessage(eventType, metadata);

    await supabase.from('order_timeline').insert({
      order_id: orderId,
      event_type: eventType,
      actor_id: actorId,
      message,
      metadata,
    });
  } catch (error) {
    console.error('Error logging event:', error);
  }
};

/**
 * Generate human-readable message for timeline events
 */
const generateEventMessage = (eventType: string, metadata?: Record<string, any>): string => {
  switch (eventType) {
    case 'created':
      return 'Order created';
    case 'accepted':
      return 'Order accepted by creator';
    case 'payment_made':
      return 'Payment secured in escrow';
    case 'work_started':
      return `Work started. Due date: ${metadata?.due_date ? new Date(metadata.due_date).toLocaleDateString() : 'N/A'}`;
    case 'preview_uploaded':
      return 'Preview uploaded';
    case 'delivered':
      return 'Work delivered';
    case 'deadline_warning':
      return `Deadline approaching (${metadata?.hours_left}h remaining)`;
    case 'deadline_passed':
      return 'Deadline has passed';
    case 'extension_requested':
      // Build time string from metadata
      let timeStr = '';
      if (metadata?.days) timeStr += `${metadata.days}d `;
      if (metadata?.hours) timeStr += `${metadata.hours}h `;
      if (metadata?.minutes) timeStr += `${metadata.minutes}m`;
      return `Extension requested: +${timeStr.trim() || '0m'}`;
    case 'extension_approved':
      // Build time string from metadata or total_minutes
      let approvedTimeStr = '';
      if (metadata?.days) approvedTimeStr += `${metadata.days}d `;
      if (metadata?.hours) approvedTimeStr += `${metadata.hours}h `;
      if (metadata?.minutes) approvedTimeStr += `${metadata.minutes}m`;
      // Fallback to calculating from days field if individual fields not available
      if (!approvedTimeStr && metadata?.days) {
        const totalMinutes = metadata.days;
        const d = Math.floor(totalMinutes / 1440);
        const remainingMin = totalMinutes % 1440;
        const h = Math.floor(remainingMin / 60);
        const m = remainingMin % 60;
        if (d > 0) approvedTimeStr += `${d}d `;
        if (h > 0) approvedTimeStr += `${h}h `;
        if (m > 0) approvedTimeStr += `${m}m`;
      }
      return `Extension approved: +${approvedTimeStr.trim() || '0m'}`;
    case 'extension_rejected':
      return 'Extension request rejected';
    case 'refund_requested':
      return 'Refund requested by client';
    case 'refund_approved':
      return 'Refund processed';
    case 'refund_denied':
      return 'Refund request denied by creator';
    case 'refund_auto_processed':
      return 'Refund automatically processed (24h passed without delivery)';
    case 'completed':
      return 'Order completed';
    case 'cancelled':
      return 'Order cancelled';
    default:
      return eventType;
  }
};

/**
 * Create a deadline notification record
 */
export const createDeadlineNotification = async (
  orderId: string,
  notificationType: '24h_warning' | '3h_warning' | 'deadline_passed' | 'extension_approved',
  userId: string
): Promise<void> => {
  try {
    await supabase.from('deadline_notifications').insert({
      order_id: orderId,
      notification_type: notificationType,
      user_id: userId,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

