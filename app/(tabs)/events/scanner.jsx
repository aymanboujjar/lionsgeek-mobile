import { lazy, Suspense } from 'react';
import { View } from 'react-native';
import { useAppContext } from '@/context';
import { userCanAccessScan } from '@/components/helpers/helpers';
import Skeleton from '@/components/ui/Skeleton';
import AccessDenied from './Partials/AccessDenied';

const EventScanner = lazy(() => import('./Partials/EventScanner'));

function ScannerFallback() {
  return (
    <View className="flex-1 items-center justify-center bg-dark">
      <Skeleton width={200} height={18} borderRadius={12} isDark />
    </View>
  );
}

export default function ScannerScreen() {
  const { user } = useAppContext();

  if (!userCanAccessScan(user)) {
    return <AccessDenied />;
  }

  return (
    <Suspense fallback={<ScannerFallback />}>
      <EventScanner />
    </Suspense>
  );
}
