import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router/react-navigation';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import API from '@/api';
import { Home as LogoIcon } from '@/components/logo';

function ChatUnreadBadge({ count }) {
  if (!count || count < 1) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <View className="absolute -top-1.5 -right-2 min-h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-alpha border-2 border-light dark:border-dark">
      <Text className="text-[10px] font-extrabold text-beta">{label}</Text>
    </View>
  );
}

export default function Navbar() {
  const { user, token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const refreshChatUnread = useCallback(async () => {
    if (!token) {
      setChatUnreadCount(0);
      return;
    }
    try {
      const response = await API.getWithAuth('mobile/chat', token);
      const conversations = response?.data?.conversations || [];
      const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setChatUnreadCount(total);
    } catch {
      // Keep last known count on transient failures.
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      refreshChatUnread();
    }, [refreshChatUnread])
  );

  const handleSearchPress = () => {
    router.push('/(tabs)/search');
  };

  const handleChatPress = () => {
    router.push('/(tabs)/chat');
  };

  const handleNotificationsPress = () => {
    router.push('/(tabs)/notifications');
  };

  if (!user) {
    return (
      <View className="bg-light dark:bg-dark border-b border-light/20 dark:border-dark/20 px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full mr-3 bg-gray-300 dark:bg-gray-700" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-black dark:text-white" numberOfLines={1}>
                Loading...
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-light dark:bg-dark border-b border-light/20 dark:border-dark/20 px-6 pt-12 pb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <LogoIcon color={isDark ? '#fff' : '#000'} width={30} height={30} />
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4" onPress={handleSearchPress}>
            <Ionicons name="search-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity className="mr-4 relative" onPress={handleChatPress}>
            <Ionicons name="chatbubbles-outline" size={24} color={isDark ? '#fff' : '#000'} />
            <ChatUnreadBadge count={chatUnreadCount} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNotificationsPress}>
            <Ionicons name="notifications-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
