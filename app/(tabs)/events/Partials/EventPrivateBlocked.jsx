import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAccentIconColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function EventPrivateBlocked() {
  const isDark = useColorScheme() === 'dark';
  const accentIcon = getAccentIconColor(isDark);

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-16 h-16 rounded-2xl bg-beta/10 dark:bg-light/10 items-center justify-center mb-4">
        <Ionicons name="lock-closed-outline" size={32} color={accentIcon} />
      </View>
      <Text className="text-base font-semibold text-beta dark:text-light text-center">Private event</Text>
      <Text className="text-sm text-beta/60 dark:text-light/60 text-center mt-2">
        This event is not available in the app.
      </Text>
      <Pressable
        onPress={() => router.back()}
        className="mt-6 bg-beta dark:bg-alpha px-6 py-3.5 rounded-2xl active:opacity-90"
      >
        <Text className="text-light dark:text-beta font-bold">Go back</Text>
      </Pressable>
    </View>
  );
}
