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

  ];

  return (
    <AppLayout showNavbar={false}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
        <View>
   
   
        {/* Menu Items */}
        <View className="mb-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item?.onPress}
              className="flex-row item?s-center py-4 border-b border-light/20 dark:border-dark/20"
            >
              <Ionicons 
                name={item?.icon} 
                size={24} 
                color={isDark ? '#fff' : '#000'} 
                style={{ marginRight: 16 }}
              />
              <Text className="flex-1 text-base text-black dark:text-white">
                {item?.label}
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



