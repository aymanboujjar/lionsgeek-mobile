import { Tabs, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Platform, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context';
import API from '@/api';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { token } = useAppContext();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [storedToken, setStoredToken] = useState(null);

  // Check if token exists in storage (in case context hasn't loaded yet)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const nextStoredToken = await AsyncStorage.getItem('auth_token');
        setStoredToken(nextStoredToken);

        if (!nextStoredToken && !token) {
          // No token in storage and no token in context - redirect to login
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('[TABS] Error checking auth:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [token]);

  useEffect(() => {
    // Only redirect if we've finished checking and there's no token
    if (!isCheckingAuth && !token && !storedToken) {
      router.replace('/auth/login');
    }
  }, [token, storedToken, isCheckingAuth]);


  const { user } = useAppContext();
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.some(r => ['admin', 'coach'].includes(r?.toLowerCase?.() || r));

  // Map SF Symbols icon names to Ionicons names for cross-platform support
  const getIconName = (sfSymbolName, focused = false) => {
    const iconMap = {
      "house.fill": focused ? "home" : "home-outline",
      "calendar": focused ? "calendar" : "calendar-outline",
      "chatbubbles.fill": focused ? "chatbubbles" : "chatbubbles-outline",
      "trophy.fill": focused ? "trophy" : "trophy-outline",
      "ellipsis": "ellipsis-horizontal",
      "person.3.fill": focused ? "people" : "people-outline",
      "hammer.fill": focused ? "hammer" : "hammer-outline",
      "person.fill": focused ? "person" : "person-outline",
      "magnifyingglass": focused ? "search" : "search-outline",
      "bell.fill": focused ? "notifications" : "notifications-outline",
      "qr-code": focused ? "qr-code" : "qr-code-outline",
      "ticket": focused ? "ticket" : "ticket-outline",
      "school": focused ? "school" : "school-outline",
    };
    return iconMap[sfSymbolName] || sfSymbolName;
  };

  const tabScreen = [
    { route: "index", name: "Home", icon: "house.fill" },
    { route: "reservations", name: "Reservations", icon: "calendar" },
    { route: "events", name: "Events", icon: "ticket" },
    { route: "leaderboard", name: "Leaderboard", icon: "trophy.fill" },
    { route: "profile", name: "Profile", icon: "person.fill" },
    // { route: "test", name: "notifications", icon: "bell.fill" },
  ];

  const hiddenScreens = [
    { route: "members", name: "Members", icon: "person.3.fill", showTab: isAdmin, roles: ['admin', 'coach'] },
    { route: "projects", name: "Projects", icon: "hammer.fill", showTab: true, roles: [] },
    { route: "training", name: "Training", icon: "school" },
    { route: "home", name: "Home", icon: "house.fill", showTab: false },
    { route: "search", name: "Search", icon: "magnifyingglass", showTab: false },
    { route: "notifications", name: "Notifications", icon: "bell.fill", showTab: false },
    { route: "test", name: "Test", icon: "bell.fill", showTab: false },
    { route: "infoSession", name: "Info Session", icon: "school", showTab: false },
    // Stack screens (non-tab routes living under (tabs)/)
    { route: "chat", name: "Chat", icon: "chatbubbles.fill", showTab: false },
    { route: "stories", name: "Stories", icon: "book", showTab: false },
    { route: "posts", name: "Posts", icon: "document-text", showTab: false },
    { route: "settings", name: "Settings", icon: "settings", showTab: false },
    { route: "more", name: "More", icon: "ellipsis", showTab: false },
    { route: "activity", name: "Activity", icon: "pulse", showTab: false },
    { route: "saved-posts", name: "Saved posts", icon: "bookmark", showTab: false },
    { route: "achievements", name: "Achievements", icon: "trophy", showTab: false },
    { route: "learning-progress", name: "Learning", icon: "school", showTab: false },
    { route: "projects-hub", name: "Projects hub", icon: "hammer", showTab: false },
    { route: "admin-reports", name: "Reports", icon: "analytics", showTab: false },
    { route: "customization", name: "Customize", icon: "color-palette", showTab: false },
    { route: "attendance-history", name: "Attendance", icon: "calendar", showTab: false },
    { route: "reservation-history-studio", name: "Studio history", icon: "calendar", showTab: false },
    { route: "reservation-history-cowork", name: "Cowork history", icon: "calendar", showTab: false },
    { route: "notification-preferences", name: "Notification prefs", icon: "notifications", showTab: false },
    { route: "terms", name: "Terms", icon: "document-text", showTab: false },
    { route: "privacy", name: "Privacy", icon: "shield", showTab: false },
    { route: "support", name: "Support", icon: "help-circle", showTab: false },
    { route: "licenses", name: "Licenses", icon: "document", showTab: false },
    { route: "call", name: "Call", icon: "call", showTab: false },
    { route: "incoming-call", name: "Incoming call", icon: "call", showTab: false },
    { route: "outgoing-call", name: "Outgoing call", icon: "call", showTab: false },
  ]


  const isDark = colorScheme === 'dark';
  const activeRingColor = Colors.alpha;
  const tabBarBg = isDark ? Colors.dark : Colors.light;

  const visibleTabRoutes = useMemo(() => new Set(tabScreen.map((s) => s.route)), [tabScreen]);

  const tabBarStyle = useMemo(() => {
    const contentHeight = Platform.OS === 'ios' ? 49 : 56;
    const base = {
      backgroundColor: tabBarBg,
      borderTopColor: isDark ? Colors.dark_gray : Colors.dark_gray + '30',
      borderTopWidth: 1,
      paddingBottom: insets.bottom,
      height: contentHeight + insets.bottom,
    };
    return Platform.OS === 'ios'
      ? { ...base, position: 'absolute', left: 0, right: 0, bottom: 0 }
      : base;
  }, [insets.bottom, isDark, tabBarBg]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(tabBarBg).catch(() => {});
    }
  }, [tabBarBg]);

  // #region agent log
  useEffect(() => {
    const { width: screenWidth } = Dimensions.get('window');
    fetch('http://127.0.0.1:7443/ingest/053d9658-e18d-4e51-b69f-003086ea9876', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '976b46' },
      body: JSON.stringify({
        sessionId: '976b46',
        runId: 'post-fix',
        hypothesisId: 'B',
        location: '_layout.jsx:tabBarStyle',
        message: 'tabBarStyle computed',
        data: { platform: Platform.OS, insets, tabBarStyle, screenWidth, tabBarBg },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    console.warn('[DEBUG976b46] tabBarStyle', JSON.stringify({ insets, tabBarStyle, screenWidth }));
  }, [insets, tabBarStyle, tabBarBg]);

  useEffect(() => {
    const visibleRoutes = tabScreen.map((s) => s.route);
    const hiddenRouteNames = hiddenScreens.map((s) => s.route);
    fetch('http://127.0.0.1:7443/ingest/053d9658-e18d-4e51-b69f-003086ea9876', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '976b46' },
      body: JSON.stringify({
        sessionId: '976b46',
        runId: 'post-fix',
        hypothesisId: 'A',
        location: '_layout.jsx:registeredScreens',
        message: 'registered tab screens',
        data: {
          visibleCount: visibleRoutes.length,
          visibleRoutes,
          hiddenCount: hiddenRouteNames.length,
          hiddenRoutes: hiddenRouteNames,
          isAdmin,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [isAdmin]);
  // #endregion

  const renderTabBar = (props) => {
    const allRouteNames = props.state?.routes?.map((r) => r.name) ?? [];
    const filteredRoutes = props.state.routes.filter((route) => visibleTabRoutes.has(route.name));
    const filteredDescriptors = Object.fromEntries(
      filteredRoutes.map((route) => [route.key, props.descriptors[route.key]]),
    );
    const activeRouteName = props.state.routes[props.state.index]?.name;
    const filteredIndex = filteredRoutes.findIndex((route) => route.name === activeRouteName);
    const filteredState = {
      ...props.state,
      routes: filteredRoutes,
      index: filteredIndex >= 0 ? filteredIndex : 0,
    };

    // #region agent log
    const logPayload = {
      sessionId: '976b46',
      runId: 'post-fix',
      hypothesisId: 'A',
      location: '_layout.jsx:renderTabBar',
      message: 'tab bar routes filtered',
      data: {
        allRouteCount: allRouteNames.length,
        allRouteNames,
        visibleRouteCount: filteredRoutes.length,
        visibleRouteNames: filteredRoutes.map((r) => r.name),
        activeRoute: props.state?.routes?.[props.state?.index]?.name,
      },
      timestamp: Date.now(),
    };
    console.warn('[DEBUG976b46]', JSON.stringify(logPayload));
    fetch('http://127.0.0.1:7443/ingest/053d9658-e18d-4e51-b69f-003086ea9876', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '976b46' },
      body: JSON.stringify(logPayload),
    }).catch(() => {});
    // #endregion

    return (
      <BottomTabBar
        {...props}
        state={filteredState}
        descriptors={filteredDescriptors}
      />
    );
  };

  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        tabBarActiveTintColor: Colors.alpha,
        tabBarInactiveTintColor: isDark ? Colors.light + 'CC' : Colors.beta + 'CC',
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarItemStyle: { flex: 1 },
        tabBarStyle,
      }}>


      {/* screen inside the navigation bar */}
      {tabScreen.map((screen, idx) => (
        <Tabs.Screen
          key={idx}
          name={screen.route}
          options={{
            headerShown: false,
            title: screen.name,
            ...(screen.route === 'profile'
              ? {
                // Tabs keep screens mounted; if we previously opened someone via
                // `/(tabs)/profile?userId=...`, tapping the Profile tab must reset
                // back to your own profile (no params).
                tabBarButton: (props) => (
                  <HapticTab
                    {...props}
                    onPress={() => {
                      router.replace('/(tabs)/profile');
                    }}
                    onLongPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                      }
                      router.push('/(tabs)/more');
                    }}
                  />
                ),
              }
              : {}),
            tabBarIcon: ({ color, focused }) => {
              const resolvedIcon = getIconName(screen.icon, focused);
              // #region agent log
              if (screen.route === 'events' || screen.route === 'reservations') {
                fetch('http://127.0.0.1:7443/ingest/053d9658-e18d-4e51-b69f-003086ea9876', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '976b46' },
                  body: JSON.stringify({
                    sessionId: '976b46',
                    runId: 'post-fix',
                    hypothesisId: 'C',
                    location: '_layout.jsx:tabBarIcon',
                    message: 'visible tab icon resolved',
                    data: { route: screen.route, sfIcon: screen.icon, resolvedIcon, focused },
                    timestamp: Date.now(),
                  }),
                }).catch(() => {});
              }
              // #endregion
              if (screen.route === 'profile') {
                const avatarUrl = API.APP_URL + "/storage/img/profile/" + user?.image;
                const ringClassName = focused ? 'border-2' : 'border';
                const ringStyle = { borderColor: focused ? activeRingColor : 'transparent' };
                // console.log(avatarUrl);

                return (
                  <View className={`w-8 h-8 rounded-full overflow-hidden ${ringClassName}`} style={ringStyle}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-alpha/20">
                        <Ionicons size={18} name={focused ? 'person' : 'person-outline'} color={color} />
                      </View>
                    )}
                  </View>
                );
              }

              return (
                <Ionicons
                  size={28}
                  name={getIconName(screen.icon, focused)}
                  color={color}
                />
              );
            },
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
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={28}
                name={getIconName(screen.icon, focused)}
                color={color}
              />
            ),
            tabBarStyle: screen.showTab ? undefined : { display: 'none' },
            href: null,
          }}
        />
      ))}

    </Tabs>
  );
}
