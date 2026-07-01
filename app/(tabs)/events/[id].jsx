import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/context';
import { userCanAccessScan, userHasAdminRole } from '@/components/helpers/helpers';
import API from '@/api';
import AppLayout from '@/components/layout/AppLayout';
import ErrorScreen from '@/components/ui/ErrorScreen';
import EventBookingModal from './Partials/EventBookingModal';
import EventCoverImage from './Partials/EventCoverImage';
import EventStatusBadge from './Partials/EventStatusBadge';
import EventDetailHeader from './Partials/EventDetailHeader';
import EventDetailSkeleton from './Partials/EventDetailSkeleton';
import EventPrivateBlocked from './Partials/EventPrivateBlocked';
import EventDetailsSection from './Partials/EventDetailsSection';
import EventBookingSection from './Partials/EventBookingSection';
import EventRegistrationsSection from './Partials/EventRegistrationsSection';
import { hasUserBookedEvent } from '@/utils/eventBooking';
import { getAccentFillColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  userCanBookEvent,
  userCanScanEvent,
  formatEventCapacity,
  getEventCoverUrl,
  getEventDisplayName,
  getEventRemainingCapacity,
  getEventStatusLabel,
  getEventTotalCapacity,
  hasEventPassed,
  isPrivateEvent,
  getParticipantCounts,
} from '@/utils/events';

export default function EventDetailScreen() {
  const { user } = useAppContext();
  const canAccessScan = userCanAccessScan(user);
  const isAdmin = userHasAdminRole(user);
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isDark = useColorScheme() === 'dark';
  const accentFill = getAccentFillColor(isDark);

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const skipFocusRefresh = useRef(true);
  const scrollViewRef = useRef(null);

  const handleSearchFocus = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 320);
  }, []);

  const filteredParticipants = useMemo(() => {
    const q = participantSearch.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    );
  }, [participants, participantSearch]);

  const fetchEvent = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const response = await API.getEvent(id);
        setEvent(response?.data?.event ?? null);
        setParticipants(Array.isArray(response?.data?.participants) ? response.data.participants : []);
      } catch {
        setError('Could not load event details.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useFocusEffect(
    useCallback(() => {
      if (skipFocusRefresh.current) {
        skipFocusRefresh.current = false;
        return;
      }
      fetchEvent(true);
    }, [fetchEvent])
  );

  const scannable = event ? userCanScanEvent(event, user) : false;
  const title = getEventDisplayName(event?.name);
  const coverUrl = getEventCoverUrl(event?.cover);
  const statusLabel = event ? getEventStatusLabel(event, { treatPastByDateTime: !canAccessScan }) : null;
  const capacityLabel = event ? formatEventCapacity(event, participants.length) : null;
  const totalCapacity = event ? getEventTotalCapacity(event, participants.length) : null;
  const capacityFill =
    totalCapacity && totalCapacity > 0 ? Math.min(1, participants.length / totalCapacity) : 0;
  const { registered: registeredCount, scanned: scannedCount } = getParticipantCounts(participants);
  const remainingCapacity = event ? getEventRemainingCapacity(event) : 0;
  const alreadyBooked = hasUserBookedEvent(participants, user?.email);
  const eventHasPassed = event ? hasEventPassed(event) : false;
  const isPrivate = event ? isPrivateEvent(event) : false;
  const scanDisabledLabel = eventHasPassed ? 'Event ended' : 'Not today';
  const isStaffBooking = canAccessScan;
  const canShowBooking = isStaffBooking || !isPrivate;
  const canOpenBooking =
    canShowBooking && userCanBookEvent(event, user) && (isAdmin || !alreadyBooked);

  const openScanner = () => {
    router.push({
      pathname: '/(tabs)/events/scanner',
      params: { id: String(id) },
    });
  };

  const openParticipant = (participant) => {
    router.push({
      pathname: '/(tabs)/events/participant/[id]',
      params: {
        id: String(participant.id),
        eventId: String(id),
      },
    });
  };

  return (
    <AppLayout showNavbar={false}>
      <KeyboardAvoidingView
        className="flex-1 bg-light dark:bg-dark"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <EventDetailHeader
          title={title}
          loading={loading}
          scannable={scannable}
          scanDisabledLabel={scanDisabledLabel}
          onScanPress={openScanner}
          showScanButton={canAccessScan && !loading && !error}
        />

        {loading ? (
          <EventDetailSkeleton />
        ) : error ? (
          <ErrorScreen message={error} onRetry={() => fetchEvent()} />
        ) : isPrivate && !canAccessScan ? (
          <EventPrivateBlocked />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            contentContainerClassName="p-4 pb-10 gap-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchEvent(true)}
                tintColor={accentFill}
                colors={[accentFill]}
              />
            }
          >
            <View className="relative">
              <EventCoverImage uri={coverUrl} height={200} borderRadius={20} />
              {statusLabel ? (
                <View className="absolute top-3 right-3">
                  <EventStatusBadge status={statusLabel} />
                </View>
              ) : null}
            </View>

            <EventDetailsSection event={event} />

            {canShowBooking ? (
              <EventBookingSection
                isStaffBooking={isStaffBooking}
                isAdmin={isAdmin}
                eventHasPassed={eventHasPassed}
                remainingCapacity={remainingCapacity}
                alreadyBooked={alreadyBooked}
                canOpenBooking={canOpenBooking}
                onBookPress={() => setShowBookingModal(true)}
              />
            ) : null}

            {canAccessScan ? (
              <EventRegistrationsSection
                participants={participants}
                filteredParticipants={filteredParticipants}
                participantSearch={participantSearch}
                onParticipantSearchChange={setParticipantSearch}
                onSearchFocus={handleSearchFocus}
                onClearSearch={() => setParticipantSearch('')}
                capacityLabel={capacityLabel}
                registeredCount={registeredCount}
                scannedCount={scannedCount}
                totalCapacity={totalCapacity}
                capacityFill={capacityFill}
                onParticipantPress={openParticipant}
              />
            ) : null}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <EventBookingModal
        visible={showBookingModal}
        event={event}
        user={user}
        staffMode={isStaffBooking}
        onClose={() => setShowBookingModal(false)}
        onSuccess={() => fetchEvent(true)}
      />
    </AppLayout>
  );
}
