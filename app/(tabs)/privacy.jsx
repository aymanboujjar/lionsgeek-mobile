import { ScrollView } from 'react-native';
import AppLayout from '@/components/layout/AppLayout';
import { PrivacyContent } from '@/components/legal/LegalDocuments';

export default function PrivacyScreen() {
  return (
    <AppLayout showNavbar={false} className="flex-1 bg-light dark:bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-12 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <PrivacyContent />
      </ScrollView>
    </AppLayout>
  );
}
