import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/context';
import { userCanAccessScan } from '@/components/helpers/helpers';
import API from '@/api';
import AppLayout from '@/components/layout/AppLayout';
import AccessDenied from '../Partials/AccessDenied';
import ErrorScreen from '@/components/ui/ErrorScreen';
import ParticipantPageHeader from '../Partials/ParticipantPageHeader';
import ParticipantPageSkeleton from '../Partials/ParticipantPageSkeleton';
import ParticipantProfileCard from '../Partials/ParticipantProfileCard';
import ParticipantDetailsSection from '../Partials/ParticipantDetailsSection';
import ParticipantOtherEventsSection from '../Partials/ParticipantOtherEventsSection';
import { getAccentFillColor, getAccentIconColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  findParticipantById,
  getEventDisplayName,
  getParticipantDetailRows,
  hasEventPassed,
  isSameEventId,
  userCanCheckInEvent,
} from '@/utils/events';

export default function EventParticipantScreen() {
  const { user } = useAppContext();
  const params = useLocalSearchParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
  const participantId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isDark = useColorScheme() === 'dark';
  const accentIcon = getAccentIconColor(isDark);
  const accentFill = getAccentFillColor(isDark);

  const [participant, setParticipant] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [otherRegistrations, setOtherRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOther, setLoadingOther] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const detailRows = useMemo(() => getParticipantDetailRows(participant), [participant]);
  const eventHasPassed = currentEvent ? hasEventPassed(currentEvent) : false;
  const checkedIn = Boolean(participant?.is_visited);
  const canShowManualCheckIn = currentEvent ? userCanCheckInEvent(currentEvent, user) : false;

  const otherEventsOnly = useMemo(
    () => otherRegistrations.filter((item) => !isSameEventId(item.event?.id, eventId)),
    [otherRegistrations, eventId]
  );

  const loadParticipant = useCallback(
    async (isRefresh = false) => {
      if (!eventId || !participantId) return;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setOtherRegistrations([]);

      try {
        const response = await API.getEvent(eventId);
        const event = response?.data?.event ?? null;
        const participants = Array.isArray(response?.data?.participants) ? response.data.participants : [];
        const match = findParticipantById(participants, participantId);

        if (!match) {
          setError('Participant not found for this event.');
          setParticipant(null);
          setCurrentEvent(null);
          return;
        }

        setCurrentEvent(event);
        setParticipant(match);

        if (match.email) {
          setLoadingOther(true);
          try {
            const others = await API.fetchParticipantOtherRegistrations(match.email, eventId);
            setOtherRegistrations(others);
          } catch {
            setOtherRegistrations([]);
          } finally {
            setLoadingOther(false);
          }
        }
      } catch {
        setError('Could not load participant details.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId, participantId]
  );

  useEffect(() => {
    loadParticipant();
  }, [loadParticipant]);

  const handleManualCheckIn = useCallback(() => {
    if (!participantId || !eventId || checkingIn || checkedIn) return;

    Alert.alert(
      'Manual check-in',
      'Mark this participant as checked in without scanning their QR code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check in',
          onPress: async () => {
            setCheckingIn(true);
            try {
              await API.manualEventChecking(participantId, eventId);
              setParticipant((prev) => (prev ? { ...prev, is_visited: true } : prev));
            } catch {
              Alert.alert('Check-in failed', 'Could not mark this participant as checked in.');
            } finally {
              setCheckingIn(false);
            }
          },
        },
      ]
    );
  }, [participantId, eventId, checkingIn, checkedIn]);

  if (!userCanAccessScan(user)) {
    return <AccessDenied />;
  }

  const eventTitle = getEventDisplayName(currentEvent?.name);

  return (
    <AppLayout showNavbar={false}>
      <View className="flex-1 bg-light dark:bg-dark">
        <ParticipantPageHeader title={participant?.name} loading={loading} />

        {loading ? (
          <ParticipantPageSkeleton />
        ) : error ? (
          <ErrorScreen message={error} onRetry={() => loadParticipant()} />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="p-4 pb-10 gap-4"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadParticipant(true)}
                tintColor={accentFill}
                colors={[accentFill]}
              />
            }
          >
            <ParticipantProfileCard
              participant={participant}
              eventTitle={eventTitle}
              checkedIn={checkedIn}
              canShowManualCheckIn={canShowManualCheckIn}
              checkingIn={checkingIn}
              eventHasPassed={eventHasPassed}
              onManualCheckIn={handleManualCheckIn}
            />

            <ParticipantDetailsSection
              participant={participant}
              detailRows={detailRows}
              accentIcon={accentIcon}
            />

            <ParticipantOtherEventsSection
              otherEvents={otherEventsOnly}
              loadingOther={loadingOther}
              onEventPress={(otherEventId) => router.push(`/(tabs)/events/${otherEventId}`)}
            />
          </ScrollView>
        )}
      </View>
    </AppLayout>
  );
}
