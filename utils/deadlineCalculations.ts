/**
 * Deadline Calculation Utilities
 * Pure functions for date math and deadline management
 */

export type TimeRemaining = {
  expired: boolean;
  text: string;
  hours: number;
  minutes: number;
  days: number;
  totalMinutes: number;
};

/**
 * Calculate time remaining until a deadline
 */
export const getTimeRemaining = (dueDate: string | null | undefined): TimeRemaining => {
  if (!dueDate) {
    return { expired: false, text: 'No deadline', hours: 0, minutes: 0, days: 0, totalMinutes: 0 };
  }

  const now = new Date();
  const deadline = new Date(dueDate);
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) {
    const overdue = Math.abs(diff);
    const overdueHours = Math.floor(overdue / (1000 * 60 * 60));
    const overdueDays = Math.floor(overdueHours / 24);
    
    if (overdueDays > 0) {
      return { expired: true, text: `${overdueDays}d overdue`, hours: 0, minutes: 0, days: 0, totalMinutes: 0 };
    }
    return { expired: true, text: `${overdueHours}h overdue`, hours: 0, minutes: 0, days: 0, totalMinutes: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const totalMinutes = Math.floor(diff / (1000 * 60));
  
  if (days > 0) {
    return { expired: false, text: `${days}d ${hours}h left`, hours: days * 24 + hours, minutes, days, totalMinutes };
  }
  if (hours > 0) {
    return { expired: false, text: `${hours}h ${minutes}m left`, hours, minutes, days: 0, totalMinutes };
  }
  return { expired: false, text: `${minutes}m left`, hours: 0, minutes, days: 0, totalMinutes };
};

/**
 * Check if deadline is approaching (within 24 hours)
 */
export const isDeadlineNear = (dueDate: string | null | undefined): boolean => {
  if (!dueDate) return false;
  const timeLeft = getTimeRemaining(dueDate);
  return !timeLeft.expired && timeLeft.hours < 24 && timeLeft.hours >= 0;
};

/**
 * Check if deadline is critical (within 3 hours)
 */
export const isDeadlineCritical = (dueDate: string | null | undefined): boolean => {
  if (!dueDate) return false;
  const timeLeft = getTimeRemaining(dueDate);
  return !timeLeft.expired && timeLeft.hours < 3 && timeLeft.hours >= 0;
};

/**
 * Check if deadline has passed
 */
export const isDeadlinePassed = (dueDate: string | null | undefined): boolean => {
  if (!dueDate) return false;
  return getTimeRemaining(dueDate).expired;
};

/**
 * Format deadline for display
 */
export const formatDeadline = (dueDate: string | null | undefined): string => {
  if (!dueDate) return 'No deadline set';
  
  const date = new Date(dueDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === date.toDateString();
  
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateStr} at ${timeStr}`;
};

/**
 * Calculate new due date after extension
 * Supports days, hours, and minutes
 */
export const calculateExtendedDeadline = (
  originalDate: string,
  extensionDays: number,
  extensionHours: number = 0,
  extensionMinutes: number = 0
): string => {
  const date = new Date(originalDate);
  date.setDate(date.getDate() + extensionDays);
  date.setHours(date.getHours() + extensionHours);
  date.setMinutes(date.getMinutes() + extensionMinutes);
  return date.toISOString();
};

/**
 * Calculate initial due date from estimated completion time
 * Supports days, hours, and minutes
 */
export const calculateInitialDueDate = (
  estimatedDays: number,
  estimatedHours: number = 0,
  estimatedMinutes: number = 0,
  startDate?: Date
): string => {
  const start = startDate || new Date();
  const dueDate = new Date(start);
  dueDate.setDate(dueDate.getDate() + estimatedDays);
  dueDate.setHours(dueDate.getHours() + estimatedHours);
  dueDate.setMinutes(dueDate.getMinutes() + estimatedMinutes);
  return dueDate.toISOString();
};

/**
 * Get deadline urgency level
 */
export const getDeadlineUrgency = (dueDate: string | null | undefined): 'safe' | 'warning' | 'critical' | 'overdue' => {
  if (!dueDate) return 'safe';
  
  const timeLeft = getTimeRemaining(dueDate);
  
  if (timeLeft.expired) return 'overdue';
  if (timeLeft.hours < 3) return 'critical';
  if (timeLeft.hours < 24) return 'warning';
  return 'safe';
};

/**
 * Get color for deadline urgency
 */
export const getDeadlineColor = (urgency: 'safe' | 'warning' | 'critical' | 'overdue'): string => {
  switch (urgency) {
    case 'overdue': return '#EF4444'; // red
    case 'critical': return '#F59E0B'; // orange
    case 'warning': return '#F59E0B'; // orange
    case 'safe': return '#10B981'; // green
  }
};
