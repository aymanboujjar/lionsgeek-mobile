import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as CalendarAPI from 'expo-calendar';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';

export default function Reservations() {
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [reservations, setReservations] = useState([]);
  const [reservationsCowork, setReservationsCowork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDatesStudios, setMarkedDatesStudios] = useState({});
  const [markedDatesCowork, setMarkedDatesCowork] = useState({});
  const [tab, setTab] = useState('studios'); // 'studios' | 'cowork'
  const brand = '#4B9EEA';
  const router = useRouter();

  // 🔹 Fetch reservations
  const fetchReservations = async () => {
    if (!token) return;
    try {
      const response = await API.getWithAuth('mobile/reservations', token);
      if (response?.data) {
        const data = response.data.reservations || [];
        setReservations(data);

        // mark all dates with reservations
        const marked = {};
        data.forEach((r) => {
          const date = getReservationDate(r);
          if (date) {
            const color = r.canceled ? (isDark ? '#64748B' : '#94A3B8') : brand;
            const current = marked[date];
            if (!current) {
              marked[date] = { marked: true, dotColor: color };
            } else if (current.dotColor !== brand && color === brand) {
              marked[date] = { marked: true, dotColor: color };
            }
          }
        });
        setMarkedDatesStudios(marked);
      }
    } catch (error) {
      console.error('[RESERVATIONS] Studios Error:', error);
    }
  };

  const fetchReservationsCowork = async () => {
    if (!token) return;
    try {
      const response = await API.getWithAuth('mobile/reservationsCowork', token);
      if (response?.data) {
        const data = response.data.reservations || [];
        setReservationsCowork(data);

        // mark all dates with reservations
        const marked = {};
        data.forEach((r) => {
          const date = getReservationDate(r);
          if (date) {
            const color = r.canceled ? (isDark ? '#64748B' : '#94A3B8') : brand;
            const current = marked[date];
            if (!current) {
              marked[date] = { marked: true, dotColor: color };
            } else if (current.dotColor !== brand && color === brand) {
              marked[date] = { marked: true, dotColor: color };
            }
          }
        });
        setMarkedDatesCowork(marked);
      }
    } catch (error) {
      console.error('[RESERVATIONS] Cowork Error:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReservations();
      if (tab === 'cowork') fetchReservationsCowork();
      setLoading(false);
    }
  }, [token, tab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
    if (tab === 'cowork') fetchReservationsCowork();
    setRefreshing(false);
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
  const getReservationDate = (r) => r.date || toDateOnlyFromSpace(r.created_at);

  const toDateTimeFromDateAndTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';
    const [h = '00', m = '00'] = String(timeStr).split(':');
    return `${dateStr} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

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
        title: reservation.title || 'Reservation',
        startDate: new Date(toDateTimeFromDateAndTime(getReservationDate(reservation), reservation.start)),
        endDate: new Date(toDateTimeFromDateAndTime(getReservationDate(reservation), reservation.end || reservation.start)),
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

  // 🔹 Determine current dataset and marked dates
  const currentReservations = tab === 'cowork' ? reservationsCowork : reservations;
  const currentMarkedDates = tab === 'cowork' ? markedDatesCowork : markedDatesStudios;
  const currentDate = selectedDate || toDateOnly(new Date().toISOString());
  const filtered = currentReservations.filter((r) => getReservationDate(r) === currentDate);

  const getStatusBadge = (reservation) => {
    console.log(reservation);
    if (reservation.canceled) return { label: 'Canceled', bg: isDark ? '#374151' : '#E5E7EB', fg: isDark ? '#E5E7EB' : '#374151' };
    if (reservation.approved) return { label: 'Approved', bg: brand + '33', fg: brand };
    return { label: 'Pending', bg: isDark ? '#6B7280' : '#E5E7EB', fg: isDark ? '#E5E7EB' : '#374151' };
  };

  return (
    <AppLayout>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        <Text className="text-2xl font-bold text-black dark:text-white mb-4">Reservations</Text>

        {/* 🔹 Studios/Cowork Tabs */}
        <View className="flex-row mb-3 rounded-xl overflow-hidden" style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6', padding: 4 }}>
          <Pressable
            className="flex-1 items-center py-2 rounded-lg"
            onPress={() => setTab('studios')}
            style={{ backgroundColor: tab === 'studios' ? (isDark ? '#111827' : '#ffffff') : 'transparent' }}
          >
            <Text style={{ color: tab === 'studios' ? (isDark ? '#ffffff' : '#111827') : (isDark ? '#9CA3AF' : '#6B7280'), fontWeight: '500' }}>Studios</Text>
          </Pressable>
          <Pressable
            className="flex-1 items-center py-2 rounded-lg"
            onPress={() => setTab('cowork')}
            style={{ backgroundColor: tab === 'cowork' ? (isDark ? '#111827' : '#ffffff') : 'transparent' }}
          >
            <Text style={{ color: tab === 'cowork' ? (isDark ? '#ffffff' : '#111827') : (isDark ? '#9CA3AF' : '#6B7280'), fontWeight: '500' }}>Cowork</Text>
          </Pressable>
        </View>

        {/* 🔹 Calendar */}
        <Calendar
          markedDates={{
            ...currentMarkedDates,
            ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: brand } } : {}),
          }}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            // Navigate to day page only for studios
            if (tab === 'studios') {
              router.push({ pathname: '/reservations/day', params: { date: day.dateString, reservations } });
            }
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
          }}
          style={{
            borderRadius: 12,
            elevation: 3,
            marginBottom: 16,
          }}
        />

        {/* 🔹 Today Quick Jump */}
        <View className="items-start mt-2">
          <Pressable onPress={() => setSelectedDate(toDateOnly(new Date().toISOString()))} className="px-4 py-2 rounded-full bg-black/10 dark:bg-white/10">
            <Text className="text-black dark:text-white">Today</Text>
          </Pressable>
        </View>

        {/* 🔹 Reservation List */}
        {filtered.map((reservation) => (
          <Pressable
            key={reservation.id}
            onPress={() =>
              router.push({
                pathname: '/reservations/[id]',
                params: { id: reservation.id },
              })
            }
            className="mb-4 rounded-xl p-4"
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? '#1F2937' : '#E5E7EB',
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-semibold text-black dark:text-white capitalize">
                {reservation.title || 'Reservation'}
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

            <Text className="text-sm text-black/60 dark:text-white/60 mb-1">Date: {reservation.day}</Text>
            <Text className="text-sm text-black/60 dark:text-white/60 mb-1">Start: {reservation.start?.includes(':') ? reservation.start : formatDate(reservation.start)}</Text>
            <Text className="text-sm text-black/60 dark:text-white/60 mb-2">End: {reservation.end?.includes(':') ? reservation.end : formatDate(reservation.end)}</Text>

            <Button title="Add to phone calendar" onPress={() => addToDeviceCalendar(reservation)} />
          </Pressable>
        ))}

      </ScrollView>
    </AppLayout>
  );
}
