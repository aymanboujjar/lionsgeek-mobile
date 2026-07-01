import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Entry() {
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        // Check if user has seen onboarding
        const onboardingSeen = await AsyncStorage.getItem('onboarding_seen');
        const token = await AsyncStorage.getItem('auth_token');
        
        if (onboardingSeen !== '1') {
          router.replace('/onboarding');
        } else if (token) {
          // Has token - go to loading for verification
          router.replace('/loading');
        } else {
          // No token - go to login
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('[ENTRY] Error:', error);
        // On error, redirect to login
        router.replace('/auth/login');
      }
    };

    checkFirstLaunch();
  }, []);

  return null;
}


