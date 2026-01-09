import { Stack } from 'expo-router';

export default function ReservationsStack() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      {/* Month view */}
      <Stack.Screen name="index" />
      {/* Day view */}
      <Stack.Screen name="day" />
      {/* Place Calendar view */}
      <Stack.Screen 
        name="place-calendar" 
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
