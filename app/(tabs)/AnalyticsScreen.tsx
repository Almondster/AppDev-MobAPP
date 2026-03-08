import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { styles } from '../../styles/AnalyticsScreen.styles';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Data</Text>
          <Text style={styles.emptyDesc}>Analytics will appear here once you have orders.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}