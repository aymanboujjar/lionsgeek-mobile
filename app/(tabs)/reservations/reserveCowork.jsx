import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '@/context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import API from '@/api';
import { Colors } from '@/constants/Colors';
import { format } from 'date-fns';

export default function NewCoworkReservation({ selectedDate, prefillTime, onClose }) {
  const { user, token } = useAppContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Form state
  const [table, setTable] = useState('');
  const [seats, setSeats] = useState('');
  const [day, setDay] = useState(selectedDate || format(new Date(), 'yyyy-MM-dd'));
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

  // Set day from selectedDate
  useEffect(() => {
    if (selectedDate) {
      setDay(selectedDate);
    }
  }, [selectedDate]);

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

          {/* Day Selection */}
          <View>
            <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-2`} style={{ fontSize: 14 }}>Date *</Text>
            <Pressable
              onPress={() => setShowDayPicker(true)}
              style={{
                borderRadius: 12,
                padding: 16,
                borderWidth: 2,
                borderColor: showDayPicker ? Colors.alpha : Colors.dark_gray,
                backgroundColor: isDark ? Colors.dark_gray : Colors.light,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: showDayPicker ? Colors.alpha : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: showDayPicker ? 0.3 : 0,
                shadowRadius: 4,
                elevation: showDayPicker ? 4 : 0,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                    backgroundColor: Colors.alpha + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>📅</Text>
                </View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600',
                  color: isDark ? Colors.light : Colors.beta
                }}>
                  {day ? format(new Date(day), 'EEEE, MMMM d, yyyy') : 'Select date'}
                </Text>
              </View>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: showDayPicker ? Colors.alpha : 'transparent',
              }} />
            </Pressable>
            {showDayPicker && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
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
                />
                <Pressable
                  onPress={() => setShowDayPicker(false)}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: Colors.alpha,
                  }}
                >
                  <Text style={{ color: Colors.light, fontWeight: '600', fontSize: 14 }}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Start Time */}
          <View>
            <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-2`} style={{ fontSize: 14 }}>Start Time *</Text>
            <Pressable
              onPress={() => setShowStartPicker(true)}
              style={{
                borderRadius: 12,
                padding: 16,
                borderWidth: 2,
                borderColor: showStartPicker ? Colors.alpha : Colors.dark_gray,
                backgroundColor: isDark ? Colors.dark_gray : Colors.light,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: showStartPicker ? Colors.alpha : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: showStartPicker ? 0.3 : 0,
                shadowRadius: 4,
                elevation: showStartPicker ? 4 : 0,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                    backgroundColor: Colors.alpha + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>🕐</Text>
                </View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600',
                  color: isDark ? Colors.light : Colors.beta
                }}>
                  {startTime ? format(startTime, 'HH:mm') : 'Select start time'}
                </Text>
              </View>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: showStartPicker ? Colors.alpha : 'transparent',
              }} />
            </Pressable>
            {showStartPicker && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
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
                />
                <Pressable
                  onPress={() => setShowStartPicker(false)}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: Colors.alpha,
                  }}
                >
                  <Text style={{ color: Colors.light, fontWeight: '600', fontSize: 14 }}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* End Time */}
          <View>
            <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-2`} style={{ fontSize: 14 }}>End Time *</Text>
            <Pressable
              onPress={() => setShowEndPicker(true)}
              style={{
                borderRadius: 12,
                padding: 16,
                borderWidth: 2,
                borderColor: showEndPicker ? Colors.alpha : Colors.dark_gray,
                backgroundColor: isDark ? Colors.dark_gray : Colors.light,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: showEndPicker ? Colors.alpha : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: showEndPicker ? 0.3 : 0,
                shadowRadius: 4,
                elevation: showEndPicker ? 4 : 0,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                    backgroundColor: Colors.alpha + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>🕐</Text>
                </View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600',
                  color: isDark ? Colors.light : Colors.beta
                }}>
                  {endTime ? format(endTime, 'HH:mm') : 'Select end time'}
                </Text>
              </View>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: showEndPicker ? Colors.alpha : 'transparent',
              }} />
            </Pressable>
            {showEndPicker && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
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
                />
                <Pressable
                  onPress={() => setShowEndPicker(false)}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: Colors.alpha,
                  }}
                >
                  <Text style={{ color: Colors.light, fontWeight: '600', fontSize: 14 }}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

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
          <View className={`${isDark ? 'bg-dark_gray' : 'bg-white'} items-center`} style={{ padding: 20, borderRadius: 12 }}>
            <Text className={`${isDark ? 'text-light' : 'text-beta'}`} style={{ fontSize: 18, marginBottom: 16 }}>
              Reservation Created Successfully!
            </Text>

            <Pressable
              onPress={() => {
                setShowModal(false);
                if (onClose) onClose();
                router.replace('/reservations/day');
              }}
              className="bg-alpha"
              style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
            >
              <Text className="text-white" style={{ fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

