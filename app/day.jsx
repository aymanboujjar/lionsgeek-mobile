import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, RefreshControl, ScrollView, Alert } from 'react-native';
import { Timeline } from 'react-native-calendars';
import { useAppContext } from '@/context';
import API from '@/api';
import AppLayout from '@/components/layout/AppLayout';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as CalendarAPI from 'expo-calendar';

export default function DayView() {
  const { date } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const brand = '#4B9EEA';

  const [reservations, setReservations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const day = typeof date === 'string' && date.length >= 10 ? date : new Date().toISOString().split('T')[0];

  const toDateOnlyFromSpace = (datetime) => {
    if (!datetime) return '';
    const parts = String(datetime).split(' ');
    return parts[0] || '';
  };
  const getReservationDate = (r) => r.date || toDateOnlyFromSpace(r.created_at);
  const toDateTimeFromDateAndTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';
    const [h = '00', m = '00'] = String(timeStr).split(':');
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${dateStr} ${hh}:${mm}`;
  };

  const fetchReservations = async () => {
    if (!token) return;
    try {
      const response = await API.getWithAuth('mobile/reservations', token);
      const data = response?.data?.reservations || [];
      setReservations(data);
    } catch (e) {
      console.error('[DAY] fetch reservations error', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [token]);

  const events = useMemo(() => {
    return reservations
      .filter((r) => getReservationDate(r) === day)
      .map((r) => ({
        start: toDateTimeFromDateAndTime(day, r.start),
        end: toDateTimeFromDateAndTime(day, r.end || r.start),
        title: r.type || 'Reservation',
        summary: r.location || '',
        color: r.canceled ? (isDark ? '#4B5563' : '#9CA3AF') : brand,
      }));
  }, [reservations, day, isDark]);

  async function ensureCalendarExists() {
    const { status } = await CalendarAPI.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant calendar access to add events.');
      return null;
    }
    const calendars = await CalendarAPI.getCalendarsAsync(CalendarAPI.EntityTypes.EVENT);
    const modifiable = calendars.find((cal) => cal.allowsModifications);
    return modifiable ? modifiable.id : null;
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  return (
    <AppLayout>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => router.back()} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }}>
            <Text style={{ color: isDark ? '#E5E7EB' : '#111827' }}>Back</Text>
          </Pressable>
          <Text className="text-xl font-semibold text-black dark:text-white">{day}</Text>
          <View style={{ width: 64 }} />
        </View>

        <View style={{ height: 640, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? '#111827' : '#E5E7EB' }}>
          <Timeline
            events={events}
            start={8}
            end={22}
            date={day}
            theme={{
              backgroundColor: isDark ? '#0B0B0C' : '#ffffff',
              hourColor: isDark ? '#6B7280' : '#9CA3AF',
              hourTextColor: isDark ? '#9CA3AF' : '#6B7280',
              lineColor: isDark ? '#1F2937' : '#E5E7EB',
            }}
          />
        </View>
      </ScrollView>
    </AppLayout>
  );
}


