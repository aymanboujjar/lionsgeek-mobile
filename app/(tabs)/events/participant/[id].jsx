import { useAppContext } from '@/context';
import { userCanAccessScan } from '@/components/helpers/helpers';
import AccessDenied from '../Partials/AccessDenied';
import ParticipantDetail from '../Partials/ParticipantDetail';

export default function EventParticipantScreen() {
  const { user } = useAppContext();

  if (!userCanAccessScan(user)) {
    return <AccessDenied />;
  }

  return <ParticipantDetail />;
}
