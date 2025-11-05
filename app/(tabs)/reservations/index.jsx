import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as CalendarAPI from 'expo-calendar';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';
import { Platform } from 'react-native';

export default function Reservations() {
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [viewMode, setViewMode] = useState('month'); // month only here; day lives on separate screen
  const brand = '#4B9EEA';
  const router = useRouter();

  // 🔹 Fetch reservations
  const fetchReservations = async () => {
    if (!token) return;
    try {
      const response = await API.getWithAuth('mobile/reservations', token);
      if (response?.data) {
        const data = response.data.reservations || [];
        console.log(data);
        setReservations(data);
        // mark all dates with reservations
        const marked = {};
        data.forEach((r) => {
          const date = getReservationDate(r);
          if (date) {
            // Use a single brand accent for professional look; muted gray if canceled
            const color = r.canceled ? (isDark ? '#64748B' : '#94A3B8') : brand;
            const current = marked[date];
            if (!current) {
              marked[date] = { marked: true, dotColor: color };
            } else if (current.dotColor !== brand && color === brand) {
              marked[date] = { marked: true, dotColor: color };
            }
          }
        });
        setMarkedDates(marked);
      }
    } catch (error) {
      console.error('[RESERVATIONS] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchReservations();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const toDateOnly = (iso) => (iso ? iso.split('T')[0] : '');
  const toDateOnlyFromSpace = (datetime) => {
    if (!datetime) return '';
    const parts = String(datetime).split(' ');
    return parts[0] || '';
  };
  const getReservationDate = (r) => {
    return r.date || toDateOnlyFromSpace(r.created_at);
  };
  const toTimeStr = (date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  };
  const toDateTimeFromDateAndTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';
    const [h = '00', m = '00'] = String(timeStr).split(':');
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${dateStr} ${hh}:${mm}`;
  };

  // Day view moved to separate screen

  // 🔹 Calendar permissions and add event
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

  async function addToDeviceCalendar(reservation) {
    try {
      const calendarId = await ensureCalendarExists();
      if (!calendarId) return;

      const event = {
        title: reservation.type || 'Reservation',
        startDate: new Date(toDateTimeFromDateAndTime(getReservationDate(reservation) || currentDate, reservation.start)),
        endDate: new Date(toDateTimeFromDateAndTime(getReservationDate(reservation) || currentDate, reservation.end || reservation.start)),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: reservation.location || '',
        notes: `Reservation status: ${reservation.status}`,
        alarms: [{ relativeOffset: -15, method: CalendarAPI.AlarmMethod.ALERT }],
      };

      const eventId = await CalendarAPI.createEventAsync(calendarId, event);
      Alert.alert('✅ Added', 'Event added to your calendar successfully!');
      console.log('Event ID:', eventId);
    } catch (err) {
      console.error('Add to calendar error:', err);
      Alert.alert('Error', 'Failed to add to calendar.');
    }
  }

  // 🔹 Filter reservations for current date (selected or today)
  const currentDate = selectedDate || toDateOnly(new Date().toISOString());
  const filtered = reservations.filter((r) => getReservationDate(r) === currentDate);

  const getStatusBadge = (reservation) => {
    const base = reservation.canceled
      ? { label: 'Canceled', bg: isDark ? '#374151' : '#E5E7EB', fg: isDark ? '#E5E7EB' : '#374151' }
      : reservation.status === 'approved'
      ? { label: 'Approved', bg: brand + '33', fg: brand }
      : { label: 'Pending', bg: (isDark ? '#6B7280' : '#E5E7EB'), fg: (isDark ? '#E5E7EB' : '#374151') };
    return base;
  };

  return (
    <AppLayout>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        <Text className="text-2xl font-bold text-black dark:text-white mb-4">
          Reservations
        </Text>

        {/* 🔹 View mode toggle */}
        <View className="flex-row mb-3 rounded-xl overflow-hidden" style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6', padding: 4 }}>
          <Pressable
            className={`flex-1 items-center py-2 rounded-lg`}
            onPress={() => setViewMode('month')}
            style={{ backgroundColor: viewMode === 'month' ? (isDark ? '#111827' : '#ffffff') : 'transparent' }}
          >
            <Text className={`font-medium`} style={{ color: viewMode === 'month' ? (isDark ? '#ffffff' : '#111827') : (isDark ? '#9CA3AF' : '#6B7280') }}>Month</Text>
          </Pressable>
          <Pressable
            className={`flex-1 items-center py-2 rounded-lg`}
            onPress={() => router.push({ pathname: '/reservations/day', params: { date: currentDate } })}
            style={{ backgroundColor: viewMode === 'day' ? (isDark ? '#111827' : '#ffffff') : 'transparent' }}
          >
            <Text className={`font-medium`} style={{ color: viewMode === 'day' ? (isDark ? '#ffffff' : '#111827') : (isDark ? '#9CA3AF' : '#6B7280') }}>Day</Text>
          </Pressable>
        </View>

        {/* 🔹 Calendar (Month) */}
        {viewMode === 'month' && (
          <Calendar
            markedDates={{
              ...markedDates,
              ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: '#4B9EEA' } } : {}),
            }}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              router.push({ pathname: '/reservations/day', params: { date: day.dateString } });
            }}
            enableSwipeMonths
            markingType="dot"
            theme={{
              calendarBackground: isDark ? '#0B0B0C' : '#ffffff',
              dayTextColor: isDark ? '#E5E7EB' : '#0B0B0C',
              monthTextColor: isDark ? '#FFFFFF' : '#0B0B0C',
              arrowColor: isDark ? '#FFFFFF' : '#0B0B0C',
              todayTextColor: brand,
              selectedDayBackgroundColor: brand,
              selectedDayTextColor: '#ffffff',
              textDisabledColor: isDark ? '#4B5563' : '#D1D5DB',
              dotColor: brand,
              selectedDotColor: '#ffffff',
            }}
            style={{
              borderRadius: 12,
              elevation: 3,
              marginBottom: 16,
            }}
          />
        )}

        {/* Day timeline moved to separate page */}

        {/* 🔹 Today quick-jump */}
        <View className="items-start mt-2">
          <Pressable onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="px-4 py-2 rounded-full bg-black/10 dark:bg-white/10">
            <Text className="text-black dark:text-white">Today</Text>
          </Pressable>
        </View>

        {/* 🔹 List reservations */}
        {loading ? (
          <Text className="text-center text-black/60 dark:text-white/60 py-8">
            Loading...
          </Text>
        ) : reservations.length === 0 ? (
          <Text className="text-center text-black/60 dark:text-white/60 py-8">
            No reservations yet
          </Text>
        ) : filtered.length === 0 && selectedDate ? (
          <Text className="text-center text-black/60 dark:text-white/60 py-8">
            No reservations on this date
          </Text>
        ) : (
          filtered.map((reservation) => (
            <View
              key={reservation.id}
              className={`mb-4 rounded-xl p-4`}
              style={{
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? '#1F2937' : '#E5E7EB',
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-semibold text-black dark:text-white capitalize">
                  {reservation.type || 'Reservation'}
                </Text>
                {(() => {
                  const badge = getStatusBadge(reservation);
                  return (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: badge.bg }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: badge.fg }}>{badge.label}</Text>
                    </View>
                  );
                })()}
              </View>

              <Text className="text-sm text-black/60 dark:text-white/60 mb-1">
                Start: {reservation.start?.includes(':') ? reservation.start : formatDate(reservation.start)}
              </Text>
              <Text className="text-sm text-black/60 dark:text-white/60 mb-2">
                End: {reservation.end?.includes(':') ? reservation.end : formatDate(reservation.end)}
              </Text>

              <Button
                title="Add to phone calendar"
                onPress={() => addToDeviceCalendar(reservation)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </AppLayout>
  );
}
