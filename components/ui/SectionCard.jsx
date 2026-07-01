import { View } from 'react-native';

export default function SectionCard({ children, className = '' }) {
  return (
    <View
      className={`bg-white dark:bg-card border border-beta/8 dark:border-card_border rounded-2xl overflow-hidden ${className}`}
    >
      {children}
    </View>
  );
}
