import { View, Text, Pressable, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function StoryItem({ user, isOwn = false, onPress }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable onPress={onPress} className="items-center mr-4">
      <View className={`rounded-full p-0.5 ${isOwn ? 'bg-alpha' : 'bg-light/30 dark:bg-dark/30'}`}>
        <View className="bg-light dark:bg-dark rounded-full p-0.5">
          <Image
            source={{ uri: user?.avatar || 'https://via.placeholder.com/60' }}
            className="w-16 h-16 rounded-full"
            defaultSource={require('@/assets/images/icon.png')}
          />
        </View>
      </View>
      <Text className="text-xs mt-1 text-black dark:text-white max-w-[70px]" numberOfLines={1}>
        {isOwn ? 'Your Story' : user?.name || 'User'}
      </Text>
    </Pressable>
  );
}

