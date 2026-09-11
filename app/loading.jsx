import { useEffect } from 'react';
import { View } from 'react-native';
import { useAppContext } from '@/context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken, removeAuthToken } from '@/utils/authTokenStorage';
import API from '@/api';
import { Home as LogoIcon } from '@/components/logo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { registerForPushNotificationsAsync, sendPushTokenToBackend, consumePendingNotificationNavigation, handleNotificationNavigation } from '@/services/pushNotifications';

export default function LoadingScreen() {
  const { saveAuth } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const verifyAndLogin = async () => {
      try {
        const token = await getAuthToken();
        const tokenStr = typeof token === 'string' ? token.trim() : '';
        const hasValidToken =
          !!tokenStr && tokenStr !== 'false' && tokenStr !== 'null' && tokenStr !== 'undefined';

        const seen = await AsyncStorage.getItem('onboarding_seen');

        if (seen !== '1' && !hasValidToken) {
          router.replace('/onboarding');
          return;
        }

        if (!hasValidToken) {
          await removeAuthToken();
          await AsyncStorage.removeItem('auth_user');
          router.replace('/auth/login');
          return;
        }

        const enterAppWithUser = async (userData) => {
          await saveAuth(tokenStr, userData);
          try {
            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
              await sendPushTokenToBackend(pushToken, tokenStr);
            }
          } catch {
            // Push setup is optional; do not block app flow.
          }

          // Prefer cold-start notification destination over unconditional Home.
          try {
            const pendingData = await consumePendingNotificationNavigation();
            if (pendingData) {
              router.replace('/(tabs)/home');
              setTimeout(() => handleNotificationNavigation(pendingData), 0);
              return;
            }
          } catch {
            // fall through to home
          }
          router.replace('/(tabs)/home');
        };

        try {
          const response = await API.getWithAuth('mobile/profile', tokenStr);

          if (response?.data) {
            let userData = response.data;
            if (response.data.data) {
              userData = response.data.data;
            } else if (response.data.user) {
              userData = response.data.user;
            }
            await enterAppWithUser(userData);
            return;
          }

          // Empty body with 2xx — treat as soft failure, try cached user.
          const cached = await AsyncStorage.getItem('auth_user');
          if (cached) {
            try {
              await enterAppWithUser(JSON.parse(cached));
              return;
            } catch {
              // fall through
            }
          }

          await removeAuthToken();
          await AsyncStorage.removeItem('auth_user');
          router.replace('/auth/login');
        } catch (error) {
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            await removeAuthToken();
            await AsyncStorage.removeItem('auth_user');
            router.replace('/auth/login');
            return;
          }

          // Network / 5xx: keep token and enter with cached stub when possible.
          const cached = await AsyncStorage.getItem('auth_user');
          if (cached) {
            try {
              await enterAppWithUser(JSON.parse(cached));
              return;
            } catch {
              // fall through
            }
          }

          // Still keep token for next launch; go home with minimal stub.
          await saveAuth(tokenStr, { id: null, name: 'You' });
          router.replace('/(tabs)/home');
        }
      } catch {
        router.replace('/auth/login');
      }
    };

    verifyAndLogin();
  }, []);

  return (
    <View className={`flex-1 items-center justify-center bg-light dark:bg-dark`}>
      <LogoIcon color={isDark ? '#fff' : '#000'} width={120} height={120} />
    </View>
  );
}
