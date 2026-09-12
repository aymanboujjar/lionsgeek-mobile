import { ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PrivacyContent } from '@/components/legal/LegalDocuments';

export default function PublicPrivacyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy', headerShown: true }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? '#0D0C0B' : '#fafafa' }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <PrivacyContent />
      </ScrollView>
    </>
  );
}
