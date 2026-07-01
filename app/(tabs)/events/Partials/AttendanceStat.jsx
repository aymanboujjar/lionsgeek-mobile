import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getAccentIconColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function AttendanceStat({ icon, label, value, tone = 'alpha' }) {
  const isDark = useColorScheme() === 'dark';
  const toneClasses =
    tone === 'good'
      ? {
          box: 'bg-good/12 border-good/20',
          icon: Colors.good,
          value: 'text-good',
          label: 'text-good',
        }
      : {
          box: 'bg-beta/12 dark:bg-alpha/12 border-beta/20 dark:border-alpha/20',
          icon: getAccentIconColor(isDark),
          value: 'text-beta dark:text-light',
          label: 'text-beta/55 dark:text-light/55',
        };

  return (
    <View className={`flex-1 border rounded-xl p-3.5 ${toneClasses.box}`}>
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name={icon} size={16} color={toneClasses.icon} />
        <Text className={`text-[10px] font-bold uppercase tracking-wide ${toneClasses.label}`}>{label}</Text>
      </View>
      <Text className={`text-2xl font-bold ${toneClasses.value}`}>{value}</Text>
    </View>
  );
}
