import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from '@/components/ui/SectionCard';
import { Colors, getOnAccentTextColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ParticipantProfileCard({
  participant,
  eventTitle,
  checkedIn,
  canShowManualCheckIn,
  checkingIn,
  eventHasPassed,
  onManualCheckIn,
}) {
  const isDark = useColorScheme() === 'dark';
  const onAccentText = getOnAccentTextColor(isDark);
  const initial = (participant?.name || '?').charAt(0).toUpperCase();

  return (
    <SectionCard className="p-4 items-center">
      <View className="w-20 h-20 rounded-full bg-beta/15 dark:bg-alpha/15 items-center justify-center mb-3">
        <Text className="text-3xl font-bold text-beta dark:text-alpha">{initial}</Text>
      </View>
      <Text className="text-xl font-bold text-beta dark:text-light text-center">{participant?.name}</Text>
      <Text className="text-sm text-beta/60 dark:text-light/60 text-center mt-1">{participant?.email}</Text>

      <View className="flex-row flex-wrap items-center justify-center gap-2 mt-4">
        {checkedIn ? (
          <View className="flex-row items-center gap-1.5 bg-good/15 px-3 py-1.5 rounded-full">
            <Ionicons name="qr-code" size={14} color={Colors.good} />
            <Text className="text-xs font-bold text-good">Checked in</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1.5 bg-beta/10 dark:bg-light/10 px-3 py-1.5 rounded-full">
            <Ionicons name="hourglass-outline" size={14} color={isDark ? Colors.light : Colors.beta} />
            <Text className="text-xs font-bold text-beta/55 dark:text-light/55">Not checked in yet</Text>
          </View>
        )}
      </View>

      {!checkedIn && canShowManualCheckIn ? (
        <Pressable
          onPress={onManualCheckIn}
          disabled={checkingIn}
          className="mt-4 flex-row items-center justify-center gap-2 w-full bg-beta dark:bg-alpha px-5 py-3.5 rounded-2xl active:opacity-90"
        >
          {checkingIn ? (
            <ActivityIndicator size="small" color={onAccentText} />
          ) : (
            <Ionicons name="person-add-outline" size={18} color={onAccentText} />
          )}
          <Text className="text-light dark:text-beta font-bold">
            {checkingIn ? 'Checking in…' : 'Manual check-in'}
          </Text>
        </Pressable>
      ) : null}

      {!checkedIn && !canShowManualCheckIn ? (
        <Text className="text-xs text-beta/45 dark:text-light/45 text-center mt-4 leading-5">
          {eventHasPassed
            ? 'Check-in after the event is only available to admins.'
            : 'Manual check-in is only available on the event day, before the event start time.'}
        </Text>
      ) : null}

      {eventTitle ? (
        <Text className="text-xs text-beta/45 dark:text-light/45 text-center mt-3">
          Registered for {eventTitle}
        </Text>
      ) : null}
    </SectionCard>
  );
}
