import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from '@/components/ui/SectionCard';
import { getAccentIconColor, getMutedIconColor, getPlaceholderTextColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AttendanceStat from './AttendanceStat';
import ParticipantsList from './ParticipantsList';

export default function EventRegistrationsSection({
  participants,
  filteredParticipants,
  participantSearch,
  onParticipantSearchChange,
  onSearchFocus,
  onClearSearch,
  capacityLabel,
  registeredCount,
  scannedCount,
  totalCapacity,
  capacityFill,
  onParticipantPress,
}) {
  const isDark = useColorScheme() === 'dark';
  const accentIcon = getAccentIconColor(isDark);
  const mutedIcon = getMutedIconColor(isDark);
  const placeholderColor = getPlaceholderTextColor(isDark);

  return (
    <SectionCard className="p-4">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-lg bg-beta/15 dark:bg-alpha/15 items-center justify-center">
            <Ionicons name="people" size={16} color={accentIcon} />
          </View>
          <Text className="text-base font-bold text-beta dark:text-light">Registrations</Text>
        </View>
        {capacityLabel ? (
          <View className="bg-beta/15 dark:bg-alpha/15 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-bold text-beta dark:text-light">{capacityLabel}</Text>
          </View>
        ) : (
          <View className="bg-beta/8 dark:bg-light/8 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-bold text-beta dark:text-light">{participants.length}</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-3 mt-3">
        <AttendanceStat icon="person-add-outline" label="Registered" value={registeredCount} />
        <AttendanceStat icon="qr-code-outline" label="Came (scanned)" value={scannedCount} tone="good" />
      </View>

      {totalCapacity ? (
        <View className="mt-3 mb-1">
          <View className="h-1.5 rounded-full bg-beta/8 dark:bg-light/8 overflow-hidden">
            <View
              className="h-full rounded-full bg-beta dark:bg-alpha"
              style={{ width: `${capacityFill * 100}%` }}
            />
          </View>
          <Text className="text-[11px] text-beta/45 dark:text-light/45 mt-1.5">
            {registeredCount} of {totalCapacity} spots filled · {scannedCount} checked in
          </Text>
        </View>
      ) : (
        <Text className="text-[11px] text-beta/45 dark:text-light/45 mt-3">
          {scannedCount} of {registeredCount} registered visitors checked in
        </Text>
      )}

      {participants.length > 0 ? (
        <View className="flex-row items-center gap-2 mt-4 mb-1 rounded-xl border border-beta/10 dark:border-light/10 bg-beta/4 dark:bg-light/4 px-3">
          <Ionicons name="search" size={16} color={mutedIcon} />
          <TextInput
            value={participantSearch}
            onChangeText={onParticipantSearchChange}
            onFocus={onSearchFocus}
            placeholder="Search by name or email…"
            placeholderTextColor={placeholderColor}
            className="flex-1 min-h-10 py-2 text-sm text-beta dark:text-light"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {participantSearch.length > 0 ? (
            <Pressable onPress={onClearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={mutedIcon} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ParticipantsList
        participants={filteredParticipants}
        onParticipantPress={onParticipantPress}
        emptyMessage={
          participantSearch ? `No participants match "${participantSearch}".` : undefined
        }
      />
    </SectionCard>
  );
}
