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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function NewReservation({ selectedDate }) {
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [studio, setStudio] = useState('');

  // Step 2
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Step 3
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const isDark = true; // or use useColorScheme()
  const brand = '#4B9EEA';

  // Fetch users
  useEffect(() => {
    if (step === 2 && users.length === 0) {
      setLoadingUsers(true);
      fetch('http://192.168.100.100:8000/api/users')
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch((e) => console.error('Users fetch error', e))
        .finally(() => setLoadingUsers(false));
    }
  }, [step]);

  // Fetch equipment
  useEffect(() => {
    if (step === 3 && equipment.length === 0) {
      setLoadingEquipment(true);
      fetch('http://192.168.100.100:8000/api/equipment')
        .then((res) => res.json())
        .then((data) => setEquipment(data))
        .catch((e) => console.error('Equipment fetch error', e))
        .finally(() => setLoadingEquipment(false));
    }
  }, [step]);

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleEquipment = (id) => {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const submitReservation = () => {
    const payload = {
      name,
      description,
      studio,
      users: selectedUsers,
      equipment: selectedEquipment,
      start: startTime.toTimeString().slice(0, 5), 
      end: endTime.toTimeString().slice(0, 5),
      date: selectedDate, 
    };
    console.log('Submitting reservation:', payload);
    // POST to your backend here

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
            <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>Studio</Text>
            <TextInput
              value={studio}
              onChangeText={setStudio}
              placeholder="Select or type studio name"
              placeholderTextColor="#9CA3AF"
              style={{
                backgroundColor: isDark ? '#1F2937' : '#FFF',
                borderRadius: 10,
                padding: 12,
                color: isDark ? '#FFF' : '#000',
              }}
            />

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
    </View>
  );
}
