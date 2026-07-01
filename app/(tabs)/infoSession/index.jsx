import { useAppContext } from '@/context';
import { userCanAccessScan } from '@/components/helpers/helpers';
import AccessDenied from '../events/Partials/AccessDenied';
import InfoSessionsTab from './Partials/InfoSessionsTab';

export default function InfoSessionIndexScreen() {
  const { user } = useAppContext();

  if (!userCanAccessScan(user)) {
    return <AccessDenied />;
  }

  return <InfoSessionsTab />;
}
