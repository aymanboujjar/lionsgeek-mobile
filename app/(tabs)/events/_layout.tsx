import { Stack } from 'expo-router';

export default function EventsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[id]"
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="scanner"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="participant/[id]"
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
