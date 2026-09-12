import { ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TermsContent } from '@/components/legal/LegalDocuments';

export default function PublicTermsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Use', headerShown: true }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? '#0D0C0B' : '#fafafa' }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <TermsContent />
      </ScrollView>
    </>
  );
}
