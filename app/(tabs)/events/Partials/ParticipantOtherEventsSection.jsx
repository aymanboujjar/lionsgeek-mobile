import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from '@/components/ui/SectionCard';
import Skeleton from '@/components/ui/Skeleton';
import { getAccentIconColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import ParticipantOtherEventRow from './ParticipantOtherEventRow';

export default function ParticipantOtherEventsSection({
  otherEvents,
  loadingOther,
  onEventPress,
}) {
  const isDark = useColorScheme() === 'dark';
  const accentIcon = getAccentIconColor(isDark);

  return (
    <SectionCard className="p-4">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-lg bg-beta/15 dark:bg-alpha/15 items-center justify-center">
            <Ionicons name="calendar-outline" size={16} color={accentIcon} />
          </View>
          <Text className="text-base font-bold text-beta dark:text-light">Other events</Text>
        </View>
        {!loadingOther ? (
          <View className="bg-beta/15 dark:bg-alpha/15 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-bold text-beta dark:text-light">{otherEvents.length}</Text>
          </View>
        ) : null}
      </View>

      <Text className="text-xs text-beta/50 dark:text-light/50 mb-3 leading-5">
        Other lionsgeek.ma events this visitor is registered for (matched by email).
      </Text>

      {loadingOther ? (
        <View className="gap-3 py-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} width="100%" height={72} borderRadius={12} isDark={isDark} />
          ))}
        </View>
      ) : otherEvents.length === 0 ? (
        <View className="items-center py-6">
          <Ionicons name="calendar-outline" size={32} color={accentIcon} />
          <Text className="text-sm font-semibold text-beta dark:text-light mt-3">No other events</Text>
          <Text className="text-xs text-beta/50 dark:text-light/50 text-center mt-1 px-4">
            This visitor is only registered for the current event.
          </Text>
        </View>
      ) : (
        <View>
          {otherEvents.map((item) => (
            <ParticipantOtherEventRow
              key={String(item.event?.id)}
              item={item}
              onPress={() => onEventPress(item.event?.id)}
            />
          ))}
        </View>
      )}
    </SectionCard>
  );
}
