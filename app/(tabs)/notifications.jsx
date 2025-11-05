import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';
import { router } from 'expo-router';
import API from '@/api';

export default function NotificationsScreen() {
  const { user, token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced notifications with more types
  const notifications = [
    {
      id: 1,
      type: 'achievement',
      title: 'New Achievement Unlocked!',
      text: 'You earned the "Code Master" badge for 100 hours of coding',
      user: { name: 'System', avatar: null },
      time: '2h ago',
      read: false,
      icon: 'trophy',
      color: '#ffc801',
    },
    {
      id: 2,
      type: 'like',
      user: { name: 'Hamza Ezzagmoute', avatar: 'https://via.placeholder.com/40' },
      text: 'liked your post about the new project',
      time: '3h ago',
      read: false,
      icon: 'heart',
      color: '#ef4444',
    },
    {
      id: 3,
      type: 'comment',
      user: { name: 'Nabil SAKR', avatar: 'https://via.placeholder.com/40' },
      text: 'commented on your post: "Great work!"',
      time: '5h ago',
      read: false,
      icon: 'chatbubble',
      color: '#3b82f6',
    },
    {
      id: 4,
      type: 'project',
      title: 'New Project Invitation',
      text: 'Mehdi Forkani added you to project "Mobile App Redesign"',
      user: { name: 'Mehdi Forkani', avatar: 'https://via.placeholder.com/40' },
      time: '1d ago',
      read: true,
      icon: 'folder',
      color: '#f59e0b',
    },
    {
      id: 5,
      type: 'reminder',
      title: 'Upcoming Reservation',
      text: 'Your coworking space reservation starts in 2 hours',
      user: { name: 'System', avatar: null },
      time: '1d ago',
      read: true,
      icon: 'calendar',
      color: '#10b981',
    },
    {
      id: 6,
      type: 'rank',
      title: 'Ranking Updated',
      text: 'You moved up 3 places in the leaderboard!',
      user: { name: 'System', avatar: null },
      time: '2d ago',
      read: true,
      icon: 'trending-up',
      color: '#8b5cf6',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate fetching new notifications
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getNotificationIcon = (type) => {
    const notif = notifications.find(n => n.type === type);
    return notif?.icon || 'notifications';
  };

  const getNotificationColor = (type) => {
    const notif = notifications.find(n => n.type === type);
    return notif?.color || '#6b7280';
  };

  const getAvatar = (notification) => {
    if (notification.user?.avatar) return notification.user.avatar;
    if (notification.type === 'achievement' || notification.type === 'reminder' || notification.type === 'rank') {
      return null;
    }
    return 'https://via.placeholder.com/40';
  };

  const handleNotificationPress = (notification) => {
    // Navigate based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      // Navigate to post
    } else if (notification.type === 'project') {
      router.push('/(tabs)/projects');
    } else if (notification.type === 'reminder') {
      router.push('/(tabs)/reservations');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppLayout showNavbar={false}>
      <View className="flex-1 bg-light dark:bg-dark">
        {/* Header */}
        <View className="bg-light dark:bg-dark border-b border-light/20 dark:border-dark/20 pt-12 pb-4 px-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
              <View>
                <Text className="text-2xl font-bold text-black dark:text-white">Notifications</Text>
                {unreadCount > 0 && (
                  <Text className="text-sm text-black/60 dark:text-white/60 mt-1">{unreadCount} unread</Text>
                )}
              </View>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity className="bg-alpha/20 dark:bg-alpha/30 rounded-full px-4 py-2">
                <Text className="text-alpha text-sm font-bold">Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffc801" />
          }
        >
          <View className="px-6 pt-4 pb-8">
            {notifications.length === 0 ? (
              <View className="py-16 items-center">
                <Ionicons name="notifications-outline" size={64} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                <Text className="text-center text-black/60 dark:text-white/60 mt-4 text-base">
                  No notifications yet
                </Text>
                <Text className="text-center text-black/40 dark:text-white/40 mt-2 text-sm">
                  You're all caught up!
                </Text>
              </View>
            ) : (
              <>
                {/* Today Section */}
                <View className="mb-4">
                  <Text className="text-sm font-bold text-black/50 dark:text-white/50 uppercase mb-3">Today</Text>
                  {notifications.filter(n => !n.read).map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      onPress={() => handleNotificationPress(notification)}
                      className={`mb-3 p-4 rounded-2xl border active:opacity-80 bg-alpha/10 dark:bg-alpha/20 border-alpha/30`}
                    >
                      <View className="flex-row items-start">
                        <View className="relative mr-4">
                          {notification.user?.avatar ? (
                            <Image
                              source={{ uri: getAvatar(notification) }}
                              className="w-14 h-14 rounded-full border-2 border-alpha/50"
                              defaultSource={require('@/assets/images/icon.png')}
                            />
                          ) : (
                            <View className="w-14 h-14 rounded-full bg-beta/20 dark:bg-beta/40 items-center justify-center border-2 border-beta/30">
                              <Ionicons
                                name={getNotificationIcon(notification.type)}
                                size={24}
                                color={getNotificationColor(notification.type)}
                              />
                            </View>
                          )}
                        </View>
                        <View className="flex-1">
                          {notification.title && (
                            <Text className="text-base font-bold text-black dark:text-white mb-1">
                              {notification.title}
                            </Text>
                          )}
                          <Text className="text-sm text-black/80 dark:text-white/80 leading-5">
                            {notification.user?.name && notification.type !== 'achievement' && notification.type !== 'reminder' && notification.type !== 'rank' && (
                              <Text className="font-semibold">{notification.user.name} </Text>
                            )}
                            {notification.text}
                          </Text>
                          <View className="flex-row items-center mt-2">
                            <Ionicons 
                              name="time-outline" 
                              size={12} 
                              color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} 
                            />
                            <Text className="text-xs text-black/50 dark:text-white/50 ml-1">
                              {notification.time}
                            </Text>
                          </View>
                        </View>
                        <View className="ml-2">
                          <View className="w-2 h-2 rounded-full bg-alpha" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Earlier Section */}
                <View className="mt-4">
                  <Text className="text-sm font-bold text-black/50 dark:text-white/50 uppercase mb-3">Earlier</Text>
                  {notifications.filter(n => n.read).map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      onPress={() => handleNotificationPress(notification)}
                      className="mb-3 p-4 rounded-2xl border bg-light dark:bg-dark border-light/20 dark:border-dark/20 active:opacity-70"
                    >
                      <View className="flex-row items-start">
                        <View className="relative mr-4">
                          {notification.user?.avatar ? (
                            <Image
                              source={{ uri: getAvatar(notification) }}
                              className="w-14 h-14 rounded-full opacity-70"
                              defaultSource={require('@/assets/images/icon.png')}
                            />
                          ) : (
                            <View className="w-14 h-14 rounded-full bg-beta/10 dark:bg-beta/20 items-center justify-center opacity-50">
                              <Ionicons
                                name={getNotificationIcon(notification.type)}
                                size={24}
                                color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                              />
                            </View>
                          )}
                        </View>
                        <View className="flex-1">
                          {notification.title && (
                            <Text className="text-base font-bold text-black/80 dark:text-white/80 mb-1">
                              {notification.title}
                            </Text>
                          )}
                          <Text className="text-sm text-black/60 dark:text-white/60 leading-5">
                            {notification.user?.name && notification.type !== 'achievement' && notification.type !== 'reminder' && notification.type !== 'rank' && (
                              <Text className="font-semibold">{notification.user.name} </Text>
                            )}
                            {notification.text}
                          </Text>
                          <View className="flex-row items-center mt-2">
                            <Ionicons 
                              name="time-outline" 
                              size={12} 
                              color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 
                            />
                            <Text className="text-xs text-black/40 dark:text-white/40 ml-1">
                              {notification.time}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </AppLayout>
  );
}
