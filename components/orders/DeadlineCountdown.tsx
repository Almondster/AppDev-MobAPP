/**
 * Deadline Countdown Component
 * Displays countdown timer with visual urgency indicators
 */

import { useTheme } from '@/context/ThemeContext';
import { getDeadlineColor, getDeadlineUrgency, getTimeRemaining } from '@/utils/deadlineCalculations';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DeadlineCountdownProps {
  dueDate: string | null | undefined;
  compact?: boolean;
  showIcon?: boolean;
}

export const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({ 
  dueDate, 
  compact = false,
  showIcon = true 
}) => {
  const { theme } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(dueDate));
  const [urgency, setUrgency] = useState(getDeadlineUrgency(dueDate));

  useEffect(() => {
    if (!dueDate) return;

    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(dueDate));
      setUrgency(getDeadlineUrgency(dueDate));
    }, 60000);

    return () => clearInterval(interval);
  }, [dueDate]);

  if (!dueDate) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Text style={[styles.text, { color: theme.textSecondary }]}>No deadline</Text>
      </View>
    );
  }

  const color = getDeadlineColor(urgency);
  const iconName = timeRemaining.expired ? 'alert-circle' : 
                   urgency === 'critical' ? 'warning' : 
                   urgency === 'warning' ? 'time' : 'checkmark-circle';

  return (
    <View style={[
      styles.container,
      compact && styles.compactContainer,
      { backgroundColor: color + '15', borderColor: color + '40' }
    ]}>
      {showIcon && (
        <Ionicons name={iconName} size={compact ? 14 : 16} color={color} />
      )}
      <Text style={[
        styles.text,
        compact && styles.compactText,
        { color }
      ]}>
        {timeRemaining.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  compactContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default DeadlineCountdown;
