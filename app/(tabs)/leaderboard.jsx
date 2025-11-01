import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image } from 'react-native';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';

export default function Leaderboard() {
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    if (!token) return;
    
    try {
      const response = await API.getWithAuth('mobile/leaderboard', token);
      if (response?.data) {
        setLeaderboard(response.data.leaderboard || []);
      }
    } catch (error) {
      console.error('[LEADERBOARD] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeaderboard();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-alpha dark:bg-alpha';
    if (rank === 2) return 'bg-light/30 dark:bg-dark/30';
    if (rank === 3) return 'bg-alpha/50 dark:bg-alpha/50';
    return 'bg-light/50 dark:bg-dark/50';
  };

  return (
    <AppLayout>
      <View className="px-6 pt-4 pb-8">
        <Text className="text-2xl font-bold text-black dark:text-white mb-4">Leaderboard</Text>
        
        {loading ? (
          <Text className="text-center text-black/60 dark:text-white/60 py-8">Loading...</Text>
        ) : leaderboard.length === 0 ? (
          <View className="py-8">
            <Text className="text-center text-black/60 dark:text-white/60">No leaderboard data available</Text>
          </View>
        ) : (
          leaderboard.map((item, index) => (
            <View 
              key={item.id} 
              className="mb-3 bg-light dark:bg-dark rounded-lg p-4 border border-light/20 dark:border-dark/20 flex-row items-center"
            >
              <View className={`w-10 h-10 rounded-full ${getRankColor(item.rank)} items-center justify-center mr-3`}>
                <Text className={`font-bold text-base ${item.rank <= 3 ? 'text-black' : 'text-black/70 dark:text-white/70'}`}>
                  {item.rank}
                </Text>
              </View>
              <Image
                source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
                className="w-12 h-12 rounded-full mr-3"
                defaultSource={require('@/assets/images/icon.png')}
              />
              <View className="flex-1">
                <Text className="text-base font-semibold text-black dark:text-white">
                  {item.name}
                </Text>
                <Text className="text-sm text-black/60 dark:text-white/60">
                  {item.promo || 'No promo'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </AppLayout>
  );
}

