import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ParticipantDetailRow({ icon, label, value, accentIcon }) {
  return (
    <View className="flex-row items-start gap-3 py-3 border-b border-beta/6 dark:border-light/6 last:border-b-0">
      <View className="w-9 h-9 rounded-xl bg-beta/12 dark:bg-alpha/12 items-center justify-center mt-0.5">
        <Ionicons name={icon} size={16} color={accentIcon} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-[10px] font-bold uppercase tracking-wide text-beta/45 dark:text-light/45">
          {label}
        </Text>
        <Text className="text-sm font-medium text-beta dark:text-light mt-0.5">{value}</Text>
      </View>
    </View>
  );
}
