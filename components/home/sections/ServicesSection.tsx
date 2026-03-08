import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { SeeAllCard, ServiceCard } from '../cards';

interface ServicesSectionProps {
  services: any[];
  onServicePress: (service: any) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services, onServicePress }) => {
  const { theme } = useTheme();
  const router = useRouter();

  if (services.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingTop: 26 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text }}>Creator Services</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, paddingVertical: 6 }}
        bounces={false}
        overScrollMode="never"
      >
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} onPress={() => onServicePress(service)} />
        ))}
        <SeeAllCard height={280} onPress={() => router.push('/search/services')} />
      </ScrollView>
    </View>
  );
};
