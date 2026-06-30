import { useAppContext } from '@/context';
import { userCanAccessScan } from '@/components/helpers/helpers';
import AccessDenied from './Partials/AccessDenied';
import EventScanner from './Partials/EventScanner';

export default function ScannerScreen() {
  const { user } = useAppContext();

  if (!userCanAccessScan(user)) {
    return <AccessDenied />;
  }

  return <EventScanner />;
}
