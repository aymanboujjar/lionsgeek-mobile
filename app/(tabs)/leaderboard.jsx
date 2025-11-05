import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, Pressable, TouchableOpacity, ActivityIndicator, Modal, Animated, Dimensions } from 'react-native';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';
import { router } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_HEIGHT = SCREEN_HEIGHT * 0.25; // 25% of screen
const MAX_HEIGHT = SCREEN_HEIGHT * 0.95; // 95% when expanded

export default function Leaderboard() {
  const { token, user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalHeight, setModalHeight] = useState(new Animated.Value(MIN_HEIGHT));

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
    setIsExpanded(false);
    Animated.spring(modalHeight, {
      toValue: MIN_HEIGHT,
      useNativeDriver: false,
    }).start();
  };

  const toggleExpand = () => {
    const toValue = isExpanded ? MIN_HEIGHT : MAX_HEIGHT;
    setIsExpanded(!isExpanded);
    Animated.spring(modalHeight, {
      toValue,
      useNativeDriver: false,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setShowDetails(false);
      setSelectedUser(null);
      setIsExpanded(false);
    });
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.includes('http')) return image;
    return `${API.APP_URL}/storage/img/profile/${image}`;
  };

  const topThree = leaderboard.length >= 3 ? leaderboard.slice(0, 3) : leaderboard;
  const rest = leaderboard.length > 3 ? leaderboard.slice(3) : [];
  
  const getRankIcon = (rank) => {
    if (rank === 1) return { name: 'trophy', color: '#FFD700' };
    if (rank === 2) return { name: 'medal', color: '#C0C0C0' };
    if (rank === 3) return { name: 'medal', color: '#CD7F32' };
    return { name: 'ellipse', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' };
  };

  return (
    <AppLayout showNavbar={false}>
      <View className="flex-1 bg-light dark:bg-dark">
        {/* Header */}
        <View className="bg-alpha/20 dark:bg-alpha/10 pb-6 pt-12 px-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-3xl font-bold text-black dark:text-white">🏆 Leaderboard</Text>
              <Text className="text-base text-black/60 dark:text-white/60 mt-1">Weekly Rankings</Text>
            </View>
            <View className="items-center">
              <Ionicons name="trophy" size={32} color="#ffc801" />
              <Text className="text-xs text-black/60 dark:text-white/60">This Week</Text>
            </View>
          </View>
        </View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffc801" />
          }
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#ffc801" />
              <Text className="text-black/60 dark:text-white/60 mt-4">Loading leaderboard...</Text>
            </View>
          ) : leaderboard.length === 0 ? (
            <View className="px-6 py-20 items-center">
              <Ionicons name="trophy-outline" size={64} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
              <Text className="text-center text-black/60 dark:text-white/60 mt-4">No leaderboard data available</Text>
            </View>
          ) : (
            <View className="px-6 pb-24">
              {/* Top 3 Podium */}
              {topThree.length > 0 && (
                <View className="mb-6 mt-4">
                  <View className="flex-row items-end justify-center gap-2">
                    {/* 2nd Place */}
                    {topThree[1] && (
                      <Pressable
                        onPress={() => handleUserPress(topThree[1])}
                        className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 items-center border border-slate-300 dark:border-slate-700 active:opacity-80"
                        style={{ maxWidth: 110 }}
                      >
                        <View className="absolute -top-3 right-2 bg-slate-400 dark:bg-slate-600 w-8 h-8 rounded-full items-center justify-center">
                          <Text className="text-xs font-bold text-white">2</Text>
                        </View>
                        <View className="w-16 h-32 bg-slate-300 dark:bg-slate-700 rounded-t-xl mb-3 items-center justify-center">
                          <Ionicons name="medal" size={40} color="#C0C0C0" />
                        </View>
                        <Image
                          source={{ uri: getImageUrl(topThree[1].avatar || topThree[1].image) || 'https://via.placeholder.com/60' }}
                          className="w-20 h-20 rounded-full mb-2 border-4 border-slate-400 dark:border-slate-600"
                          defaultSource={require('@/assets/images/icon.png')}
                        />
                        <Text className="text-sm font-bold text-black dark:text-white text-center" numberOfLines={1}>
                          {topThree[1].name}
                        </Text>
                        <Text className="text-xs text-black/60 dark:text-white/60 mt-1" numberOfLines={1}>
                          {topThree[1].promo || 'No Promo'}
                        </Text>
                        <View className="mt-2 px-3 py-1 bg-alpha/20 rounded-full">
                          <Text className="text-xs font-bold text-black dark:text-white">{topThree[1].total_time || '0h'}</Text>
                        </View>
                      </Pressable>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                      <Pressable
                        onPress={() => handleUserPress(topThree[0])}
                        className="flex-1 bg-alpha/20 dark:bg-alpha/30 rounded-2xl p-4 items-center border-2 border-alpha active:opacity-80"
                        style={{ maxWidth: 130 }}
                      >
                        <View className="absolute -top-3 right-2 bg-alpha w-10 h-10 rounded-full items-center justify-center">
                          <Text className="text-xs font-bold text-black">🥇</Text>
                        </View>
                        <View className="w-20 h-40 bg-alpha/30 dark:bg-alpha/40 rounded-t-xl mb-3 items-center justify-center">
                          <Ionicons name="trophy" size={50} color="#FFD700" />
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
                        <View className="mt-2 px-4 py-1.5 bg-alpha rounded-full">
                          <Text className="text-sm font-bold text-black">{topThree[0].total_time || '0h'}</Text>
                        </View>
                      </Pressable>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                      <Pressable
                        onPress={() => handleUserPress(topThree[2])}
                        className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 items-center border border-slate-300 dark:border-slate-700 active:opacity-80"
                        style={{ maxWidth: 110 }}
                      >
                        <View className="absolute -top-3 right-2 bg-amber-600 dark:bg-amber-700 w-8 h-8 rounded-full items-center justify-center">
                          <Text className="text-xs font-bold text-white">3</Text>
                        </View>
                        <View className="w-16 h-24 bg-slate-300 dark:bg-slate-700 rounded-t-xl mb-3 items-center justify-center">
                          <Ionicons name="medal" size={32} color="#CD7F32" />
                        </View>
                        <Image
                          source={{ uri: getImageUrl(topThree[2].avatar || topThree[2].image) || 'https://via.placeholder.com/60' }}
                          className="w-20 h-20 rounded-full mb-2 border-4 border-amber-600 dark:border-amber-700"
                          defaultSource={require('@/assets/images/icon.png')}
                        />
                        <Text className="text-sm font-bold text-black dark:text-white text-center" numberOfLines={1}>
                          {topThree[2].name}
                        </Text>
                        <Text className="text-xs text-black/60 dark:text-white/60 mt-1" numberOfLines={1}>
                          {topThree[2].promo || 'No Promo'}
                        </Text>
                        <View className="mt-2 px-3 py-1 bg-alpha/20 rounded-full">
                          <Text className="text-xs font-bold text-black dark:text-white">{topThree[2].total_time || '0h'}</Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {/* Compact Leaderboard List */}
              <View className="mt-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-black dark:text-white">All Rankings</Text>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="people" size={20} color="#ffc801" />
                    <Text className="text-base font-bold text-black dark:text-white">{leaderboard.length}</Text>
                  </View>
                </View>
                
                {leaderboard.map((item, index) => {
                  const rank = item.rank || (index + 1);
                  const rankIcon = getRankIcon(rank);
                  const isTopThree = rank <= 3;
                  
                  return (
                    <Pressable
                      key={item.id || index}
                      onPress={() => handleUserPress(item)}
                      className={`flex-row items-center py-3 px-4 mb-3 rounded-xl border ${
                        isTopThree 
                          ? 'bg-alpha/10 dark:bg-alpha/20 border-alpha/30' 
                          : 'bg-light dark:bg-dark border-light/20 dark:border-dark/20'
                      } active:opacity-80`}
                    >
                      {/* Rank */}
                      <View className="w-12 items-center">
                        {isTopThree ? (
                          <Ionicons name={rankIcon.name} size={24} color={rankIcon.color} />
                        ) : (
                          <View className="w-10 h-10 rounded-full bg-beta/10 dark:bg-beta/20 items-center justify-center">
                            <Text className="text-base font-bold text-beta dark:text-white">
                              {rank}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Avatar */}
                      <View className="mr-3">
                        <Image
                          source={{ uri: getImageUrl(item.avatar || item.image) || 'https://via.placeholder.com/50' }}
                          className="w-14 h-14 rounded-full border-2 border-alpha/30"
                          defaultSource={require('@/assets/images/icon.png')}
                        />
                      </View>

                      {/* Name & Stats */}
                      <View className="flex-1">
                        <Text className="text-base font-bold text-black dark:text-white" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-xs text-black/60 dark:text-white/60" numberOfLines={1}>
                          {item.promo || 'No Promo'}
                        </Text>
                        <View className="flex-row items-center mt-1 gap-3">
                          <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={14} color="#ffc801" />
                            <Text className="text-xs text-black/70 dark:text-white/70 ml-1">{item.total_time || '0h'}</Text>
                          </View>
                          {item.top_language && (
                            <View className="px-2 py-0.5 bg-alpha/20 rounded-full">
                              <Text className="text-xs font-medium text-alpha">{item.top_language}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Badge */}
                      <View className="ml-2">
                        {isTopThree ? (
                          <Ionicons name="star" size={20} color="#ffc801" />
                        ) : (
                          <View className="px-3 py-1 bg-beta/10 dark:bg-beta/20 rounded-full">
                            <Text className="text-xs font-bold text-beta dark:text-white">{item.user_rank || 'Beginner'}</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Expandable Modal */}
        <Modal
          visible={showDetails}
          transparent={true}
          animationType="none"
          onRequestClose={closeModal}
        >
          <View className="flex-1 bg-black/60">
            <Pressable 
              className="flex-1" 
              onPress={closeModal}
            />
            
            <Animated.View 
              style={{ 
                height: modalHeight,
                backgroundColor: isDark ? '#171717' : '#fafafa',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              }}
            >
              {/* Drag Handle */}
              <Pressable 
                onPress={toggleExpand}
                className="items-center py-3"
              >
                <View className="w-12 h-1 bg-black/20 dark:bg-white/20 rounded-full" />
              </Pressable>

              {/* Header */}
              <View className="px-6 pb-4 border-b border-light/20 dark:border-dark/20">
                {selectedUser && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <Image
                        source={{ uri: getImageUrl(selectedUser.avatar || selectedUser.image) || 'https://via.placeholder.com/100' }}
                        className="w-16 h-16 rounded-full mr-3 border-2 border-alpha"
                        defaultSource={require('@/assets/images/icon.png')}
                      />
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-black dark:text-white" numberOfLines={1}>
                          {selectedUser.name}
                        </Text>
                        <Text className="text-sm text-black/60 dark:text-white/60" numberOfLines={1}>
                          {selectedUser.email}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Content */}
              {selectedUser && (
                <ScrollView 
                  className="flex-1" 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <View className="px-6 py-6">
                    {/* Key Stats Grid */}
                    <View className="flex-row gap-3 mb-6">
                      <View className="flex-1 bg-light/50 dark:bg-dark/50 rounded-2xl p-4 items-center border border-light/30 dark:border-dark/30">
                        <Ionicons name="trophy" size={24} color="#ffc801" />
                        <Text className="text-xs text-black/60 dark:text-white/60 mt-2">Rank</Text>
                        <Text className="text-2xl font-bold text-black dark:text-white">#{selectedUser.rank || 'N/A'}</Text>
                      </View>
                      <View className="flex-1 bg-light/50 dark:bg-dark/50 rounded-2xl p-4 items-center border border-light/30 dark:border-dark/30">
                        <Ionicons name="time" size={24} color="#ffc801" />
                        <Text className="text-xs text-black/60 dark:text-white/60 mt-2">Total Time</Text>
                        <Text className="text-2xl font-bold text-black dark:text-white">{selectedUser.total_time || '0h'}</Text>
                      </View>
                    </View>

                    {/* Stats Cards */}
                    <View className="gap-3 mb-6">
                      <View className="bg-alpha/20 dark:bg-alpha/30 rounded-2xl p-4 border border-alpha/30">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="stats-chart" size={20} color="#ffc801" />
                          <Text className="text-base font-bold text-black dark:text-white ml-2">Daily Average</Text>
                        </View>
                        <Text className="text-3xl font-bold text-black dark:text-white">{selectedUser.daily_avg || '0h'}</Text>
                        <Text className="text-xs text-black/60 dark:text-white/60 mt-1">Per day this week</Text>
                      </View>

                      <View className="bg-beta/10 dark:bg-beta/20 rounded-2xl p-4 border border-beta/20">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="code-slash" size={20} color="#212529" style={{ color: isDark ? '#fff' : '#212529' }} />
                          <Text className="text-base font-bold text-black dark:text-white ml-2">Top Language</Text>
                        </View>
                        <Text className="text-3xl font-bold text-black dark:text-white">{selectedUser.top_language || 'None'}</Text>
                        <Text className="text-xs text-black/60 dark:text-white/60 mt-1">Most used this week</Text>
                      </View>

                      <View className="bg-green-500/20 dark:bg-green-500/30 rounded-2xl p-4 border border-green-500/30">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="star" size={20} color="#51b04f" />
                          <Text className="text-base font-bold text-black dark:text-white ml-2">Ranking</Text>
                        </View>
                        <Text className="text-3xl font-bold text-black dark:text-white">{selectedUser.user_rank || 'Beginner'}</Text>
                        <Text className="text-xs text-black/60 dark:text-white/60 mt-1">Current level</Text>
                      </View>
                    </View>

                    {/* Action Button */}
                    <Pressable
                      onPress={() => {
                        closeModal();
                        router.push(`/(tabs)/profile?userId=${selectedUser.id}`);
                      }}
                      className="bg-alpha dark:bg-alpha rounded-2xl py-4 items-center active:opacity-80"
                    >
                      <Text className="text-base font-bold text-black">View Full Profile</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}
            </Animated.View>
          </View>
        </Modal>
      </View>
    </AppLayout>
  );
}
