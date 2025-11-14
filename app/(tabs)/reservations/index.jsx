import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as CalendarAPI from 'expo-calendar';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';
import { Colors } from '@/constants/Colors';

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
            const color = r.canceled ? Colors.dark_gray : Colors.alpha;
            const current = marked[date];
            if (!current) {
              marked[date] = { marked: true, dotColor: color };
            } else if (current.dotColor !== Colors.alpha && color === Colors.alpha) {
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
            const color = r.canceled ? Colors.dark_gray : Colors.alpha;
            const current = marked[date];
            if (!current) {
              marked[date] = { marked: true, dotColor: color };
            } else if (current.dotColor !== Colors.alpha && color === Colors.alpha) {
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
    if (reservation.canceled) return { label: 'Canceled', bg: Colors.dark_gray, fg: Colors.light };
    if (reservation.approved) return { label: 'Approved', bg: Colors.alpha + '33', fg: Colors.alpha };
    return { label: 'Pending', bg: Colors.dark_gray, fg: Colors.light };
  };

  return (
    <AppLayout>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.alpha} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        <View className="mb-8">
          <Text style={{ 
            fontSize: 32, 
            fontWeight: '800', 
            color: isDark ? Colors.light : Colors.beta,
            letterSpacing: -0.5,
            marginBottom: 6,
          }}>Reservations</Text>
          <Text style={{ 
            fontSize: 14, 
            color: isDark ? Colors.light + 'CC' : Colors.beta + 'CC',
            fontWeight: '500',
          }}>Manage your studio and cowork bookings</Text>
        </View>

        {/* 🔹 Studios/Cowork Tabs */}
        <View style={{ 
          flexDirection: 'row',
          marginBottom: 20,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: isDark ? Colors.dark_gray : Colors.light,
          padding: 4,
          shadowColor: Colors.dark,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: isDark ? Colors.dark : Colors.dark_gray + '20',
        }}>
          <Pressable
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: tab === 'studios' ? Colors.alpha : 'transparent',
              shadowColor: tab === 'studios' ? Colors.alpha : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: tab === 'studios' ? 0.25 : 0,
              shadowRadius: 6,
              elevation: tab === 'studios' ? 4 : 0,
            }}
            onPress={() => setTab('studios')}
          >
            <Text style={{
              fontWeight: '700',
              fontSize: 15,
              color: tab === 'studios' 
                ? Colors.dark 
                : (isDark ? Colors.light : Colors.beta)
            }}>Studios</Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: tab === 'cowork' ? Colors.alpha : 'transparent',
              shadowColor: tab === 'cowork' ? Colors.alpha : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: tab === 'cowork' ? 0.25 : 0,
              shadowRadius: 6,
              elevation: tab === 'cowork' ? 4 : 0,
            }}
            onPress={() => setTab('cowork')}
          >
            <Text style={{
              fontWeight: '700',
              fontSize: 15,
              color: tab === 'cowork' 
                ? Colors.dark 
                : (isDark ? Colors.light : Colors.beta)
            }}>Coworks</Text>
          </Pressable>
        </View>

        {/* 🔹 Calendar */}
        <View style={{
          backgroundColor: isDark ? Colors.dark : Colors.light,
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          shadowColor: Colors.dark,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 5,
          borderWidth: 1,
          borderColor: isDark ? Colors.dark_gray : Colors.dark_gray + '30',
        }}>
          <Calendar
            markedDates={{
              ...currentMarkedDates,
              ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: Colors.alpha, selectedTextColor: isDark ? Colors.dark : Colors.light } } : {}),
            }}
            onDayPress={handleDayPress}
            enableSwipeMonths
            markingType="dot"
            hideExtraDays
            theme={{
              backgroundColor: isDark ? Colors.dark : Colors.light,
              calendarBackground: isDark ? Colors.dark : Colors.light,
              dayTextColor: isDark ? Colors.light : Colors.beta,
              monthTextColor: isDark ? Colors.light : Colors.beta,
              arrowColor: Colors.alpha,
              todayTextColor: Colors.alpha,
              selectedDayBackgroundColor: Colors.alpha,
              selectedDayTextColor: isDark ? Colors.dark : Colors.light,
              textDisabledColor: isDark ? Colors.dark_gray : Colors.dark_gray + '80',
              textDayFontWeight: '600',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '700',
              textDayHeaderFontColor: isDark ? Colors.light : Colors.beta,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 13,
              'stylesheet.calendar.header': {
                monthText: {
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDark ? Colors.light : Colors.beta,
                  marginTop: 6,
                  marginBottom: 10,
                },
                week: {
                  marginTop: 7,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 7,
                },
                dayHeader: {
                  marginTop: 2,
                  marginBottom: 7,
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: '700',
                  color: isDark ? Colors.light : Colors.beta,
                },
              },
              'stylesheet.day.basic': {
                base: {
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? Colors.dark : 'transparent',
                },
            
                todayText: {
                  color: Colors.alpha,
                  fontWeight: '700',
                  fontSize: 16,
                },
                selected: {
                  backgroundColor: Colors.alpha,
                },
                selectedText: {
                  color: isDark ? Colors.dark : Colors.light,
                  fontWeight: '700',
                  fontSize: 16,
                },
                text: {
                  marginTop: 0,
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? Colors.light : Colors.beta,
                },
                disabledText: {
                  color: isDark ? Colors.dark_gray : Colors.dark_gray + '80',
                  opacity: 0.5,
                },
              },
            }}
            style={{
              borderRadius: 12,
              backgroundColor: isDark ? Colors.dark : Colors.light,
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
              backgroundColor: isDark ? Colors.dark : Colors.light,
              borderWidth: 1,
              borderColor: isDark ? Colors.dark_gray : Colors.dark_gray,
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
