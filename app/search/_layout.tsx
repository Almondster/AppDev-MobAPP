import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

export default function SearchLayout() {
  const { theme } = useTheme();

  return (
    <Stack screenOptions={{ 
      headerShown: false, 
      contentStyle: { backgroundColor: theme.background },
      animation: 'none' 
    }}>
      <Stack.Screen name="subcategory" />
      <Stack.Screen name="services" />
    </Stack>
  );
}