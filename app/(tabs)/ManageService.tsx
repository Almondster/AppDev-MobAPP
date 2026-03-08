import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { styles } from '../../styles/ManageService.styles';

export default function ManageServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Services</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Services Yet</Text>
          <Text style={styles.emptyDesc}>Create your first service to start earning.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}