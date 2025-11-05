import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAppContext } from '@/context';
import { router } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { token } = useAppContext();

  useEffect(() => {
    if (!token) router.replace('/auth/login');
  }, [token]);


  const { user } = useAppContext();
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.some(r => ['admin', 'coach'].includes(r?.toLowerCase?.() || r));
  const isStudent = userRoles.some(r => r?.toLowerCase?.() === 'student') || (!isAdmin && userRoles.length === 0);

  const tabScreen = [
    { route: "index", name: "Home", icon: "house.fill", showTab: true, roles: [] }, // Everyone
    { route: "members", name: "Members", icon: "person.3.fill", showTab: isAdmin, roles: ['admin', 'coach'] },
    { route: "projects", name: "Projects", icon: "hammer.fill", showTab: true, roles: [] }, // Everyone
    { route: "reservations/index", name: "Reservations", icon: "calendar", showTab: true, roles: [] }, // Everyone
    { route: "leaderboard", name: "Leaderboard", icon: "trophy", showTab: isStudent, roles: ['student'] },
    { route: "more", name: "More", icon: "ellipsis.circle", showTab: true, roles: [] }, // Everyone
  ].filter(screen => screen.showTab)

  const hiddenScreens = [
    { route: "reservations/day", name: "Reservations", icon: "calendar", showTab: true, roles: [] }, // Everyone
    { route: "reservations/_layout", name: "Reservations", icon: "calendar", showTab: true, roles: [] }, // Everyone
    { route: "index", name: "Home", icon: "home", showTab: true, roles: [] }, // Everyone
    { route: "reservations", name: "Reservations", icon: "calendar-today", showTab: true, roles: [] }, // Everyone
    { route: "leaderboard", name: "Leaderboard", icon: "leaderboard", showTab: true, roles: [] },
    { route: "more", name: "More", icon: "menu", showTab: true, roles: [] }, // Everyone
    // hado mo2a9atan hna
    { route: "members", name: "Members", icon: "person.3.fill", showTab: isAdmin, roles: ['admin', 'coach'] },
    { route: "projects", name: "Projects", icon: "hammer.fill", showTab: true, roles: [] }, // 
    // tal 7ad  hna
    { route: "profile", name: "Profile", icon: "person.fill", showTab: false },
    { route: "search", name: "Search", icon: "magnifyingglass", showTab: false },
    { route: "notifications", name: "Notifications", icon: "bell.fill", showTab: false },
  ].filter(screen => screen.showTab)



  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>


      {/* screen inside the navigation bar */}
      {tabScreen.map((screen, idx) => (
        <Tabs.Screen
          key={idx}
          name={screen.route}
          options={{
            headerShown: false,
            title: screen.name,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name={screen.icon} color={color} />
            ),
            tabBarStyle: screen.showTab ? undefined : { display: 'none' },
          }}
        />
      ))}



      {/* screen hidden from nav tab */}
      {hiddenScreens.map((screen, idx) => (
        <Tabs.Screen
          key={idx}
          name={screen.route}
          options={{
            headerShown: false,
            title: screen.name,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name={screen.icon} color={color} />
            ),
            tabBarStyle: screen.showTab ? undefined : { display: 'none' },
            href: null,
          }}
        />
      ))}

    </Tabs>
  );
}
