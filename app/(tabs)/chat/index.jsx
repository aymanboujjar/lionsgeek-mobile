import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context';
import AppLayout from '@/components/layout/AppLayout';
import ConversationsList from './Partials/ConversationsList';
import { getAccentFillColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ChatListScreen() {
  const { token } = useAppContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const isDark = useColorScheme() === 'dark';
  const accentFill = getAccentFillColor(isDark);

  if (!token) {
    return (
      <AppLayout showNavbar>
        <View className="flex-1 items-center justify-center bg-light dark:bg-dark px-6">
          <View className="w-16 h-16 rounded-2xl bg-beta/10 dark:bg-alpha/10 items-center justify-center mb-4">
            <Ionicons name="chatbubbles-outline" size={28} color={accentFill} />
          </View>
          <Text className="text-base font-semibold text-beta dark:text-light text-center">
            Please log in to access chat
          </Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <View className="flex-1 bg-light dark:bg-dark">
        <View className="px-4 pt-4 pb-2 border-b border-beta/10 dark:border-light/10">
          <Text className="text-2xl font-bold text-beta dark:text-light">Messages</Text>
          <Text className="text-sm text-beta/60 dark:text-light/60 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`
              : 'Your conversations with LionsGeek members'}
          </Text>
        </View>

        <View className="flex-1">
          <ConversationsList onUnreadCountChange={setUnreadCount} />
        </View>
      </View>
    </AppLayout>
  );
}
