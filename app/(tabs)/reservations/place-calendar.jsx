import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function PlaceCalendarScreen() {
  const { token } = useAppContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [reservations, setReservations] = useState([]);
  const [reservationsCowork, setReservationsCowork] = useState([]);
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse place from params
  useEffect(() => {
    if (params.place) {
      try {
        const parsedPlace = JSON.parse(params.place);
        setPlace(parsedPlace);
      } catch (e) {
        console.error('[PLACE_CALENDAR] Error parsing place:', e);
      }
    }
  }, [params.place]);

  // Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      if (!token) return;
      try {
        const [studiosRes, coworkRes] = await Promise.all([
          API.getWithAuth('mobile/reservations', token).catch(() => ({ data: { reservations: [] } })),
          API.getWithAuth('mobile/reservationsCowork', token).catch(() => ({ data: { reservations: [] } })),
        ]);
        setReservations(studiosRes?.data?.reservations || []);
        setReservationsCowork(coworkRes?.data?.reservations || []);
      } catch (error) {
        console.error('[PLACE_CALENDAR] Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token && place) {
      fetchReservations();
    }
  }, [token, place]);

  // Calculate marked dates for this specific place
  const markedDates = useMemo(() => {
    if (!place) return {};
    const marked = {};
    const relevantReservations = place.type === 'cowork' || place.type === 'meeting' 
      ? reservationsCowork 
      : reservations;

    // For cowork card, check all cowork reservations
    if (place.id === 'cowork-all' && place.allCoworks) {
      const coworkIds = place.allCoworks.map(c => c.id);
      relevantReservations
        .filter(r => coworkIds.includes(r.place_id) || coworkIds.includes(r.cowork_id) || coworkIds.includes(r.table_id))
        .forEach((r) => {
          const date = r.day || r.date;
          if (date) {
            const dateStr = typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)
              ? date
              : new Date(date).toISOString().split('T')[0];
            if (dateStr) {
              const color = r.canceled ? Colors.dark_gray : Colors.alpha;
              if (!marked[dateStr] || marked[dateStr].dotColor !== Colors.alpha) {
                marked[dateStr] = { marked: true, dotColor: color };
              }
            }
          }
        });
    } else {
      // For regular places
      relevantReservations
        .filter(r => r.studio_id === place.id || r.place_id === place.id)
        .forEach((r) => {
          const date = r.day || r.date;
          if (date) {
            const dateStr = typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)
              ? date
              : new Date(date).toISOString().split('T')[0];
            if (dateStr) {
              const color = r.canceled ? Colors.dark_gray : Colors.alpha;
              if (!marked[dateStr] || marked[dateStr].dotColor !== Colors.alpha) {
                marked[dateStr] = { marked: true, dotColor: color };
              }
            }
          }
        });
    }
    return marked;
  }, [place, reservations, reservationsCowork]);

  const handleDayPress = useCallback((day) => {
    if (!place) return;
    const tab = place.type === 'cowork' || place.type === 'meeting' ? 'cowork' : 'studios';
    const relevantReservations = place.type === 'cowork' || place.type === 'meeting' 
      ? reservationsCowork 
      : reservations;
    
    router.push({
      pathname: '/reservations/day',
      params: {
        date: day.dateString,
        tab,
        place: JSON.stringify(place), // Pass the place data
        ...(tab === 'cowork' 
          ? { reservationsCowork: JSON.stringify(relevantReservations) }
          : { reservations: JSON.stringify(relevantReservations) }
        ),
      },
    });
  }, [place, reservations, reservationsCowork, router]);

  const getImageUrl = () => {
    if (!place) return null;
    if (place.image) {
      if (place.image.startsWith('http')) return place.image;
      return `${API.APP_URL || ''}/storage/${place.image}`;
    }
    return null;
  };

  // Memoized calendar theme
  const calendarTheme = useMemo(() => ({
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
  }), [isDark]);

  if (loading || !place) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center bg-light dark:bg-dark">
          <Text className="text-black/60 dark:text-white/60 text-base">
            Loading calendar...
          </Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView
        className="flex-1 bg-light dark:bg-dark"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Place Header Card */}
        <View style={styles.placeHeaderCard(isDark)}>
          <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => [
              styles.backButton(isDark),
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? Colors.light : Colors.beta} />
          </Pressable>
          <View style={styles.placeHeaderContent}>
            {getImageUrl() ? (
              <Image
                source={{ uri: getImageUrl() }}
                style={styles.placeHeaderImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeHeaderImagePlaceholder}>
                <Ionicons name="business-outline" size={32} color={Colors.alpha} />
              </View>
            )}
            <View style={styles.placeHeaderText}>
              <Text style={styles.placeHeaderName(isDark)} numberOfLines={1}>
                {place.name}
              </Text>
              <Text style={styles.placeHeaderSubtitle(isDark)}>
                Select a date to reserve
              </Text>
            </View>
          </View>
        </View>

        {/* Place Calendar */}
        <View style={styles.placeCalendarCard(isDark)}>
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDayPress}
            enableSwipeMonths
            markingType="dot"
            hideExtraDays
            theme={calendarTheme}
            style={styles.placeCalendar}
            minDate={new Date().toISOString().split('T')[0]}
          />
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  placeHeaderCard: (isDark) => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? Colors.dark : Colors.light,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: isDark ? Colors.dark_gray : Colors.dark_gray + '30',
  }),
  backButton: (isDark) => ({
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDark ? Colors.dark_gray : Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: isDark ? Colors.dark : Colors.dark_gray + '20',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }),
  placeHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeHeaderImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
    marginRight: 14,
  },
  placeHeaderImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: Colors.alpha + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeHeaderText: {
    flex: 1,
  },
  placeHeaderName: (isDark) => ({
    fontSize: 22,
    fontWeight: '800',
    color: isDark ? Colors.light : Colors.beta,
    marginBottom: 6,
    letterSpacing: -0.5,
  }),
  placeHeaderSubtitle: (isDark) => ({
    fontSize: 15,
    color: isDark ? Colors.light + 'CC' : Colors.beta + 'CC',
    fontWeight: '500',
  }),
  placeCalendarCard: (isDark) => ({
    backgroundColor: isDark ? Colors.dark : Colors.light,
    borderRadius: 20,
    padding: 16,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: isDark ? Colors.dark_gray : Colors.dark_gray + '30',
  }),
  placeCalendar: {
    borderRadius: 12,
  },
});

