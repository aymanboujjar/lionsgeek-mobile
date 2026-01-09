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
        const feedPosts = (response.data.posts || []).map(post => ({
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
