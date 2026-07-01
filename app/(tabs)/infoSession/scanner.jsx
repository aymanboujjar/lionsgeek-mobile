import { useAppContext } from '@/context';
import { userCanAccessScan } from '@/components/helpers/helpers';
import AccessDenied from '../events/Partials/AccessDenied';
import InfoSessionScanner from './Partials/InfoSessionScanner';

export default function InfoSessionScannerScreen() {
  const { user } = useAppContext();

  if (!userCanAccessScan(user)) {
    return <AccessDenied />;
  }

  return <InfoSessionScanner />;
}
