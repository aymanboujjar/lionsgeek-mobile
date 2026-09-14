import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken } from '@/utils/authTokenStorage';

export default function Entry() {
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const onboardingSeen = await AsyncStorage.getItem('onboarding_seen');
        const token = await getAuthToken();

        if (onboardingSeen !== '1') {
          router.replace('/onboarding');
        } else if (token) {
          router.replace('/loading');
        } else {
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('[ENTRY] Error:', error);
        router.replace('/auth/login');
      }
    };

    checkFirstLaunch();
  }, []);

  return null;
}
