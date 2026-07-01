import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getOnAccentTextColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ErrorScreen({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  icon = 'cloud-offline-outline',
}) {
  const isDark = useColorScheme() === 'dark';
  const onAccentText = getOnAccentTextColor(isDark);

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-16 h-16 rounded-2xl bg-error/15 items-center justify-center mb-4">
        <Ionicons name={icon} size={32} color={Colors.error} />
      </View>
      <Text className="text-base font-semibold text-beta dark:text-light text-center">{title}</Text>
      {message ? (
        <Text className="text-sm text-beta/60 dark:text-light/60 text-center mt-2">{message}</Text>
      ) : null}
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          className="mt-6 flex-row items-center gap-2 bg-beta dark:bg-alpha px-6 py-3.5 rounded-2xl active:opacity-90"
        >
          <Ionicons name="refresh" size={18} color={onAccentText} />
          <Text className="text-light dark:text-beta font-bold">{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
