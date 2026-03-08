import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSettingsScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Ionicons name="settings-outline" size={64} color={theme.tint} style={{ opacity: 0.5, marginBottom: 16 }} />
      <Text style={[styles.title, { color: theme.text }]}>Platform Settings</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>This module is coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16 }
});
