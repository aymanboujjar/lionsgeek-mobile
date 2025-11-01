import { View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Navbar from './Navbar';

/**
 * Reusable App Layout component for consistent structure
 * Includes navbar and consistent padding
 */
export default function AppLayout({ children, showNavbar = true, className = '' }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className={`flex-1 bg-light dark:bg-dark ${className}`}>
      {showNavbar && <Navbar />}
      {children}
    </View>
  );
}

