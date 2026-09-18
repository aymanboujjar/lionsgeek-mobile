import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from 'expo-router';

/** Hides the root tab bar while the current screen is focused. */
export function useHideTabBar() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const tabNav = navigation.getParent();
      if (!tabNav) return undefined;

      tabNav.setOptions({
        tabBarStyle: { display: 'none', height: 0 },
      });

      return () => {
        tabNav.setOptions({
          tabBarStyle: undefined,
        });
      };
    }, [navigation])
  );
}
