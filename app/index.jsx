import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Entry() {
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        // Check if user has seen welcome page
        const welcomeSeen = await AsyncStorage.getItem('welcome_seen');
        const token = await AsyncStorage.getItem('auth_token');
        
        if (!welcomeSeen) {
          // First time - show welcome page
          router.replace('/welcome');
        } else if (token) {
          // Has token - go to loading for verification
          router.replace('/loading');
        } else {
          // No token - go to login
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('[ENTRY] Error:', error);
        router.replace('/welcome');
      }
    };

    checkFirstLaunch();
  }, []);

  return null;
}


