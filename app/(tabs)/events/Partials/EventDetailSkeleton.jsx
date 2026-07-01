import { View } from 'react-native';
import Skeleton from '@/components/ui/Skeleton';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function EventDetailSkeleton() {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="p-4 gap-4">
      <Skeleton width="100%" height={200} borderRadius={20} isDark={isDark} />
      <Skeleton width="100%" height={140} borderRadius={16} isDark={isDark} />
      <Skeleton width="100%" height={56} borderRadius={16} isDark={isDark} />
      <Skeleton width="100%" height={180} borderRadius={16} isDark={isDark} />
    </View>
  );
}
