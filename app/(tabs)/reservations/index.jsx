import { useEffect, useState, useMemo, useCallback } from 'react';
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
  const brand = '#ffc801';
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
      console.log(response.data);
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
  
  // Get exact reservation date - prioritize day field (actual reservation date)
  const getReservationDate = (r) => {
    // First try the actual reservation day field
    if (r?.day) {
      // If day is already in YYYY-MM-DD format, return it
      if (typeof r.day === 'string' && r.day.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return r.day;
      }
      // If day is a date string, extract YYYY-MM-DD
      try {
        const dayDate = new Date(r.day);
        if (!isNaN(dayDate.getTime())) {
          return dayDate.toISOString().split('T')[0];
        }
      } catch (e) {
        // Continue to next option
      }
    }
    // Fallback to date field
    if (r?.date) {
      if (typeof r.date === 'string' && r.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return r.date;
      }
      try {
        const dateDate = new Date(r.date);
        if (!isNaN(dateDate.getTime())) {
          return dateDate.toISOString().split('T')[0];
        }
      } catch (e) {
        // Continue to next option
      }
    }
    // Last resort: use created_at (but this should be avoided)
    return toDateOnlyFromSpace(r?.created_at);
  };

  // Exact time parsing - ensure precise time matching
  const toDateTimeFromDateAndTime = (dateStr, timeStr) => {
    if (!dateStr) return '';
    if (!timeStr) return `${dateStr} 00:00`;
    
    const timeStrClean = String(timeStr).trim();
    // Handle various time formats: "HH:MM", "HH:MM:SS", etc.
    const timeMatch = timeStrClean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (timeMatch) {
      const h = String(parseInt(timeMatch[1], 10)).padStart(2, '0');
      const m = String(parseInt(timeMatch[2], 10)).padStart(2, '0');
      return `${dateStr} ${h}:${m}`;
    }
    // Fallback to original logic
    const [h = '00', m = '00'] = timeStrClean.split(':');
    return `${dateStr} ${String(parseInt(h, 10) || 0).padStart(2, '0')}:${String(parseInt(m, 10) || 0).padStart(2, '0')}`;
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
      // console.log('Event ID:', eventId);
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

  // Optimize navigation data preparation
  const navigationData = useMemo(() => {
    if (tab === 'studios') {
      return JSON.stringify(reservations);
    } else {
      return JSON.stringify(reservationsCowork);
    }
  }, [tab, reservations, reservationsCowork]);

  // Optimized navigation handler - immediate navigation for speed
  const handleDayPress = useCallback((day) => {
    setSelectedDate(day.dateString);
    
    // Immediate navigation for faster response
    if (tab === 'studios') {
      router.push({
        pathname: '/reservations/day',
        params: {
          date: day.dateString,
          tab,
          reservations: navigationData,
        },
      });
    } else if (tab === 'cowork') {
      router.push({
        pathname: '/reservations/day',
        params: {
          date: day.dateString,
          tab,
          reservationsCowork: navigationData,
        },
      });
    }
  }, [tab, navigationData, router]);

  const getStatusBadge = (reservation) => {
    // console.log(reservation);
    if (reservation.canceled) return { label: 'Canceled', bg: isDark ? '#374151' : '#E5E7EB', fg: isDark ? '#E5E7EB' : '#374151' };
    if (reservation.approved) return { label: 'Approved', bg: brand + '33', fg: brand };
    return { label: 'Pending', bg: isDark ? '#6B7280' : '#E5E7EB', fg: isDark ? '#E5E7EB' : '#374151' };
  };

  return (
    <AppLayout>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        <View className="mb-6">
          <Text className={`text-3xl font-bold ${isDark ? 'text-light' : 'text-beta'}`} style={{ color: isDark ? '#fafafa' : '#212529' }}>Reservations</Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ marginTop: 4, color: isDark ? '#9CA3AF' : '#6B7280' }}>Manage your studio and cowork bookings</Text>
        </View>

        {/* 🔹 Studios/Cowork Tabs */}
        <View className={`flex-row mb-4 rounded-2xl overflow-hidden ${isDark ? 'bg-dark_gray' : 'bg-gray-100'}`} style={{ padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Pressable
            className="flex-1 items-center py-3 rounded-xl"
            onPress={() => setTab('studios')}
            style={{ 
              backgroundColor: tab === 'studios' ? brand : 'transparent',
              shadowColor: tab === 'studios' ? brand : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: tab === 'studios' ? 0.3 : 0,
              shadowRadius: 4,
              elevation: tab === 'studios' ? 3 : 0,
            }}
          >
            <Text className={`font-semibold ${tab === 'studios' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>Studios</Text>
          </Pressable>
          <Pressable
            className="flex-1 items-center py-3 rounded-xl"
            onPress={() => setTab('cowork')}
            style={{ 
              backgroundColor: tab === 'cowork' ? brand : 'transparent',
              shadowColor: tab === 'cowork' ? brand : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: tab === 'cowork' ? 0.3 : 0,
              shadowRadius: 4,
              elevation: tab === 'cowork' ? 3 : 0,
            }}
          >
            <Text className={`font-semibold ${tab === 'cowork' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cowork</Text>
          </Pressable>
        </View>

        {/* 🔹 Calendar */}
        <View className={`${isDark ? 'bg-dark' : 'bg-white'} rounded-2xl`} style={{ padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: isDark ? '#1F2937' : '#E5E7EB' }}>
          <Calendar
            markedDates={{
              ...currentMarkedDates,
              ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: brand, selectedTextColor: '#ffffff' } } : {}),
            }}
            onDayPress={handleDayPress}
            enableSwipeMonths
            markingType="dot"
            hideExtraDays
            theme={{
              calendarBackground: 'transparent',
              dayTextColor: isDark ? '#E5E7EB' : '#212529',
              monthTextColor: isDark ? '#FFFFFF' : '#212529',
              arrowColor: brand,
              todayTextColor: brand,
              selectedDayBackgroundColor: brand,
              selectedDayTextColor: '#ffffff',
              textDisabledColor: isDark ? '#4B5563' : '#D1D5DB',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textMonthFontSize: 20,
              textDayHeaderFontSize: 13,
              'stylesheet.calendar.header': {
                monthText: {
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#212529',
                  marginTop: 6,
                  marginBottom: 10,
                },
                week: {
                  marginTop: 7,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 7,
                },
              },
            }}
            style={{
              borderRadius: 12,
            }}
          />
        </View>

        {/* 🔹 Today Quick Jump */}
        {/* <View className="items-start mt-2">
          <Pressable onPress={() => setSelectedDate(toDateOnly(new Date().toISOString()))} className="px-4 py-2 rounded-full bg-black/10 dark:bg-white/10">
            <Text className="text-black dark:text-white">Today</Text>
          </Pressable>
        </View> */}

        {/* 🔹 Reservation List */}
        {/* hadi hadik li kayna ltaht majatch zweena */}
        {/* {filtered.map((reservation) => (
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
        ))} */}

      </ScrollView>
    </AppLayout>
  );
}
