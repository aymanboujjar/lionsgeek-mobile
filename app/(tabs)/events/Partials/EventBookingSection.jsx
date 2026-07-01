import { View, Text, Pressable } from 'react-native';
import SectionCard from '@/components/ui/SectionCard';

export default function EventBookingSection({
  isStaffBooking,
  isAdmin,
  eventHasPassed,
  remainingCapacity,
  alreadyBooked,
  canOpenBooking,
  onBookPress,
}) {
  return (
    <SectionCard className="p-4">
      <Text className="text-base font-bold text-beta dark:text-light">
        {isStaffBooking ? 'Registration' : 'Free Event'}
      </Text>
      <Text className="text-sm text-beta/60 dark:text-light/60 mt-1">
        {isAdmin
          ? 'Admins can register participants anytime, including after the event.'
          : isStaffBooking
            ? eventHasPassed
              ? 'This event has ended'
              : remainingCapacity > 0
                ? `${remainingCapacity} spot${remainingCapacity === 1 ? '' : 's'} remaining`
                : 'This event is fully booked'
            : eventHasPassed
              ? 'This event has ended'
              : remainingCapacity > 0
                ? `${remainingCapacity} spot${remainingCapacity === 1 ? '' : 's'} remaining`
                : 'This event is fully booked'}
      </Text>

      {!isAdmin && alreadyBooked ? (
        <Pressable disabled className="mt-4 items-center justify-center rounded-2xl bg-beta/10 dark:bg-light/10 py-3.5">
          <Text className="text-sm font-bold text-beta/50 dark:text-light/50">Already Booked</Text>
        </Pressable>
      ) : !isAdmin && eventHasPassed ? (
        <Pressable disabled className="mt-4 items-center justify-center rounded-2xl bg-beta/10 dark:bg-light/10 py-3.5">
          <Text className="text-sm font-bold text-beta/50 dark:text-light/50">Event Ended</Text>
        </Pressable>
      ) : !isAdmin && remainingCapacity <= 0 ? (
        <Pressable disabled className="mt-4 items-center justify-center rounded-2xl bg-beta/10 dark:bg-light/10 py-3.5">
          <Text className="text-sm font-bold text-beta/50 dark:text-light/50">Fully Booked</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={onBookPress}
          disabled={!canOpenBooking}
          className={`mt-4 items-center justify-center rounded-2xl py-3.5 ${
            canOpenBooking ? 'bg-beta dark:bg-alpha active:opacity-90' : 'bg-beta/10 dark:bg-light/10'
          }`}
        >
          <Text
            className={`text-sm font-bold ${
              canOpenBooking ? 'text-light dark:text-beta' : 'text-beta/50 dark:text-light/50'
            }`}
          >
            {isAdmin && isStaffBooking ? 'Register participant' : 'Book now'}
          </Text>
        </Pressable>
      )}
    </SectionCard>
  );
}
