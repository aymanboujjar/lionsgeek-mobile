import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TouchableOpacity } from 'react-native';
import { useAppContext } from '@/context';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import API from '@/api';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';

export default function More() {
  const { user, token, signOut } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      
      try {
        const response = await API.getWithAuth('mobile/profile', token);
        if (response?.data) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error('[PROFILE] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  const logout = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Profile', onPress: () => {} },
    { icon: 'settings-outline', label: 'Settings', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'About', onPress: () => {} },
  ];

  return (
    <AppLayout showNavbar={false}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
        <View>
        {/* Profile Header */}
        <View className="items-center py-6 mb-6">
          <Image
            source={{ 
              uri: profile?.avatar || user?.avatar || 'https://via.placeholder.com/100' 
            }}
            className="w-24 h-24 rounded-full mb-3 border-2 border-alpha"
            defaultSource={require('@/assets/images/icon.png')}
          />
          <Text className="text-2xl font-bold text-black dark:text-white">
            {profile?.name || user?.name || 'User'}
          </Text>
          <Text className="text-sm text-black/60 dark:text-white/60 mt-1">
            {profile?.email || user?.email || ''}
          </Text>
          {profile?.promo && (
            <Text className="text-xs text-black/50 dark:text-white/50 mt-1">
              {profile.promo}
            </Text>
          )}
        </View>

        {/* Menu Items */}
        <View className="mb-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className="flex-row items-center py-4 border-b border-light/20 dark:border-dark/20"
            >
              <Ionicons 
                name={item.icon} 
                size={24} 
                color={isDark ? '#fff' : '#000'} 
                style={{ marginRight: 16 }}
              />
              <Text className="flex-1 text-base text-black dark:text-white">
                {item.label}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <Pressable 
          onPress={logout} 
          className="bg-red-500 dark:bg-red-600 rounded-lg py-4 mt-4"
        >
          <Text className="text-center text-white font-semibold text-base">
            Log out
          </Text>
        </Pressable>
        </View>
      </ScrollView>
    </AppLayout>
  );
}



