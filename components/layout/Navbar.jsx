import { View, Text, Image, Pressable, TouchableOpacity } from 'react-native';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import API from '@/api';

export default function Navbar() {
  const { user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  const handleSearchPress = () => {
    router.push('/(tabs)/search');
  };

  const handleNotificationsPress = () => {
    router.push('/(tabs)/notifications');
  };

  return (
    <View className={`bg-light dark:bg-dark border-b border-light/20 dark:border-dark/20 px-6 pt-12 pb-4`}>
      <View className="flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={handleProfilePress}
          className="flex-row items-center flex-1"
        >
          <Image
            source={{ 
              uri: user?.avatar || `${API.APP_URL}/storage/img/profile/${user?.image}` || 'https://via.placeholder.com/40' 
            }}
            className="w-10 h-10 rounded-full mr-3"
            defaultSource={require('@/assets/images/icon.png')}
          />
          <View className="flex-1">
            <Text className="text-base font-semibold text-black dark:text-white" numberOfLines={1}>
              {user?.image || 'User'}
            </Text>
            <Text className="text-xs text-black/60 dark:text-white/60" numberOfLines={1}>
              {user?.email || ''}
            </Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4" onPress={handleSearchPress}>
            <Ionicons name="search-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNotificationsPress}>
            <Ionicons name="notifications-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

