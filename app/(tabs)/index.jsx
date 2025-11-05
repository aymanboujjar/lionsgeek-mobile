import { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useAppContext } from '@/context';
import StoryItem from '@/components/feed/StoryItem';
import FeedItem from '@/components/feed/FeedItem';
import CreatePost from '@/components/feed/CreatePost';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';
import API from '@/api';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user, token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalHours: 0, streak: 0, rank: 0 });

  // Enhanced hardcoded posts
  const hardcodedPosts = [
    {
      id: 1,
      type: 'achievement',
      title: '🎉 Milestone Achieved!',
      description: 'You completed 100 hours of coding this week! Keep up the amazing work.',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      user: {
        name: 'System',
        avatar: null,
      },
      likes: 45,
      comments: 12,
      reposts: 8,
      isReposted: false,
      badge: '🔥 Hot',
      badgeColor: '#ef4444',
    },
    {
      id: 2,
      type: 'post',
      title: 'New Project Launch 🚀',
      description: 'Excited to announce our new project! Working with an amazing team to bring innovative solutions.',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: {
        name: 'Mehdi Forkani',
        avatar: 'https://via.placeholder.com/40',
        image: null,
      },
      likes: 24,
      comments: 5,
      reposts: 3,
      isReposted: false,
    },
    {
      id: 3,
      type: 'project',
      title: '🎬 Studio Reservation Confirmed',
      description: 'Just reserved Studio A for tomorrow\'s recording session. Looking forward to it!',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      user: {
        name: 'Hamza Ezzagmoute',
        avatar: 'https://via.placeholder.com/40',
        image: null,
      },
      likes: 12,
      comments: 3,
      reposts: 1,
      isReposted: false,
    },
    {
      id: 4,
      type: 'post',
      title: '📚 Workshop Announcement',
      description: 'Join us for an exciting workshop on modern web development next week! Limited spots available.',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        name: 'Nabil SAKR',
        avatar: 'https://via.placeholder.com/40',
        image: null,
      },
      likes: 45,
      comments: 8,
      reposts: 7,
      isReposted: true,
      reposted: true,
      reposted_by: user?.name || 'You',
      image: 'https://via.placeholder.com/400x200',
    },
  ];

  useEffect(() => {
    setPosts(hardcodedPosts);
    setLoading(false);
    // Simulate stats
    setStats({ totalHours: 127, streak: 7, rank: 5 });
  }, []);

  const fetchFeed = async () => {
    if (!token) return;
    
    try {
      const response = await API.getWithAuth('mobile/feed', token);
      if (response?.data) {
        const feedPosts = (response.data.feed || []).map(post => ({
          ...post,
          onRepost: handleRepost,
        }));
        setPosts(feedPosts);
      }
    } catch (error) {
      console.error('[HOME] Error fetching feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handleRepost = async (post) => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      const response = await API.post('mobile/posts/repost', {
        post_id: post.id,
      }, token);

      if (response?.data) {
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === post.id
              ? {
                  ...p,
                  isReposted: true,
                  reposts: (p.reposts || 0) + 1,
                  reposted: true,
                  reposted_by: user?.name || 'You',
                }
              : p
          )
        );
        Alert.alert('Success', 'Post reposted!');
      }
    } catch (error) {
      console.error('[HOME] Error reposting:', error);
      Alert.alert('Error', 'Failed to repost. Please try again.');
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => [
      {
        ...newPost,
        onRepost: handleRepost,
      },
      ...prevPosts,
    ]);
  };

  return (
    <AppLayout showNavbar={true}>
      <ScrollView 
        className="flex-1 bg-light dark:bg-dark"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffc801" />
        }
      >
        <View className="px-6">
          {/* Quick Stats Cards */}
          <View className="mb-6 pt-4">
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/leaderboard')}
                className="flex-1 bg-alpha/20 dark:bg-alpha/30 rounded-2xl p-4 border border-alpha/30 active:opacity-80"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="trophy" size={24} color="#ffc801" />
                  <View className="px-2 py-1 bg-alpha/50 rounded-full">
                    <Text className="text-xs font-bold text-black">#{stats.rank}</Text>
                  </View>
                </View>
                <Text className="text-xs text-black/60 dark:text-white/60 mb-1">Your Rank</Text>
                <Text className="text-2xl font-bold text-black dark:text-white">Top {stats.rank}%</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-1 bg-good/20 dark:bg-good/30 rounded-2xl p-4 border border-good/30 active:opacity-80"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="flame" size={24} color="#51b04f" />
                  <View className="px-2 py-1 bg-good/50 rounded-full">
                    <Text className="text-xs font-bold text-white">{stats.streak}</Text>
                  </View>
                </View>
                <Text className="text-xs text-black/60 dark:text-white/60 mb-1">Day Streak</Text>
                <Text className="text-2xl font-bold text-black dark:text-white">{stats.streak} 🔥</Text>
              </TouchableOpacity>

              <View className="w-20 items-center justify-center bg-beta/10 dark:bg-beta/20 rounded-2xl border border-beta/20">
                <Ionicons name="time" size={32} color={isDark ? '#fff' : '#212529'} />
                <Text className="text-xs font-bold text-black dark:text-white mt-1 text-center">{stats.totalHours}h</Text>
              </View>
            </View>
          </View>

          {/* Stories Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-black dark:text-white">Stories</Text>
              <Ionicons name="add-circle-outline" size={24} color="#ffc801" />
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="-mx-6"
              contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 24 }}
            >
              <View className="mr-4">
                <StoryItem user={user} isOwn={true} />
              </View>
              <View className="mr-4">
                <StoryItem user={{ name: 'Hamza', avatar: 'https://via.placeholder.com/60', image: null }} />
              </View>
              <View className="mr-4">
                <StoryItem user={{ name: 'Nabil', avatar: 'https://via.placeholder.com/60', image: null }} />
              </View>
              <View className="mr-4">
                <StoryItem user={{ name: 'John', avatar: 'https://via.placeholder.com/60', image: null }} />
              </View>
            </ScrollView>
          </View>

          {/* Create Post Section */}
          <View className="mb-6">
            <CreatePost onPostPress={() => {}} onPostCreated={handlePostCreated} />
          </View>

          {/* Feed Section */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center">
                <Ionicons name="newspaper" size={24} color="#ffc801" />
                <Text className="text-xl font-bold text-black dark:text-white ml-2">Latest Updates</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="filter" size={20} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            {loading ? (
              <View className="py-16 items-center">
                <ActivityIndicator size="large" color="#ffc801" />
                <Text className="text-black/60 dark:text-white/60 mt-4">Loading feed...</Text>
              </View>
            ) : posts.length === 0 ? (
              <View className="py-16 items-center bg-light/30 dark:bg-dark/30 rounded-2xl">
                <Ionicons name="document-text-outline" size={48} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                <Text className="text-black/60 dark:text-white/60 text-center mt-4 px-4">
                  No posts yet. Be the first to share something!
                </Text>
              </View>
            ) : (
              posts.map((item, index) => (
                <View key={item.id} className={index !== posts.length - 1 ? "mb-5" : ""}>
                  <FeedItem 
                    item={{
                      ...item,
                      onRepost: handleRepost,
                    }} 
                  />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
