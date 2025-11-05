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
import { Modal } from 'react-native';
import { useRouter } from 'expo-router'
import API from '@/api';
export default function NewReservation({ selectedDate }) {
  const { user, token } = useAppContext();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);

 
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

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const isDark = true;
  const brand = '#4B9EEA';

  /** ------------------ FETCH DATA ------------------ **/

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
      day: selectedDate,
      start: startTime.toTimeString().slice(0, 5),
      end: endTime.toTimeString().slice(0, 5),
      user_id: user.id,
      team_members: selectedUsers,
      equipment: selectedEquipment,
    };

    console.log('Submitting reservation:', payload);

    try {
      const response = await API.postWithAuth('reservations/store', payload, token);
      console.log('Reservation created:', response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#0B0B0C' : '#F9FAFB',
        paddingTop: 80,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 10,
        }}
      >
        <Pressable onPress={prevStep}>
          <Text style={{ color: brand, fontSize: 16 }}>
            {step > 1 ? 'Back' : 'Cancel'}
          </Text>
        </Pressable>

        <Text style={{ fontSize: 18, color: isDark ? '#FFF' : '#111', fontWeight: '600' }}>
          New Reservation
        </Text>

        <Pressable onPress={step === 3 ? submitReservation : nextStep}>
          <Text style={{ color: brand, fontSize: 16 }}>
            {step === 3 ? 'Done' : 'Next'}
          </Text>
        </Pressable>
      </View>

      {/* Step indicator */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 15,
        }}
      >
        {[1, 2, 3].map((n) => (
          <View
            key={n}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === n ? brand : '#374151',
            }}
          />
        ))}
      </View>

      {/* Steps */}
      <ScrollView
        style={{
          flex: 1,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View style={{ gap: 16 }}>
            {/* Name field */}
            <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Reservation name"
              placeholderTextColor="#9CA3AF"
              style={{
                backgroundColor: isDark ? '#1F2937' : '#FFF',
                borderRadius: 10,
                padding: 12,
                color: isDark ? '#FFF' : '#000',
              }}
            />

            {/* Description */}
            <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description..."
              placeholderTextColor="#9CA3AF"
              multiline
              style={{
                backgroundColor: isDark ? '#1F2937' : '#FFF',
                borderRadius: 10,
                padding: 12,
                height: 100,
                color: isDark ? '#FFF' : '#000',
              }}
            />

            {/* Studio */}

            <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 16, marginBottom: 8 }}>
              Studio
            </Text>

            {loadingPlaces ? (
              <ActivityIndicator color={brand} />
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
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? brand : '#9CA3AF',
                        borderRadius: 12,
                        overflow: 'hidden',
                        alignItems: 'center',
                        marginRight: 8,
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
                            backgroundColor: '#E5E7EB',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text>No Image</Text>
                        </View>
                      )}
                      <Text
                        style={{
                          color: isDark ? '#FFF' : '#000',
                          fontWeight: isSelected ? '600' : '400',
                          padding: 4,
                        }}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            )}


            {/* Start Time */}
            <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>Start Time</Text>
            <Pressable
              onPress={() => setShowStartPicker(true)}
              style={{
                backgroundColor: isDark ? '#1F2937' : '#FFF',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ color: isDark ? '#FFF' : '#000' }}>
                {startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select start time'}
              </Text>
            </Pressable>
            {showStartPicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selected) => {
                  setShowStartPicker(false);
                  if (selected) setStartTime(selected);
                }}
              />
            )}

            {/* End Time */}
            <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>End Time</Text>
            <Pressable
              onPress={() => setShowEndPicker(true)}
              style={{
                backgroundColor: isDark ? '#1F2937' : '#FFF',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ color: isDark ? '#FFF' : '#000' }}>
                {endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select end time'}
              </Text>
            </Pressable>
            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selected) => {
                  setShowEndPicker(false);
                  if (selected) setEndTime(selected);
                }}
              />
            )}
          </View>

        )}

        {step === 2 && (
          <View>
            <Text
              style={{
                color: isDark ? '#FFF' : '#000',
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              Select Members
            </Text>
            {loadingUsers && <ActivityIndicator color={brand} />}
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
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? '#1F2937' : '#E5E7EB',
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
                            backgroundColor: brand + '33', // light tint of brand
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: brand,
                              fontWeight: '600',
                              fontSize: 16,
                            }}
                          >
                            {initials}
                          </Text>
                        </View>
                      )}

                      <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>
                        {user.name || user.username}
                      </Text>
                    </View>

                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: brand,
                        backgroundColor: selectedUsers.includes(user.id)
                          ? brand
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
              style={{
                color: isDark ? '#FFF' : '#000',
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              Select Equipment
            </Text>
            {loadingEquipment && <ActivityIndicator color={brand} />}
            {!loadingEquipment &&
              equipment.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleEquipment(item.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#1F2937' : '#E5E7EB',
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
                    <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 16, maxWidth: 200, }}>
                      {item.mark}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: brand,
                      backgroundColor: selectedEquipment.includes(item.id)
                        ? brand
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
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? '#1F2937' : '#FFF',
              padding: 20,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 18, marginBottom: 16 }}>
              Reservation Created Successfully!
            </Text>

            <Pressable
              onPress={() => {
                setShowModal(false);           // optional, just hides modal quickly
                router.replace('/reservations/day'); // replace current screen
              }}
              style={{
                backgroundColor: brand,
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>close</Text>
            </Pressable>


          </View>
        </View>
      </Modal>

    </View>
  );
}
