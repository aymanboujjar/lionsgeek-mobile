import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import API from '@/api';

export default function CreatePost({ onPostPress }) {
  const { user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="bg-light dark:bg-dark rounded-xl p-4 mb-4 border border-light dark:border-dark">
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }}
          className="w-10 h-10 rounded-full mr-3"
          defaultSource={require('@/assets/images/icon.png')}
        />
        <TouchableOpacity 
          onPress={onPostPress}
          className="flex-1 bg-light/50 dark:bg-dark/50 rounded-full px-4 py-3"
        >
          <Text className="text-black/60 dark:text-white/60">
            Start a post
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-around pt-3 border-t border-light/20 dark:border-dark/20">
        <TouchableOpacity className="flex-row items-center">
          <Ionicons name="videocam-outline" size={20} color="#0a66c2" />
          <Text className="text-sm text-black/60 dark:text-white/60 ml-2">Video</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center">
          <Ionicons name="image-outline" size={20} color="#70b5f9" />
          <Text className="text-sm text-black/60 dark:text-white/60 ml-2">Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center">
          <Ionicons name="document-text-outline" size={20} color="#e7a33e" />
          <Text className="text-sm text-black/60 dark:text-white/60 ml-2">Article</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

