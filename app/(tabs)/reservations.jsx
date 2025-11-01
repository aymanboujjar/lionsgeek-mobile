import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';

export default function Reservations() {
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = async () => {
    if (!token) return;
    
    try {
      const response = await API.getWithAuth('mobile/reservations', token);
      if (response?.data) {
        setReservations(response.data.reservations || []);
      }
    } catch (error) {
      console.error('[RESERVATIONS] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReservations();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppLayout>
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
      >
        <View>
        <Text className="text-2xl font-bold text-black dark:text-white mb-4">Reservations</Text>
        
        {loading ? (
          <Text className="text-center text-black/60 dark:text-white/60 py-8">Loading...</Text>
        ) : reservations.length === 0 ? (
          <View className="py-8">
            <Text className="text-center text-black/60 dark:text-white/60">No reservations yet</Text>
          </View>
        ) : (
          reservations.map((reservation) => (
            <Pressable key={reservation.id} className="mb-4">
              <View className={`bg-light dark:bg-dark rounded-lg p-4 border ${reservation.canceled ? 'border-red-500/30 dark:border-red-500/40' : 'border-light/20 dark:border-dark/20'}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-semibold text-black dark:text-white capitalize">
                    {reservation.type || 'Reservation'}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${reservation.canceled ? 'bg-red-500/20 dark:bg-red-500/30' : reservation.status === 'approved' ? 'bg-green-500/20 dark:bg-green-500/30' : 'bg-alpha/20 dark:bg-alpha/30'}`}>
                    <Text className={`text-xs font-medium ${reservation.canceled ? 'text-red-700 dark:text-red-300' : reservation.status === 'approved' ? 'text-green-700 dark:text-green-300' : 'text-alpha dark:text-alpha'}`}>
                      {reservation.canceled ? 'Canceled' : (reservation.status || 'Pending')}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-black/60 dark:text-white/60 mb-1">
                  Start: {formatDate(reservation.start)}
                </Text>
                <Text className="text-sm text-black/60 dark:text-white/60">
                  End: {formatDate(reservation.end)}
                </Text>
              </View>
            </Pressable>
          ))
        )}
        </View>
      </ScrollView>
    </AppLayout>
  );
}



