import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';
import { router } from 'expo-router';
import API from '@/api';

export default function NotificationsScreen() {
  const { user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Hardcoded notifications
  const notifications = [
    {
      id: 1,
      type: 'like',
      user: { name: 'Hamza Ezzagmoute', avatar: 'https://via.placeholder.com/40' },
      text: 'liked your post',
      time: '2h ago',
      read: false,
    },
    {
      id: 2,
      type: 'comment',
      user: { name: 'Nabil SAKR', avatar: 'https://via.placeholder.com/40' },
      text: 'commented on your post',
      time: '5h ago',
      read: false,
    },
    {
      id: 3,
      type: 'connect',
      user: { name: 'John Doe', avatar: 'https://via.placeholder.com/40' },
      text: 'wants to connect with you',
      time: '1d ago',
      read: true,
    },
    {
      id: 4,
      type: 'project',
      user: { name: 'Mehdi Forkani', avatar: 'https://via.placeholder.com/40' },
      text: 'added you to a project',
      time: '2d ago',
      read: true,
    },
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'connect':
        return 'person-add';
      case 'project':
        return 'folder';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
        return '#ef4444';
      case 'comment':
        return '#3b82f6';
      case 'connect':
        return '#10b981';
      case 'project':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <AppLayout showNavbar={false}>
      <View className="flex-1 bg-light dark:bg-dark">
        {/* Header */}
        <View className="bg-light dark:bg-dark border-b border-light/20 dark:border-dark/20 pt-12 pb-4 px-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-black dark:text-white">Notifications</Text>
            </View>
            <TouchableOpacity>
              <Text className="text-alpha text-sm font-medium">Mark all read</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-4 pb-8">
            {notifications.length === 0 ? (
              <View className="py-8">
                <Text className="text-center text-black/60 dark:text-white/60">
                  No notifications yet
                </Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  className={`mb-3 p-4 rounded-lg border ${
                    notification.read
                      ? 'bg-light dark:bg-dark border-light/20 dark:border-dark/20'
                      : 'bg-alpha/10 dark:bg-alpha/20 border-alpha/30'
                  }`}
                >
                  <View className="flex-row items-start">
                    <View className="relative">
                      <Image
                        source={{ uri: notification.user.avatar || 'https://via.placeholder.com/40' }}
                        className="w-12 h-12 rounded-full"
                        defaultSource={require('@/assets/images/icon.png')}
                      />
                      <View
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border-2 border-light dark:border-dark"
                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                      >
                        <Ionicons
                          name={getNotificationIcon(notification.type)}
                          size={12}
                          color="#fff"
                        />
                      </View>
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-sm text-black dark:text-white">
                        <Text className="font-semibold">{notification.user.name}</Text>{' '}
                        {notification.text}
                      </Text>
                      <Text className="text-xs text-black/50 dark:text-white/50 mt-1">
                        {notification.time}
                      </Text>
                    </View>
                    {!notification.read && (
                      <View className="w-2 h-2 rounded-full bg-alpha ml-2 mt-2" />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </AppLayout>
  );
}

