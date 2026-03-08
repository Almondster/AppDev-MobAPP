import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

export default function SmartMatchLayout() {
  const { theme } = useTheme();

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: theme.background },
        animation: 'none' 
      }} 
    >
      <Stack.Screen name="match" />
      <Stack.Screen name="step2" />
      <Stack.Screen name="step3" />
      <Stack.Screen name="step4" />
      <Stack.Screen name="loading" />
    </Stack>
  );
}