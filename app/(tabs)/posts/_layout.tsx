import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function PostsLayout() {
  const colorScheme = useColorScheme();
  const bg = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: bg },
        ...(Platform.OS === 'ios'
          ? { fullScreenGestureEnabled: true as const }
          : {}),
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="edit/[id]" />
    </Stack>
  );
}
