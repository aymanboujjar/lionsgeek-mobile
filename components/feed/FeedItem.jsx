import { View, Text, Image, Pressable, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import API from '@/api';

export default function FeedItem({ item, onPress }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 7) return date.toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'project':
        return 'folder-outline';
      case 'reservation':
        return 'calendar-outline';
      default:
        return 'document-outline';
    }
  };

  return (
    <Pressable onPress={onPress} className="mb-4">
      <View className="bg-light dark:bg-dark rounded-xl overflow-hidden border border-light/20 dark:border-dark/20">
        {/* Header */}
        <View className="flex-row items-center p-4 pb-3">
          <Image
            source={{ 
              uri: item.user?.avatar || (item.user?.image ? `${API.APP_URL}/storage/img/profile/${item.user.image}` : null) || 'https://via.placeholder.com/40' 
            }}
            className="w-12 h-12 rounded-full mr-3"
            defaultSource={require('@/assets/images/icon.png')}
          />
          <View className="flex-1">
            <Text className="font-semibold text-base text-black dark:text-white">
              {item.user?.name || 'LionsGeek'}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Ionicons 
                name={getTypeIcon(item.type)} 
                size={12} 
                color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} 
              />
              <Text className="text-xs text-black/60 dark:text-white/60 ml-1">
                {formatTime(item.created_at)}
              </Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {item.image && (
          <Image
            source={{ uri: item.image }}
            className="w-full h-64"
            resizeMode="cover"
          />
        )}
        
        <View className="p-4 pt-3">
          <Text className="text-base font-semibold text-black dark:text-white mb-1">
            {item.title || 'New activity'}
          </Text>
          <Text className="text-sm text-black/80 dark:text-white/80 leading-5" numberOfLines={3}>
            {item.description || 'No description available'}
          </Text>

          {/* Repost Indicator */}
          {item.reposted && (
            <View className="flex-row items-center px-4 py-2 bg-light/30 dark:bg-dark/30 border-b border-light/20 dark:border-dark/20">
              <Ionicons name="repeat" size={16} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
              <Text className="text-xs text-black/60 dark:text-white/60 ml-2">
                Reposted by {item.reposted_by || 'someone'}
              </Text>
            </View>
          )}

          {/* Footer - Like, Comment, Repost, Share */}
          <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-light/20 dark:border-dark/20">
            <TouchableOpacity className="flex-row items-center flex-1 justify-center active:opacity-70">
              <Ionicons name="heart-outline" size={22} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
              <Text className="text-sm text-black/60 dark:text-white/60 ml-2">
                {item.likes || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center flex-1 justify-center active:opacity-70">
              <Ionicons name="chatbubble-outline" size={22} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
              <Text className="text-sm text-black/60 dark:text-white/60 ml-2">
                {item.comments || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                if (item.onRepost) {
                  item.onRepost(item);
                }
              }}
              className="flex-row items-center flex-1 justify-center active:opacity-70"
            >
              <Ionicons 
                name={item.isReposted ? "repeat" : "repeat-outline"} 
                size={22} 
                color={item.isReposted ? (isDark ? '#fff' : '#000') : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')} 
              />
              <Text className={`text-sm ml-2 ${item.isReposted ? 'text-alpha' : 'text-black/60 dark:text-white/60'}`}>
                {item.reposts || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center flex-1 justify-center active:opacity-70">
              <Ionicons name="share-outline" size={22} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
              <Text className="text-sm text-black/60 dark:text-white/60 ml-2">Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

