import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Switch,
  Image,
  FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '@/context';
import { Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useColorScheme } from '@/hooks/useColorScheme';
import API from '@/api';
import { Colors } from '@/constants/Colors';
import { format } from 'date-fns';
import * as CalendarAPI from 'expo-calendar';
export default function NewReservation({ selectedDate: propSelectedDate, prefillTime, onClose }) {
  const { user, token } = useAppContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Get placeId and selectedDate from route params or props
  const routePlaceId = params.placeId;
  const routeSelectedDate = params.selectedDate || propSelectedDate;
  
  const [step, setStep] = useState(routePlaceId ? 2 : 1); // Skip step 1 if place is pre-selected
  const [showModal, setShowModal] = useState(false);
  const [createdReservation, setCreatedReservation] = useState(null);
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

  // Set studio from route params
  useEffect(() => {
    if (routePlaceId) {
      setStudio(routePlaceId);
    }
  }, [routePlaceId]);


  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [studio, setStudio] = useState('');
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);


  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);


  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const [day, setDay] = useState(routeSelectedDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);


  useEffect(() => {
    if (!token) return;

    // Fetch places 
    if (step === 1 && places.length === 0) {
      setLoadingPlaces(true);
      API.getWithAuth('places', token)
        .then(res => setPlaces(res.data?.studios || []))
        .catch(err => console.error('Places fetch error', err))
        .finally(() => setLoadingPlaces(false));
    }

    // Fetch users 
    if (step === 2 && users.length === 0) {
      setLoadingUsers(true);
      API.getWithAuth('users', token)
        .then(res => setUsers(res.data || []))
        .catch(err => console.error('Users fetch error', err))
        .finally(() => setLoadingUsers(false));
    }

    // Fetch equipment 
    if (step === 3 && equipment.length === 0) {
      setLoadingEquipment(true);
      API.getWithAuth('equipment', token)
        .then(res => setEquipment(res.data || []))
        .catch(err => console.error('Equipment fetch error', err))
        .finally(() => setLoadingEquipment(false));
    }

  }, [step, token]);

  const toggleUser = (id) =>
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleEquipment = (id) =>
    setSelectedEquipment(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const submitReservation = async () => {
    if (!token) return;

    const payload = {
      title: name,
      description,
      studio_id: studio,
      day: day,
      start: startTime.toTimeString().slice(0, 5),
      end: endTime.toTimeString().slice(0, 5),
      user_id: user.id,
      team_members: selectedUsers,
      equipment: selectedEquipment,
    };

    // console.log('Submitting reservation:', payload);

    try {
      const response = await API.postWithAuth('reservations/store', payload, token);
      // console.log('Reservation created:', response.data);
      // Store the created reservation data for calendar
      setCreatedReservation({
        title: `Studio Reservation - ${name}`,
        description,
        day: day,
        start: startTime.toTimeString().slice(0, 5),
        end: endTime.toTimeString().slice(0, 5),
        location: places.find(p => p.id === studio)?.name || 'Studio',
        ...(response.data?.reservation || {}),
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      prevStep();
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
        title: createdReservation.title || 'Reservation',
        startDate: startDateTime,
        endDate: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: createdReservation.location || '',
        notes: createdReservation.description || '',
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
            onPress={step > 1 ? prevStep : handleCancel}
            className={`${isDark ? 'bg-dark' : 'bg-light'}`}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
          >
            <Text className="text-alpha font-semibold" style={{ fontSize: 14 }}>
              {step > 1 ? '← Back' : 'Cancel'}
          </Text>
        </Pressable>

          <Text className={`${isDark ? 'text-light' : 'text-beta'} font-bold`} style={{ fontSize: 18 }}>
          New Reservation
        </Text>

          <Pressable
            onPress={step === 3 ? submitReservation : nextStep}
            className="bg-alpha"
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 14 }}>
              {step === 3 ? 'Done ✓' : 'Next →'}
          </Text>
        </Pressable>
        </View>
      </View>

      {/* Step indicator */}
      <View className="flex-row justify-center items-center" style={{ gap: 8, marginBottom: 12, paddingHorizontal: 16 }}>
        {[1, 2, 3].map((n) => (
          <View key={n} className="flex-row items-center">
      <View
        style={{
                width: step >= n ? 40 : 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: step >= n ? Colors.alpha : Colors.dark_gray,
                transition: 'width 0.3s',
              }}
            />
            {n < 3 && (
          <View
            style={{
                  width: 20,
                  height: 2,
                  backgroundColor: step > n ? Colors.alpha : Colors.dark_gray,
                  marginHorizontal: 4,
                }}
              />
            )}
          </View>
        ))}
      </View>

      {/* Steps */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={{ gap: 14 }}>
            {/* Name field */}
            <View>
              <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-1.5`} style={{ fontSize: 14 }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Reservation name"
                placeholderTextColor={Colors.dark_gray}
                className={`${isDark ? 'bg-dark_gray text-light' : 'bg-white text-beta'} border ${isDark ? 'border-dark' : 'border-beta/20'}`}
              style={{
                borderRadius: 10,
                padding: 12,
                  fontSize: 14,
                  borderWidth: 1,
              }}
            />
            </View>

            {/* Description */}
            <View>
              <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-1.5`} style={{ fontSize: 14 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description..."
                placeholderTextColor={Colors.dark_gray}
              multiline
                className={`${isDark ? 'bg-dark_gray text-light' : 'bg-white text-beta'} border ${isDark ? 'border-dark' : 'border-beta/20'}`}
              style={{
                borderRadius: 10,
                padding: 12,
                  height: 90,
                  fontSize: 14,
                  borderWidth: 1,
                  textAlignVertical: 'top',
                }}
              />
            </View>
            {/* Studio */}
            <View>
              <Text className={`${isDark ? 'text-light' : 'text-beta'} font-semibold mb-3`} style={{ fontSize: 16 }}>
              Studio
            </Text>

            {loadingPlaces ? (
                <ActivityIndicator color={Colors.alpha} />
            ) : (
              <FlatList
                data={places} // fetched studios
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8, gap: 12 }}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = studio === item.id;
                  return (
                    <Pressable
                      onPress={() => setStudio(item.id)}
                      style={{
                          borderWidth: isSelected ? 3 : 1,
                          borderColor: isSelected ? Colors.alpha : Colors.dark_gray,
                          borderRadius: 16,
                        overflow: 'hidden',
                        alignItems: 'center',
                        marginRight: 8,
                          backgroundColor: isSelected ? (isDark ? Colors.dark_gray : Colors.light) : (isDark ? Colors.dark : Colors.light),
                          shadowColor: isSelected ? Colors.alpha : 'transparent',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isSelected ? 0.3 : 0,
                          shadowRadius: 4,
                          elevation: isSelected ? 4 : 0,
                      }}
                    >
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={{ width: 100, height: 80, resizeMode: 'cover' }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 100,
                            height: 80,
                              backgroundColor: Colors.dark_gray,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                            <Text className={`${isDark ? 'text-light' : 'text-beta'}`}>No Image</Text>
                        </View>
                      )}
                        <Text style={{ color: isDark ? Colors.light : Colors.dark, fontWeight: isSelected ? '600' : '400', padding: 4 }}>
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            )}
            </View>

            {/* Date Selection */}
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

        )}

        {step === 2 && (
          <View>
            <Text
              className={`${isDark ? 'text-light' : 'text-beta'} font-bold`}
              style={{ fontSize: 18, marginBottom: 12 }}
            >
              Select Members
            </Text>
            {loadingUsers && <ActivityIndicator color={Colors.alpha} />}
            {!loadingUsers &&
              users.map((user) => {
                const hasCustomImage = user.image && !user.image.includes('pdp.png');

                // Get initials: e.g. "John Doe" → "JD"
                const initials = user.name
                  ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  : '?';

                return (
                  <Pressable
                    key={user.id}
                    onPress={() => toggleUser(user.id)}
                    className={`${isDark ? 'bg-dark_gray border-gray-800' : 'bg-white border-gray-200'} border rounded-xl mb-2`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      borderWidth: 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {/* If user has a real image */}
                      {hasCustomImage ? (
                        <Image
                          source={{
                            uri: user.image.startsWith('http')
                              ? user.image
                              : `${API_URL}/${user.image}`,
                          }}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            marginRight: 8,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        // Otherwise show initials in a colored circle
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: Colors.alpha + '33',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: Colors.alpha,
                              fontWeight: '600',
                              fontSize: 16,
                            }}
                          >
                            {initials}
                          </Text>
                        </View>
                      )}

                      <Text className={`${isDark ? 'text-light' : 'text-beta'}`} style={{ fontSize: 16 }}>
                        {user.name || user.username}
                      </Text>
                    </View>

                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: Colors.alpha,
                        backgroundColor: selectedUsers.includes(user.id)
                          ? Colors.alpha
                          : 'transparent',
                      }}
                    />
                  </Pressable>
                );
              })}

          </View>
        )}

        {step === 3 && (
          <View>
            <Text
              className={`${isDark ? 'text-light' : 'text-beta'} font-bold`}
              style={{ fontSize: 18, marginBottom: 12 }}
            >
              Select Equipment
            </Text>
            {loadingEquipment && <ActivityIndicator color={Colors.alpha} />}
            {!loadingEquipment &&
              equipment.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleEquipment(item.id)}
                  className={`${isDark ? 'bg-dark_gray border-gray-800' : 'bg-white border-gray-200'} border rounded-xl mb-2`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    borderWidth: 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          marginRight: 8,
                        }}
                        resizeMode="cover"
                      />
                    )}
                    <Text className={`${isDark ? 'text-light' : 'text-beta'}`} style={{ fontSize: 16, maxWidth: 200 }}>
                      {item.mark}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: Colors.alpha,
                      backgroundColor: selectedEquipment.includes(item.id)
                        ? Colors.alpha
                        : 'transparent',
                    }}
                  />
                </Pressable>
              ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="justify-center items-center" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 }}>
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
                 Calendar 📅  
            </Text>
              </Pressable>

            <Pressable
              onPress={() => {
                  setShowModal(false);
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
      </Modal>

    </View>
  );
}
