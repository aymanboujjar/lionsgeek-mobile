import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from '@/components/ui/SectionCard';
import { getAccentIconColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { formatEventDate } from '@/utils/events';

export default function EventDetailsSection({ event }) {
  const isDark = useColorScheme() === 'dark';
  const accentIcon = getAccentIconColor(isDark);

  return (
    <SectionCard className="p-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-8 h-8 rounded-lg bg-beta/15 dark:bg-beta/40 items-center justify-center">
          <Ionicons name="information-circle-outline" size={16} color={accentIcon} />
        </View>
        <Text className="text-base font-bold text-beta dark:text-light">Details</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Ionicons name="time-outline" size={16} color={accentIcon} />
        <Text className="text-sm text-beta/80 dark:text-light/80">{formatEventDate(event)}</Text>
      </View>
      {event?.location ? (
        <View className="flex-row items-center gap-2 mt-2">
          <Ionicons name="location-outline" size={16} color={accentIcon} />
          <Text className="text-sm text-beta/80 dark:text-light/80 flex-1">{event.location}</Text>
        </View>
      ) : null}
    </SectionCard>
  );
}
