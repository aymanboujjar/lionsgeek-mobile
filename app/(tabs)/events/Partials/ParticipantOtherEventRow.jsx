import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getAccentIconColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { formatEventDate, getEventDisplayName, getEventStatusLabel } from '@/utils/events';

export default function ParticipantOtherEventRow({ item, onPress }) {
  const isDark = useColorScheme() === 'dark';
  const accentIcon = getAccentIconColor(isDark);
  const title = getEventDisplayName(item.event?.name);
  const status = getEventStatusLabel(item.event);
  const scanned = Boolean(item.registration?.is_visited);

  return (
    <Pressable
      onPress={onPress}
      className="py-3 border-b border-beta/6 dark:border-light/6 last:border-b-0 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 min-w-0">
          <Text className="text-sm font-semibold text-beta dark:text-light" numberOfLines={2}>
            {title}
          </Text>
          <Text className="text-xs text-beta/55 dark:text-light/55 mt-1">{formatEventDate(item.event)}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          {status === 'Today' ? (
            <View className="bg-good/15 px-2 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-good">{status}</Text>
            </View>
          ) : status === 'Upcoming' ? (
            <View className="bg-beta/15 dark:bg-alpha/15 px-2 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-beta dark:text-alpha">{status}</Text>
            </View>
          ) : (
            <View className="bg-beta/10 dark:bg-light/10 px-2 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-beta/55 dark:text-light/55">{status}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={accentIcon} />
        </View>
      </View>
      <View className="flex-row items-center gap-2 mt-2">
        {scanned ? (
          <View className="flex-row items-center gap-1 bg-good/15 px-2 py-1 rounded-full">
            <Ionicons name="qr-code" size={11} color={Colors.good} />
            <Text className="text-[10px] font-semibold text-good">Checked in</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1 bg-beta/10 dark:bg-light/10 px-2 py-1 rounded-full">
            <Ionicons name="time-outline" size={11} color={isDark ? Colors.light : Colors.beta} />
            <Text className="text-[10px] font-semibold text-beta/50 dark:text-light/50">Not checked in</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
