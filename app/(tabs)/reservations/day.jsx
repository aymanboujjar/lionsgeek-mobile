import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, RefreshControl, ScrollView, Alert, Modal } from 'react-native';
import { useAppContext } from '@/context';
import API from '@/api';
import AppLayout from '@/components/layout/AppLayout';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as CalendarAPI from 'expo-calendar';
import { format, startOfMonth, endOfMonth, addMonths, eachDayOfInterval } from 'date-fns';
import NewReservation from './reserve';

export default function DayView() {
  const { date } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const brand = '#4B9EEA';

  const [reservations, setReservations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [day, setDay] = useState(
    typeof date === 'string' && date.length >= 10
      ? date
      : new Date().toISOString().split('T')[0]
  );
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(day));
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState(null);
  const [pressY, setPressY] = useState(null);

  // ---- Fetch reservations ----
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

  // ---- Helper functions ----
  const toDateOnlyFromSpace = (datetime) => {
    if (!datetime) return '';
    const parts = String(datetime).split(' ');
    return parts[0] || '';
  };

  const getReservationDate = (r) => r.date || toDateOnlyFromSpace(r.created_at);

  const toDateTimeFromDateAndTime = (dateStr, timeStr) => {
    if (!dateStr) return '';
    const safeTimeStr = timeStr || '00:00'; // prevent undefined
    const [h = '00', m = '00'] = String(safeTimeStr).split(':');
    return `${dateStr} ${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  // ---- Event mapping ----
  const events = useMemo(() => {
    return reservations
      .filter((r) => getReservationDate(r) === day)
      .map((r) => ({
        id: r.id,
        start: toDateTimeFromDateAndTime(day, r.start),
        end: toDateTimeFromDateAndTime(day, r.end || r.start),
        title: r.title || 'Reservation',
        type: r.type,
        summary: r.location || '',
        color: r.canceled ? (isDark ? '#4B5563' : '#9CA3AF') : brand,
        rawStart: r.start,
        rawEnd: r.end || r.start,
        canceled: !!r.canceled,
      }));
  }, [reservations, day, isDark]);

  // ---- Timeline layout ----
  const HOUR_HEIGHT = 80;
  const START_MINUTES = 7 * 60 + 30;
  const END_MINUTES = 18 * 60 + 30;
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

  const innerScrollRef = useRef(null);
  const INITIAL_HOUR = 9;
  const scrollToInitialHour = () => {
    try {
      const y = toY(INITIAL_HOUR * 60);
      innerScrollRef.current?.scrollTo({ y, animated: false });
    } catch {}
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  // ---- Calendar header calculations ----
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonthDate);
    const end = endOfMonth(currentMonthDate);
    return eachDayOfInterval({ start, end });
  }, [currentMonthDate]);

  const goToPrevMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, -1));
  const goToNextMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, 1));
  const currentMonth = format(currentMonthDate, 'LLLL yyyy');
  const selectedDate = new Date(day);

  return (
    <AppLayout>
      {/* ===== Top Calendar Header ===== */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable onPress={goToPrevMonth}>
            <Text style={{ fontSize: 18, color: isDark ? '#E5E7EB' : '#111827' }}>‹</Text>
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#FFF' : '#000' }}>
            {currentMonth}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setShowNewReservation(true)}>
              <Text style={{ fontSize: 20, color: brand }}>＋</Text>
            </Pressable>

            <Pressable onPress={goToNextMonth}>
              <Text style={{ fontSize: 18, color: isDark ? '#E5E7EB' : '#111827' }}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* Weekday Labels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 8 }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Scrollable Days Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 8 }}>
          {daysInMonth.map((dateObj) => {
            const num = dateObj.getDate();
            const isSelected = format(dateObj, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            return (
              <Pressable
                key={num}
                onPress={() => setDay(format(dateObj, 'yyyy-MM-dd'))}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected ? brand : 'transparent',
                }}
              >
                <Text style={{ color: isSelected ? '#FFF' : isDark ? '#E5E7EB' : '#111827', fontWeight: isSelected ? '600' : '400' }}>
                  {num}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Subheader */}
        <Text style={{ marginTop: 8, color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center' }}>
          {format(new Date(day), 'EEE – d LLL yyyy')}
        </Text>
      </View>

      {/* ===== Timeline Scroll ===== */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 80 }}
      >
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
            {/* Hour Labels */}
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

            {/* Event Blocks */}
            <View style={{ flex: 1, position: 'relative' }}>
              {pressY !== null && (
                <View
                  style={{
                    position: 'absolute',
                    top: pressY - 15,
                    left: 0,
                    right: 0,
                    height: 30,
                    backgroundColor: 'rgba(75,158,234,0.3)',
                    borderRadius: 4,
                    zIndex: 3,
                  }}
                />
              )}

              
              <Pressable
                onLongPress={(event) => {
                  const y = event.nativeEvent.locationY;
                  setPressY(y);

                  const totalMinutes = START_MINUTES + (y / TOTAL_HEIGHT) * (END_MINUTES - START_MINUTES);
                  const roundedMinutes = Math.round(totalMinutes / 30) * 30;

                  const startHour = Math.floor(roundedMinutes / 60);
                  const startMin = roundedMinutes % 60;
                  const endMinutes = roundedMinutes + 30;
                  const endHour = Math.floor(endMinutes / 60);
                  const endMin = endMinutes % 60;

                  const startTime = `${String(startHour).padStart(2,'0')}:${String(startMin).padStart(2,'0')}`;
                  const endTime = `${String(endHour).padStart(2,'0')}:${String(endMin).padStart(2,'0')}`;

                  setSelectedTimeRange({ start: startTime, end: endTime });

                  setTimeout(() => setPressY(null), 2000); 
                  setTimeout(()=> setShowNewReservation(true) , 500)
                }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: TOTAL_HEIGHT, zIndex: 1 }}
              />

              {/* Hour grid lines */}
              {Array.from({ length: Math.floor(END_MINUTES / 60) - Math.floor(START_MINUTES / 60) + 1 }).map((_, idx) => {
                const hr = Math.floor(START_MINUTES / 60) + idx;
                const top = toY(hr * 60);
                return <View key={hr} style={{ position: 'absolute', top, left: 0, right: 0, height: 2, backgroundColor: isDark ? '#1F2937' : '#E5E7EB' }} />;
              })}

              {/* Render events */}
              {positioned.map((e, i) => (
                <Pressable
                  key={i}
                  onPress={() => e.id && router.push({ pathname: '/reservations/[id]', params: { id: e.id } })}
                  style={{
                    position: 'absolute',
                    top: e.top,
                    left: 8,
                    right: 8,
                    height: e.height,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: e.canceled ? (isDark ? '#374151' : '#E5E7EB') : brand,
                    opacity: e.canceled ? 0.6 : 1,
                    zIndex: 2,
                  }}
                >
                  <Text style={{ color: e.canceled ? (isDark ? '#E5E7EB' : '#111827') : '#ffffff', fontWeight: '600' }}>
                    {e.title}
                  </Text>
                  <Text style={{ color: e.canceled ? (isDark ? '#D1D5DB' : '#374151') : '#EAF3FF', marginTop: 2 }}>
                    {e.rawStart} - {e.rawEnd}
                  </Text>
                  {e.summary && <Text style={{ color: e.canceled ? (isDark ? '#D1D5DB' : '#374151') : '#EAF3FF', marginTop: 2 }}>{e.summary}</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      {/* New Reservation Modal */}
      {showNewReservation && (
        <Modal visible={showNewReservation} animationType="slide" transparent onRequestClose={() => setShowNewReservation(false)}>
          <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)', justifyContent: 'center', padding: 16 }}>
            <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#FFF', borderRadius: 16, overflow: 'hidden' }}>
              <NewReservation selectedDate={day} prefillTime={selectedTimeRange} />
            </View>

            <Pressable onPress={() => setShowNewReservation(false)} style={{ position: 'absolute', top: 40, right: 20, padding: 12, backgroundColor: brand, borderRadius: 20 }}>
              <Text style={{ color: '#FFF', fontWeight: '600' }}>✕</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </AppLayout>
  );
}
