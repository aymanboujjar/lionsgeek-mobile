import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, RefreshControl, ScrollView, Alert } from 'react-native';
// custom slot grid, no Timeline
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
        color: r.canceled ? (isDark ? '#4B5563' : '#9CA3AF') : '#4B9EEA',
        rawStart: r.start,
        rawEnd: r.end || r.start,
        canceled: !!r.canceled,
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

  const HOUR_HEIGHT = 80; // px per hour; adjust for density
  const START_MINUTES = 7 * 60 + 30; // 07:30
  const END_MINUTES = 18 * 60 + 30; // 18:30
  const TOTAL_HEIGHT = ((END_MINUTES - START_MINUTES) * HOUR_HEIGHT) / 60;
  const parseHm = (hm) => {
    if (!hm) return START_MINUTES;
    const [h = '0', m = '0'] = String(hm).split(':');
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const toY = (minutes) => ((minutes - START_MINUTES) * HOUR_HEIGHT) / 60;

  const positioned = useMemo(() => {
    return events.map((e) => {
      const s = clamp(parseHm(e.rawStart), START_MINUTES, END_MINUTES);
      const en = clamp(parseHm(e.rawEnd), START_MINUTES, END_MINUTES);
      const top = toY(s);
      const height = Math.max(36, toY(en) - toY(s));
      return { ...e, top, height };
    });
  }, [events]);

  // Scroll setup: show 09:00 near top on open
  const innerScrollRef = useRef(null);
  const INITIAL_HOUR = 9; // 09:00
  const scrollToInitialHour = () => {
    try {
      const y = toY(INITIAL_HOUR * 60);
      innerScrollRef.current?.scrollTo({ y, animated: false });
    } catch {}
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
        <ScrollView
          ref={innerScrollRef}
          nestedScrollEnabled
          style={{ height: 640, borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#111827' : '#E5E7EB' }}
          contentContainerStyle={{ backgroundColor: isDark ? '#0B0B0C' : '#ffffff' }}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          onContentSizeChange={scrollToInitialHour}
        >
          <View style={{ height: TOTAL_HEIGHT, flexDirection: 'row' }}>
            <View style={{ width: 56 }}>
              {Array.from({ length: Math.floor(END_MINUTES / 60) - Math.ceil(START_MINUTES / 60) + 1 }).map((_, idx) => {
                const hr = Math.ceil(START_MINUTES / 60) + idx;
                const top = toY(hr * 60) - 8;
                return (
                  <View key={hr} style={{ position: 'absolute', top, height: 16, width: '100%', alignItems: 'flex-end' }}>
                    <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{String(hr).padStart(2, '0')}:00</Text>
                  </View>
                );
              })}
            </View>

            <View style={{ flex: 1, position: 'relative' }}>
              {Array.from({ length: Math.floor(END_MINUTES / 60) - Math.floor(START_MINUTES / 60) + 1 }).map((_, idx) => {
                const hr = Math.floor(START_MINUTES / 60) + idx;
                const top = toY(hr * 60);
                return (
                  <View key={hr} style={{ position: 'absolute', top, left: 0, right: 0, height: 1, backgroundColor: isDark ? '#1F2937' : '#E5E7EB' }} />
                );
              })}

              {positioned.map((e, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: e.top,
                    left: 8,
                    right: 8,
                    height: e.height,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: e.canceled ? (isDark ? '#374151' : '#E5E7EB') : '#4B9EEA',
                    opacity: e.canceled ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: e.canceled ? (isDark ? '#E5E7EB' : '#111827') : '#ffffff', fontWeight: '600' }}>
                    {e.title}
                  </Text>
                  <Text style={{ color: e.canceled ? (isDark ? '#D1D5DB' : '#374151') : '#EAF3FF', marginTop: 2 }}>
                    {e.rawStart} - {e.rawEnd}
                  </Text>
                  {e.summary ? (
                    <Text style={{ color: e.canceled ? (isDark ? '#D1D5DB' : '#374151') : '#EAF3FF', marginTop: 2 }}>
                      {e.summary}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>
    </AppLayout>
  );
}


