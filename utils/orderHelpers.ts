/**
 * Order Helper Utilities
 * Business logic and permission checks for order management
 */

export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'refunded' | 'cancelled' | 'rejected';
export type EscrowStatus = 'pending' | 'held' | 'released_to_creator' | 'refunded_to_client';

export interface EnhancedOrder {
  id: number;
  service_title: string;
  price: string;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  client_id: string;
  creator_id: string;
  client_name?: string;
  creator_name?: string;
  preview_url?: string;
  final_file_url?: string;
  delivery_url?: string;
  // Deadline fields
  due_date?: string;
  deadline_extension_days?: number;
  deadline_extension_requested_at?: string;
  deadline_extension_approved?: boolean;
  deadline_passed?: boolean;
  estimated_completion_days?: number;
  work_started_at?: string;
  // Escrow fields
  escrow_status?: EscrowStatus;
  escrow_amount?: number;
  refund_requested_at?: string;
  refund_responded_at?: string;
  refund_approved?: boolean;
  // Other fields
  payment_method_used?: string;
  image_url?: string;
  last_updated_by?: string;
}

/**
 * Check if CREATOR can request deadline extension
 * Button should ALWAYS show if order is in progress, EXCEPT:
 * 1. There's a pending request (waiting for client response)
 * 2. Client already approved an extension once (only one extension allowed per order)
 */
export const canRequestExtension = (order: EnhancedOrder, userRole: 'client' | 'creator'): boolean => {
  // Only creators can request extensions (they need more time to complete work)
  if (userRole !== 'creator') return false;
  
  // Must be in progress - this is the main requirement
  if (order.status !== 'in_progress') return false;
  
  // Must have a due date set
  if (!order.due_date) return false;
  
  // Can't request if there's already a pending request (waiting for client to approve/reject)
  if (order.deadline_extension_requested_at && order.deadline_extension_approved === null) {
    return false;
  }
  
  // Can't request if client already APPROVED an extension (only one extension allowed)
  if (order.deadline_extension_approved === true) {
    return false;
  }
  
  // CAN request again if previously rejected - creators get unlimited retries until approved
  
  return true;
};

/**
 * Check if CLIENT can approve/reject extension request from CREATOR
 */
export const canReviewExtension = (order: EnhancedOrder, userRole: 'client' | 'creator'): boolean => {
  // Only CLIENTS can review extension requests (creators request, clients approve/deny)
  if (userRole !== 'client') return false;
  
  // Must have a pending extension request
  if (!order.deadline_extension_requested_at) return false;
  
  // Can't review if already approved or explicitly rejected
  if (order.deadline_extension_approved === true || order.deadline_extension_approved === false) {
    return false; // Already reviewed
  }
  
  return true;
};

/**
 * Check if client can request refund
 */
export const canRequestRefund = (order: EnhancedOrder, userRole: 'client' | 'creator'): boolean => {
  // Only clients can request refunds
  if (userRole !== 'client') return false;
  
  // Must have a due date
  if (!order.due_date) return false;
  
  // Check if deadline has actually passed (real-time calculation)
  const now = new Date();
  const deadline = new Date(order.due_date);
  if (now.getTime() <= deadline.getTime()) return false;
  
  // Can't refund if completed or cancelled
  if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'rejected' || order.status === 'refunded') {
    return false;
  }
  
  // Can't refund if creator has submitted work
  if (order.preview_url || order.final_file_url || order.delivery_url) {
    return false;
  }
  
  // Can request again if creator denied previous refund (refund_approved === false)
  // Can't request if there's a pending request (refund_approved === null)
  // Can't request if already approved/refunded (refund_approved === true)
  if (order.refund_requested_at) {
    if (order.refund_approved === null) {
      // Pending - can't request again
      return false;
    }
    if (order.refund_approved === true) {
      // Already approved - can't request again
      return false;
    }
    // If refund_approved === false, creator denied
    // Can request again ONLY if 24h have passed since denial
    if (order.refund_approved === false && order.refund_responded_at) {
      const now = new Date();
      const deniedAt = new Date(order.refund_responded_at);
      const hoursSinceDenial = (now.getTime() - deniedAt.getTime()) / (1000 * 60 * 60);
      
      // Must wait 24h before second request
      if (hoursSinceDenial < 24) {
        return false;
      }
      // If 24h passed, client CAN request again
    }
  }
  
  // Can't request if already refunded
  if (order.escrow_status === 'refunded_to_client') return false;
  
  // Escrow must be held
  if (order.escrow_status !== 'held') return false;
  
  return true;
};

/**
 * Check if order has active deadline
 */
export const hasActiveDeadline = (order: EnhancedOrder): boolean => {
  if (!order.due_date) return false;
  if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'rejected') {
    return false;
  }
  return true;
};

/**
 * Check if creator can deliver work
 */
export const canDeliver = (order: EnhancedOrder, userRole: 'client' | 'creator'): boolean => {
  if (userRole !== 'creator') return false;
  if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'rejected') {
    return false;
  }
  if (order.status === 'pending') return false; // Must be accepted first
  return true;
};

/**
 * Check if client can approve delivery
 */
export const canApproveDelivery = (order: EnhancedOrder, userRole: 'client' | 'creator'): boolean => {
  if (userRole !== 'client') return false;
  if (order.status !== 'delivered') return false;
  if (!order.final_file_url && !order.delivery_url) return false;
  return true;
};

/**
 * Get escrow status display text
 */
export const getEscrowStatusText = (status: EscrowStatus | undefined): string => {
  switch (status) {
    case 'pending': return 'Awaiting Payment';
    case 'held': return 'Payment Secured';
    case 'released_to_creator': return 'Payment Released';
    case 'refunded_to_client': return 'Refunded';
    default: return 'No Payment';
  }
};

/**
 * Get order status display text
 */
export const getOrderStatusText = (status: OrderStatus): string => {
  switch (status) {
    case 'pending': return 'Pending Approval';
    case 'accepted': return 'Awaiting Payment';
    case 'in_progress': return 'In Progress';
    case 'delivered': return 'Delivered';
    case 'completed': return 'Completed';
    case 'refunded': return 'Refunded';
    case 'cancelled': return 'Cancelled';
    case 'rejected': return 'Rejected';
  }
};

/**
 * Get status color
 */
export const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'pending': return '#F59E0B'; // orange
    case 'accepted': return '#3B82F6'; // blue
    case 'in_progress': return '#8B5CF6'; // purple
    case 'delivered': return '#10B981'; // green
    case 'completed': return '#10B981'; // green
    case 'refunded': return '#3B82F6'; // blue (refund processed)
    case 'cancelled': return '#6B7280'; // gray
    case 'rejected': return '#EF4444'; // red
  }
};

/**
 * Check if order needs client action
 */
export const needsClientAction = (order: EnhancedOrder): boolean => {
  // Needs payment
  if (order.status === 'accepted' && order.escrow_status !== 'held') return true;
  
  // Needs delivery approval
  if (order.status === 'delivered') return true;
  
  // Has extension request to review (this would be for creator actually)
  // if (order.deadline_extension_requested_at && !order.deadline_extension_approved) return true;
  
  return false;
};

/**
 * Check if order needs creator action
 */
export const needsCreatorAction = (order: EnhancedOrder): boolean => {
  // Needs acceptance/rejection
  if (order.status === 'pending') return true;
  
  // Needs delivery
  if (order.status === 'in_progress' && !order.delivery_url && !order.final_file_url) return true;
  
  // Has extension request to review
  if (order.deadline_extension_requested_at && order.deadline_extension_approved === null) return true;
  
  // Refund requested - urgent action needed
  if (order.refund_requested_at && !order.refund_approved) return true;
  
  return false;
};

/**
 * Validate extension request
 */
export const validateExtensionDays = (days: string): { valid: boolean; error?: string; value?: number } => {
  const numDays = parseInt(days, 10);
  
  if (isNaN(numDays)) {
    return { valid: false, error: 'Please enter a valid number' };
  }
  
  if (numDays < 1) {
    return { valid: false, error: 'Extension must be at least 1 day' };
  }
  
  if (numDays > 30) {
    return { valid: false, error: 'Extension cannot exceed 30 days' };
  }
  
  return { valid: true, value: numDays };
};

/**
 * Calculate escrow amount from price string
 */
export const calculateEscrowAmount = (price: string): number => {
  // Remove currency symbols and commas
  const cleanPrice = price.replace(/[₱$,]/g, '').trim();
  const amount = parseFloat(cleanPrice);
  return isNaN(amount) ? 0 : amount;
};
