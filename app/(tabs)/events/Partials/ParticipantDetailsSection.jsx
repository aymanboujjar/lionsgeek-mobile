import { Text } from 'react-native';
import SectionCard from '@/components/ui/SectionCard';
import ParticipantDetailRow from './ParticipantDetailRow';

export default function ParticipantDetailsSection({ participant, detailRows, accentIcon }) {
  return (
    <SectionCard className="px-4">
      <Text className="text-sm font-bold text-beta dark:text-light pt-4 pb-1">Details</Text>
      <ParticipantDetailRow icon="mail-outline" label="Email" value={participant?.email || '—'} accentIcon={accentIcon} />
      {detailRows.map((row) => (
        <ParticipantDetailRow
          key={`${row.label}-${row.value}`}
          icon="information-circle-outline"
          label={row.label}
          value={row.value}
          accentIcon={accentIcon}
        />
      ))}
      {!detailRows.length ? (
        <Text className="text-xs text-beta/45 dark:text-light/45 py-3">
          No additional profile fields from the registration.
        </Text>
      ) : null}
    </SectionCard>
  );
}
