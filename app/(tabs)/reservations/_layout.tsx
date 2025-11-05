import { Stack } from 'expo-router';

export default function ReservationsStack() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      {/* Month view */}
      <Stack.Screen name="index" />
      {/* Day view */}
      <Stack.Screen name="day" />
    </Stack>
  );
}
