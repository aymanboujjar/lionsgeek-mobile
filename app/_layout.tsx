import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import "../index.css";

import { AppProvider, useAppContext } from '@/context';
import { CallProvider } from '@/context/CallContext';
import { setupNotificationListeners, removeNotificationListeners } from '@/services/pushNotifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import Constants from 'expo-constants';
import AppVersionGate from '@/components/AppVersionGate';

SplashScreen.preventAutoHideAsync().catch(() => {});

function stackHeaderOptions(
  title: string,
  stackBg: string,
  colorScheme: string | null | undefined,
) {
  return {
    title,
    headerShown: true as const,
    headerStyle: { backgroundColor: stackBg },
    headerTintColor: colorScheme === 'dark' ? Colors.light : Colors.beta,
    headerTitleStyle: { fontWeight: '700' as const },
    headerShadowVisible: false,
  };
}

function RootLayoutNav() {
  const notificationListenersRef = useRef<ReturnType<typeof setupNotificationListeners> | null>(null);
  const { colorScheme } = useAppContext();
  const stackBg = colorScheme === 'dark' ? '#0D0C0B' : Colors.light;

  useEffect(() => {
    if (Constants.appOwnership === 'expo') {
      return;
    }

    try {
      notificationListenersRef.current = setupNotificationListeners();
    } catch (e) {
      console.warn('[notifications] setup failed:', e);
    }

    return () => {
      if (notificationListenersRef.current) {
        removeNotificationListeners(notificationListenersRef.current);
      }
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: stackBg },
        gestureEnabled: true,
        ...(Platform.OS === 'ios' ? { fullScreenGestureEnabled: true as const } : {}),
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="loading" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth/reset-password"
        options={stackHeaderOptions('Reset password', stackBg, colorScheme)}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function AppThemedShell() {
  const { colorScheme } = useAppContext();
  const isDark = colorScheme === 'dark';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AppVersionGate>
        <RootLayoutNav />
      </AppVersionGate>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Font.loadAsync({
          SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        });
      } catch (e) {
        console.warn('[RootLayout] font load failed:', e);
      } finally {
        if (mounted) setAppReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  const onLayoutRootView = useCallback(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppProvider>
        <CallProvider>
          <AppThemedShell />
        </CallProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
