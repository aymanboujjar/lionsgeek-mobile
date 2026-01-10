import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '@/context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import API from '@/api';
import { Colors } from '@/constants/Colors';
import { format } from 'date-fns';
import * as CalendarAPI from 'expo-calendar';

export default function NewCoworkReservation({ selectedDate: propSelectedDate, prefillTime, onClose }) {
  const { user, token } = useAppContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get placeId and selectedDate from route params or props
  const routePlaceId = params.placeId;
  const routeSelectedDate = params.selectedDate || propSelectedDate;

  // Form state
  const [table, setTable] = useState(routePlaceId || '');
  const [seats, setSeats] = useState('');
  const [day, setDay] = useState(routeSelectedDate || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Data state
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [createdReservation, setCreatedReservation] = useState(null);

  // Prefill times if provided
  useEffect(() => {
    if (prefillTime) {
      const toDate = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(h);
        d.setMinutes(m);
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d;
      };

      setStartTime(toDate(prefillTime.start));
      setEndTime(toDate(prefillTime.end));
    }
  }, [prefillTime]);

  // Set day from selectedDate (route param or prop)
  useEffect(() => {
    if (routeSelectedDate) {
      setDay(routeSelectedDate);
    }
  }, [routeSelectedDate]);

  // Set table from route params
  useEffect(() => {
    if (routePlaceId) {
      setTable(routePlaceId);
    }
  }, [routePlaceId]);

  // Fetch tables from places
  useEffect(() => {
    if (!token) return;

    setLoadingTables(true);
    API.getWithAuth('places', token)
      .then(res => {
        // Check if response has tables or if we need to extract from a different structure
        const placesData = res.data || {};
        console.log(placesData);
        
        // Try different possible structures
        const tablesData =  placesData.coworks;
        setTables(Array.isArray(tablesData) ? tablesData : []);
      })
      .catch(err => {
        console.error('Tables fetch error', err);
        Alert.alert('Error', 'Failed to load tables. Please try again.');
      })
      .finally(() => setLoadingTables(false));
  }, [token]);

  // Validation
  const validateForm = () => {
    if (!table) {
      Alert.alert('Validation Error', 'Please select a table');
      return false;
    }
    if (!seats || parseInt(seats) < 1) {
      Alert.alert('Validation Error', 'Please enter at least 1 seat');
      return false;
    }
    if (!day) {
      Alert.alert('Validation Error', 'Please select a date');
      return false;
    }
    if (!startTime || !endTime) {
      Alert.alert('Validation Error', 'Please select start and end times');
      return false;
    }
    if (startTime >= endTime) {
      Alert.alert('Validation Error', 'End time must be after start time');
      return false;
    }
    return true;
  };

  // Submit reservation
  const submitReservation = async () => {
    if (!validateForm()) return;
    if (!token) return;

    setSubmitting(true);

    const payload = {
      table: parseInt(table),
      seats: parseInt(seats),
      day: day,
      start: format(startTime, 'HH:mm'),
      end: format(endTime, 'HH:mm'),
    };

    try {
      const response = await API.postWithAuth('cowork/reserve', payload, token);
      // Store the created reservation data for calendar
      const selectedTable = tables.find(t => t.id === parseInt(table));
      setCreatedReservation({
        title: `Cowork Reservation - ${selectedTable?.name || `Table ${table}`}`,
        day: day,
        start: format(startTime, 'HH:mm'),
        end: format(endTime, 'HH:mm'),
        location: selectedTable?.name || `Table ${table}`,
        seats: seats,
        ...(response.data?.reservation || {}),
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error creating cowork reservation:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to create reservation. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  // Calendar functions - Use default phone calendar
  const ensureCalendarExists = async () => {
    const { status } = await CalendarAPI.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant calendar access to add events.');
      return null;
    }

    const calendars = await CalendarAPI.getCalendarsAsync(CalendarAPI.EntityTypes.EVENT);
    const modifiable = calendars.filter((cal) => cal.allowsModifications);
    
    if (modifiable.length === 0) {
      Alert.alert('No Calendar', 'No modifiable calendar found.');
      return null;
    }

    // Find default calendar (usually the first one or one marked as default)
    // Prefer native/local calendars over synced ones
    const defaultCalendar = modifiable.find(cal => 
      cal.isPrimary || 
      cal.source?.type === 'local' ||
      cal.source?.title?.toLowerCase().includes('default')
    ) || modifiable[0]; // Fallback to first available

    return defaultCalendar.id;
  };

  const addToDeviceCalendar = async () => {
    if (!createdReservation) return;

    try {
      const calendarId = await ensureCalendarExists();
      if (!calendarId) return;

      const startDateTime = new Date(`${createdReservation.day} ${createdReservation.start}`);
      const endDateTime = new Date(`${createdReservation.day} ${createdReservation.end}`);

      const event = {
        title: createdReservation.title || 'Cowork Reservation',
        startDate: startDateTime,
        endDate: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: createdReservation.location || '',
        notes: `Seats: ${createdReservation.seats || 'N/A'}`,
        alarms: [{ relativeOffset: -15, method: CalendarAPI.AlarmMethod.ALERT }],
      };

      const eventId = await CalendarAPI.createEventAsync(calendarId, event);
      Alert.alert('✅ Added', 'Event added to your calendar successfully!');
    } catch (err) {
      console.error('Add to calendar error:', err);
      Alert.alert('Error', 'Failed to add to calendar.');
    }
  };

  return (
    <View className={`${isDark ? 'bg-dark' : 'bg-light'}`} style={{ flex: 1, paddingTop: 60 }}>
      {/* Header */}
      <View className={`${isDark ? 'bg-dark_gray' : 'bg-white'} border-b ${isDark ? 'border-dark' : 'border-beta/20'}`} style={{ paddingHorizontal: 16, paddingVertical: 12, marginBottom: 6 }}>
        <View className="flex-row justify-between items-center">
          <Pressable 
            onPress={handleCancel}
            className={`${isDark ? 'bg-dark' : 'bg-light'}`}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
          >
            <Text className="text-alpha font-semibold" style={{ fontSize: 14 }}>
              Cancel
            </Text>
          </Pressable>

          <Text className={`${isDark ? 'text-light' : 'text-beta'} font-bold`} style={{ fontSize: 18 }}>
             Cowork Reservation
          </Text>

          <Pressable 
            onPress={submitReservation}
            disabled={submitting}
            className="bg-alpha"
            style={{ 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 8,
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                Done ✓
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Form */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ gap: 14, paddingTop: 12, paddingBottom: 32 }}>
          {/* Table Selection */}
          <View>
            <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-2`} style={{ fontSize: 14 }}>Table *</Text>
            {loadingTables ? (
              <ActivityIndicator color={Colors.alpha} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 4 }}>
                  {tables.length === 0 ? (
                    <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: 14, padding: 12 }}>
                      No tables available
                    </Text>
                  ) : (
                    tables.map((tbl) => {
                      const isSelected = table === tbl.id?.toString() || table === tbl.id;
                      return (
                        <Pressable
                          key={tbl.id}
                          onPress={() => setTable(tbl.id?.toString() || tbl.id)}
                          style={{
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 12,
                            borderWidth: isSelected ? 3 : 1,
                            borderColor: isSelected ? Colors.alpha : Colors.dark_gray,
                            backgroundColor: isSelected ? (isDark ? Colors.dark_gray : Colors.light) : (isDark ? Colors.dark : Colors.light),
                            shadowColor: isSelected ? Colors.alpha : 'transparent',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isSelected ? 0.3 : 0,
                            shadowRadius: 4,
                            elevation: isSelected ? 4 : 0,
                          }}
                        >
                          <Text style={{ 
                            color: isSelected ? Colors.alpha : (isDark ? Colors.light : Colors.beta), 
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: 16
                          }}>
                            {tbl.name || `Table ${tbl.id}`}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            )}
          </View>

          {/* Seats */}
          <View>
            <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-1.5`} style={{ fontSize: 14 }}>Seats *</Text>
            <TextInput
              value={seats}
              onChangeText={(text) => {
                // Only allow numbers
                const numericValue = text.replace(/[^0-9]/g, '');
                setSeats(numericValue);
              }}
              placeholder="Number of seats"
              placeholderTextColor={Colors.dark_gray}
              keyboardType="number-pad"
              className={`${isDark ? 'bg-dark_gray text-light' : 'bg-white text-beta'} border ${isDark ? 'border-dark' : 'border-beta/20'}`}
              style={{
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                borderWidth: 1,
              }}
            />
          </View>

          {/* Date Selection */}
          <View>
            <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-2`} style={{ fontSize: 14 }}>Date *</Text>
            <Pressable
              onPress={() => setShowDayPicker(true)}
              style={{
                borderRadius: 16,
                padding: 18,
                borderWidth: 2,
                borderColor: showDayPicker ? Colors.alpha : (isDark ? Colors.dark_gray : Colors.dark_gray + '40'),
                backgroundColor: isDark ? Colors.dark_gray : Colors.light,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: showDayPicker ? Colors.alpha : Colors.dark,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: showDayPicker ? 0.25 : 0.1,
                shadowRadius: 8,
                elevation: showDayPicker ? 5 : 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: Colors.alpha + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 24 }}>📅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {day ? (
                    <>
                      <Text style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: isDark ? Colors.light : Colors.beta,
                        marginBottom: 2,
                      }}>
                        {format(new Date(day), 'EEEE')}
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: isDark ? Colors.light + 'CC' : Colors.beta + 'CC',
                      }}>
                        {format(new Date(day), 'MMMM d, yyyy')}
                      </Text>
                    </>
                  ) : (
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: isDark ? Colors.light + '80' : Colors.beta + '80'
                    }}>
                      Select date
                    </Text>
                  )}
                </View>
              </View>
              <View style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: showDayPicker ? Colors.alpha : 'transparent',
                shadowColor: showDayPicker ? Colors.alpha : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
              }} />
            </Pressable>
          </View>

          {/* Start Time */}
          <View>
            <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-2`} style={{ fontSize: 14 }}>Start Time *</Text>
            <Pressable
              onPress={() => setShowStartPicker(true)}
              style={{
                borderRadius: 16,
                padding: 18,
                borderWidth: 2,
                borderColor: showStartPicker ? Colors.alpha : (isDark ? Colors.dark_gray : Colors.dark_gray + '40'),
                backgroundColor: isDark ? Colors.dark_gray : Colors.light,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: showStartPicker ? Colors.alpha : Colors.dark,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: showStartPicker ? 0.25 : 0.1,
                shadowRadius: 8,
                elevation: showStartPicker ? 5 : 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: Colors.alpha + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 24 }}>🕐</Text>
                </View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: isDark ? Colors.light : Colors.beta,
                  letterSpacing: 1,
                }}>
                  {startTime ? format(startTime, 'HH:mm') : '--:--'}
                </Text>
              </View>
              <View style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: showStartPicker ? Colors.alpha : 'transparent',
                shadowColor: showStartPicker ? Colors.alpha : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
              }} />
            </Pressable>
          </View>

          {/* End Time */}
          <View>
            <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-2`} style={{ fontSize: 14 }}>End Time *</Text>
            <Pressable
              onPress={() => setShowEndPicker(true)}
              style={{
                borderRadius: 16,
                padding: 18,
                borderWidth: 2,
                borderColor: showEndPicker ? Colors.alpha : (isDark ? Colors.dark_gray : Colors.dark_gray + '40'),
                backgroundColor: isDark ? Colors.dark_gray : Colors.light,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: showEndPicker ? Colors.alpha : Colors.dark,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: showEndPicker ? 0.25 : 0.1,
                shadowRadius: 8,
                elevation: showEndPicker ? 5 : 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: Colors.alpha + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 24 }}>🕐</Text>
                </View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: isDark ? Colors.light : Colors.beta,
                  letterSpacing: 1,
                }}>
                  {endTime ? format(endTime, 'HH:mm') : '--:--'}
                </Text>
              </View>
              <View style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: showEndPicker ? Colors.alpha : 'transparent',
                shadowColor: showEndPicker ? Colors.alpha : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
              }} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDayPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: isDark ? Colors.dark + 'E6' : Colors.dark + '80',
          justifyContent: 'flex-end',
        }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowDayPicker(false)}
          />
          <View style={{
            backgroundColor: isDark ? Colors.dark_gray : Colors.light,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
            shadowColor: Colors.dark,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '800',
                color: isDark ? Colors.light : Colors.beta,
              }}>
                Select Date
              </Text>
              <Pressable
                onPress={() => setShowDayPicker(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDark ? Colors.dark : Colors.dark_gray + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, color: isDark ? Colors.light : Colors.beta }}>✕</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={new Date(day || new Date())}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={(event, selected) => {
                if (event.type === 'set' && selected) {
                  setDay(format(selected, 'yyyy-MM-dd'));
                }
                if (event.type === 'dismissed') {
                  setShowDayPicker(false);
                }
              }}
              style={{ width: '100%' }}
              textColor={isDark ? Colors.light : Colors.beta}
            />
            <Pressable
              onPress={() => setShowDayPicker(false)}
              style={{
                marginTop: 20,
                paddingVertical: 16,
                borderRadius: 14,
                backgroundColor: Colors.alpha,
                alignItems: 'center',
                shadowColor: Colors.alpha,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Text style={{
                color: Colors.dark,
                fontWeight: '700',
                fontSize: 16,
                letterSpacing: 0.5,
              }}>
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Start Time Picker Modal */}
      <Modal
        visible={showStartPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartPicker(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: isDark ? Colors.dark + 'E6' : Colors.dark + '80',
          justifyContent: 'flex-end',
        }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowStartPicker(false)}
          />
          <View style={{
            backgroundColor: isDark ? Colors.dark_gray : Colors.light,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
            shadowColor: Colors.dark,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '800',
                color: isDark ? Colors.light : Colors.beta,
              }}>
                Select Start Time
              </Text>
              <Pressable
                onPress={() => setShowStartPicker(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDark ? Colors.dark : Colors.dark_gray + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, color: isDark ? Colors.light : Colors.beta }}>✕</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={(event, selected) => {
                if (event.type === 'set' && selected) {
                  setStartTime(selected);
                }
                if (event.type === 'dismissed') {
                  setShowStartPicker(false);
                }
              }}
              style={{ width: '100%' }}
              textColor={isDark ? Colors.light : Colors.beta}
            />
            <Pressable
              onPress={() => setShowStartPicker(false)}
              style={{
                marginTop: 20,
                paddingVertical: 16,
                borderRadius: 14,
                backgroundColor: Colors.alpha,
                alignItems: 'center',
                shadowColor: Colors.alpha,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Text style={{
                color: Colors.dark,
                fontWeight: '700',
                fontSize: 16,
                letterSpacing: 0.5,
              }}>
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal
        visible={showEndPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndPicker(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: isDark ? Colors.dark + 'E6' : Colors.dark + '80',
          justifyContent: 'flex-end',
        }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowEndPicker(false)}
          />
          <View style={{
            backgroundColor: isDark ? Colors.dark_gray : Colors.light,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
            shadowColor: Colors.dark,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '800',
                color: isDark ? Colors.light : Colors.beta,
              }}>
                Select End Time
              </Text>
              <Pressable
                onPress={() => setShowEndPicker(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDark ? Colors.dark : Colors.dark_gray + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, color: isDark ? Colors.light : Colors.beta }}>✕</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={endTime}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={(event, selected) => {
                if (event.type === 'set' && selected) {
                  setEndTime(selected);
                }
                if (event.type === 'dismissed') {
                  setShowEndPicker(false);
                }
              }}
              style={{ width: '100%' }}
              textColor={isDark ? Colors.light : Colors.beta}
            />
            <Pressable
              onPress={() => setShowEndPicker(false)}
              style={{
                marginTop: 20,
                paddingVertical: 16,
                borderRadius: 14,
                backgroundColor: Colors.alpha,
                alignItems: 'center',
                shadowColor: Colors.alpha,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Text style={{
                color: Colors.dark,
                fontWeight: '700',
                fontSize: 16,
                letterSpacing: 0.5,
              }}>
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      {showModal && (
        <View className="justify-center items-center" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          padding: 20 
        }}>
          <View className={`${isDark ? 'bg-dark_gray' : 'bg-white'}`} style={{ padding: 20, borderRadius: 12, minWidth: 280 }}>
            <Text className={`${isDark ? 'text-light' : 'text-beta'}`} style={{ fontSize: 18, marginBottom: 20, textAlign: 'center', fontWeight: '700' }}>
              Reservation Created Successfully!
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
              <Pressable
                onPress={addToDeviceCalendar}
                style={{ 
                  flex: 1,
                  paddingVertical: 12, 
                  paddingHorizontal: 16, 
                  borderRadius: 8,
                  backgroundColor: isDark ? Colors.dark : Colors.light,
                  borderWidth: 1.5,
                  borderColor: Colors.alpha,
                }}
              >
                <Text style={{ 
                  color: Colors.alpha, 
                  fontWeight: '700', 
                  fontSize: 14,
                  textAlign: 'center',
                }}>
                  📅 Add to Calendar
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowModal(false);
                  if (onClose) onClose();
                  // router.replace('/reservations/day');
                }}
                className="bg-alpha"
                style={{ 
                  flex: 1,
                  paddingVertical: 12, 
                  paddingHorizontal: 16, 
                  borderRadius: 8 
                }}
              >
                <Text className="text-white" style={{ fontWeight: '700', fontSize: 14, textAlign: 'center' }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

