import { View } from 'react-native';

/**
 * Reusable Container component for consistent padding
 * Inspired by Inertia.js structure
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.className - Additional classes
 * @param {boolean} props.safeArea - Add safe area padding
 */
export default function Container({ children, className = '', safeArea = true }) {
  const paddingClasses = safeArea ? 'px-6 pt-14 pb-8' : 'px-6 py-2';
  
  return (
    <View className={`${paddingClasses} ${className}`}>
      {children}
    </View>
  );
}

