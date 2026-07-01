import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAccentIconColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function EventStatusBadge({ status }) {
  const isDark = useColorScheme() === 'dark';
  const accentIcon = getAccentIconColor(isDark);

  if (status === 'Today') {
    return (
      <View className="flex-row items-center gap-1.5 bg-good/20 px-3 py-1.5 rounded-full">
        <View className="w-1.5 h-1.5 rounded-full bg-good" />
        <Text className="text-xs font-bold text-good">Today</Text>
      </View>
    );
  }
  if (status === 'Upcoming') {
    return (
      <View className="flex-row items-center gap-1.5 bg-beta/20 dark:bg-alpha/20 px-3 py-1.5 rounded-full">
        <Ionicons name="time-outline" size={12} color={accentIcon} />
        <Text className="text-xs font-bold text-beta dark:text-alpha">Upcoming</Text>
      </View>
    );
  }
  return (
    <View className="bg-beta/15 dark:bg-light/15 px-3 py-1.5 rounded-full">
      <Text className="text-xs font-bold text-beta/60 dark:text-light/60">Past</Text>
    </View>
  );
}
