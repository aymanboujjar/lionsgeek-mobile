import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, Pressable, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';
import { router } from 'expo-router';

export default function Leaderboard() {
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchLeaderboard = async (range = 'this_week') => {
    if (!token) return;
    
    try {
      const params = new URLSearchParams({ range }).toString();
      const response = await API.getWithAuth(`mobile/leaderboard?${params}`, token);
      if (response?.data) {
        const leaderboardData = response.data.leaderboard || [];
        console.log('[LEADERBOARD] Data received:', leaderboardData.length, 'items');
        setLeaderboard(leaderboardData);
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

  const handleUserPress = (user) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.includes('http')) return image;
    return `${API.APP_URL}/storage/img/profile/${image}`;
  };

  // Get top 3 for podium
  const topThree = leaderboard.length >= 3 ? leaderboard.slice(0, 3) : leaderboard;
  const rest = leaderboard.length > 3 ? leaderboard.slice(3) : [];
  
  console.log('[LEADERBOARD] Render:', { total: leaderboard.length, topThree: topThree.length, rest: rest.length });

  const getRankIcon = (rank) => {
    if (rank === 1) return { name: 'trophy', color: '#FFD700' };
    if (rank === 2) return { name: 'medal', color: '#C0C0C0' };
    if (rank === 3) return { name: 'medal', color: '#CD7F32' };
    return { name: 'ellipse', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' };
  };

  return (
    <AppLayout>
      <ScrollView 
        className="flex-1 bg-light dark:bg-dark"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />
        }
      >
        {/* Banner Image */}
        <View className="relative h-48 -mx-6 -mt-6 mb-6 bg-alpha/20 dark:bg-alpha/30">
          <Image
            source={{ uri: `${API.APP_URL}/assets/images/banner/Winners-amico.png` }}
            className="w-full h-full"
            resizeMode="cover"
            onError={(e) => {
              console.log('[LEADERBOARD] Banner image failed to load');
            }}
          />
          <View className="absolute inset-0 bg-black/30" />
          <View className="absolute bottom-6 left-6 right-6">
            <Text className="text-3xl font-bold text-white mb-1">Leaderboard</Text>
            <Text className="text-base text-white/90">Top coders this week</Text>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
            <Text className="text-black/60 dark:text-white/60 mt-4">Loading leaderboard...</Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <View className="px-6 py-20 items-center">
            <Ionicons name="trophy-outline" size={64} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
            <Text className="text-center text-black/60 dark:text-white/60 mt-4">No leaderboard data available</Text>
          </View>
        ) : (
          <View className="px-6 pb-8">
            {/* Podium Cards for Top 3 */}
            {topThree.length > 0 && (
              <View className="mb-6">
                <Text className="text-xl font-bold text-black dark:text-white mb-4">Top Performers</Text>
                <View className="flex-row items-end justify-center gap-3 mb-6">
                  {/* 2nd Place */}
                  {topThree[1] && (
                    <Pressable
                      onPress={() => handleUserPress(topThree[1])}
                      className="flex-1 bg-light/50 dark:bg-dark/50 rounded-2xl p-4 items-center border border-light/20 dark:border-dark/20 active:opacity-80"
                      style={{ maxWidth: 110 }}
                    >
                      <View className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-alpha items-center justify-center">
                        <Text className="text-xs font-bold text-black">2</Text>
                      </View>
                      <Image
                        source={{ uri: getImageUrl(topThree[1].avatar || topThree[1].image) || 'https://via.placeholder.com/60' }}
                        className="w-20 h-20 rounded-full mb-2 border-2 border-alpha"
                        defaultSource={require('@/assets/images/icon.png')}
                      />
                      <Text className="text-sm font-bold text-black dark:text-white text-center" numberOfLines={1}>
                        {topThree[1].name}
                      </Text>
                      <Text className="text-xs text-black/60 dark:text-white/60 mt-1" numberOfLines={1}>
                        {topThree[1].promo || 'No Promo'}
                      </Text>
                      <View className="mt-2 w-full h-16 bg-alpha/20 rounded-lg items-center justify-center">
                        <Ionicons name="medal" size={24} color="#C0C0C0" />
                      </View>
                    </Pressable>
                  )}

                  {/* 1st Place */}
                  {topThree[0] && (
                    <Pressable
                      onPress={() => handleUserPress(topThree[0])}
                      className="flex-1 bg-alpha/10 dark:bg-alpha/20 rounded-2xl p-4 items-center border-2 border-alpha active:opacity-80"
                      style={{ maxWidth: 130 }}
                    >
                      <View className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-alpha items-center justify-center">
                        <Ionicons name="trophy" size={16} color="#000" />
                      </View>
                      <Image
                        source={{ uri: getImageUrl(topThree[0].avatar || topThree[0].image) || 'https://via.placeholder.com/60' }}
                        className="w-24 h-24 rounded-full mb-2 border-4 border-alpha"
                        defaultSource={require('@/assets/images/icon.png')}
                      />
                      <Text className="text-base font-bold text-black dark:text-white text-center" numberOfLines={1}>
                        {topThree[0].name}
                      </Text>
                      <Text className="text-xs text-black/60 dark:text-white/60 mt-1" numberOfLines={1}>
                        {topThree[0].promo || 'No Promo'}
                      </Text>
                      <View className="mt-2 w-full h-20 bg-alpha/30 rounded-lg items-center justify-center">
                        <Ionicons name="trophy" size={32} color="#FFD700" />
                      </View>
                    </Pressable>
                  )}

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <Pressable
                      onPress={() => handleUserPress(topThree[2])}
                      className="flex-1 bg-light/50 dark:bg-dark/50 rounded-2xl p-4 items-center border border-light/20 dark:border-dark/20 active:opacity-80"
                      style={{ maxWidth: 110 }}
                    >
                      <View className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-alpha/70 items-center justify-center">
                        <Text className="text-xs font-bold text-black">3</Text>
                      </View>
                      <Image
                        source={{ uri: getImageUrl(topThree[2].avatar || topThree[2].image) || 'https://via.placeholder.com/60' }}
                        className="w-20 h-20 rounded-full mb-2 border-2 border-alpha/50"
                        defaultSource={require('@/assets/images/icon.png')}
                      />
                      <Text className="text-sm font-bold text-black dark:text-white text-center" numberOfLines={1}>
                        {topThree[2].name}
                      </Text>
                      <Text className="text-xs text-black/60 dark:text-white/60 mt-1" numberOfLines={1}>
                        {topThree[2].promo || 'No Promo'}
                      </Text>
                      <View className="mt-2 w-full h-14 bg-alpha/20 rounded-lg items-center justify-center">
                        <Ionicons name="medal" size={20} color="#CD7F32" />
                      </View>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* Leaderboard Table */}
            {leaderboard.length > 0 && (
              <View className="mt-6">
                <Text className="text-xl font-bold text-black dark:text-white mb-4">Leaderboard</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ minWidth: 700 }}>
                    {/* Table Header */}
                    <View className="flex-row items-center py-3 px-4 border-b-2 border-alpha/30 mb-2">
                      <View className="w-14 items-center">
                        <Text className="text-xs font-bold text-black/60 dark:text-white/60 uppercase">Place</Text>
                      </View>
                      <View className="w-40 ml-3">
                        <Text className="text-xs font-bold text-black/60 dark:text-white/60 uppercase">Player Name</Text>
                      </View>
                      <View className="w-24 items-center ml-2">
                        <Text className="text-xs font-bold text-black/60 dark:text-white/60 uppercase text-center">Total Time</Text>
                      </View>
                      <View className="w-24 items-center ml-2">
                        <Text className="text-xs font-bold text-black/60 dark:text-white/60 uppercase text-center">Daily Avg</Text>
                      </View>
                      <View className="w-28 items-center ml-2">
                        <Text className="text-xs font-bold text-black/60 dark:text-white/60 uppercase text-center">Top Language</Text>
                      </View>
                      <View className="w-24 items-center ml-2">
                        <Text className="text-xs font-bold text-black/60 dark:text-white/60 uppercase text-center">Rank</Text>
                      </View>
                    </View>

                    {/* Table Rows - Show ALL users including top 3 */}
                    {leaderboard.map((item, index) => {
                      const rank = item.rank || (index + 1);
                      const rankIcon = getRankIcon(rank);
                      
                      return (
                        <Pressable
                          key={item.id || index}
                          onPress={() => handleUserPress(item)}
                          className={`flex-row items-center py-4 px-4 border-b border-light/10 dark:border-dark/10 active:opacity-70 ${
                            rank <= 3 ? 'bg-alpha/5 dark:bg-alpha/10' : ''
                          }`}
                        >
                          {/* Place */}
                          <View className="w-14 items-center justify-center">
                            {rank <= 3 ? (
                              <Ionicons name={rankIcon.name} size={20} color={rankIcon.color} />
                            ) : (
                              <Text className="text-base font-bold text-black/70 dark:text-white/70">
                                {rank}
                              </Text>
                            )}
                          </View>

                          {/* Player Name */}
                          <View className="w-40 flex-row items-center ml-3">
                            <Image
                              source={{ uri: getImageUrl(item.avatar || item.image) || 'https://via.placeholder.com/50' }}
                              className="w-10 h-10 rounded-full mr-3"
                              defaultSource={require('@/assets/images/icon.png')}
                            />
                            <View className="flex-1">
                              <Text className="text-sm font-semibold text-black dark:text-white" numberOfLines={1}>
                                {item.name}
                              </Text>
                              <Text className="text-xs text-black/60 dark:text-white/60" numberOfLines={1}>
                                {item.promo || 'No Promo'}
                              </Text>
                            </View>
                          </View>

                          {/* Total Time */}
                          <View className="w-24 items-center ml-2">
                            <View className="flex-row items-center">
                              <Ionicons name="time-outline" size={14} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
                              <Text className="text-xs text-black/80 dark:text-white/80 ml-1" numberOfLines={1}>
                                {item.total_time || 'N/A'}
                              </Text>
                            </View>
                          </View>

                          {/* Daily Avg */}
                          <View className="w-24 items-center ml-2">
                            <View className="flex-row items-center">
                              <Ionicons name="stats-chart-outline" size={14} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
                              <Text className="text-xs text-black/80 dark:text-white/80 ml-1" numberOfLines={1}>
                                {item.daily_avg || 'N/A'}
                              </Text>
                            </View>
                          </View>

                          {/* Top Language */}
                          <View className="w-28 items-center ml-2">
                            {item.top_language ? (
                              <View className="px-2 py-1 bg-alpha/20 rounded-full">
                                <Text className="text-xs font-medium text-alpha text-center" numberOfLines={1}>
                                  {item.top_language}
                                </Text>
                              </View>
                            ) : (
                              <Text className="text-xs text-black/60 dark:text-white/60 text-center">-</Text>
                            )}
                          </View>

                          {/* Rank Badge */}
                          <View className="w-24 items-center ml-2">
                            <View className="px-2 py-1 bg-alpha/20 rounded-full">
                              <View className="flex-row items-center">
                                <Ionicons name="star" size={12} color={isDark ? '#fff' : '#000'} />
                                <Text className="text-xs font-medium text-black dark:text-white ml-1" numberOfLines={1}>
                                  {item.user_rank || 'Beginner'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* User Details Modal */}
        <Modal
          visible={showDetails}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetails(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-light dark:bg-dark rounded-t-3xl p-6 max-h-[80%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-black dark:text-white">User Details</Text>
                <TouchableOpacity onPress={() => setShowDetails(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>
              {selectedUser && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="items-center mb-6">
                    <Image
                      source={{ uri: getImageUrl(selectedUser.avatar || selectedUser.image) || 'https://via.placeholder.com/100' }}
                      className="w-24 h-24 rounded-full mb-3 border-4 border-alpha"
                      defaultSource={require('@/assets/images/icon.png')}
                    />
                    <Text className="text-2xl font-bold text-black dark:text-white">
                      {selectedUser.name}
                    </Text>
                    <Text className="text-sm text-black/60 dark:text-white/60 mt-1">
                      {selectedUser.email}
                    </Text>
                    <Text className="text-sm text-black/60 dark:text-white/60 mt-1">
                      Rank #{selectedUser.rank || 'N/A'}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setShowDetails(false);
                        router.push(`/(tabs)/profile?userId=${selectedUser.id}`);
                      }}
                      className="mt-4 bg-alpha dark:bg-alpha rounded-xl px-6 py-3 active:opacity-80"
                    >
                      <Text className="text-base font-semibold text-black">View Full Profile</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </AppLayout>
  );
}
