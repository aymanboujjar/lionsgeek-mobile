import { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useAppContext } from '@/context';
import StoryItem from '@/components/feed/StoryItem';
import FeedItem from '@/components/feed/FeedItem';
import CreatePost from '@/components/feed/CreatePost';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';
import API from '@/api';

export default function HomeScreen() {
  const { user, token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hardcoded posts for now
  const hardcodedPosts = [
    {
      id: 1,
      type: 'post',
      title: 'New Project Launch',
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
      id: 2,
      type: 'project',
      title: 'LionsGeek Studio Reservation',
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
      id: 3,
      type: 'post',
      title: 'Workshop Announcement',
      description: 'Join us for an exciting workshop on modern web development next week!',
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
    },
    {
      id: 4,
      type: 'reservation',
      title: 'Coworking Space Available',
      description: 'Coworking space B3 is now available for booking. Perfect for team collaborations!',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        name: 'Yahya Moussair',
        avatar: 'https://via.placeholder.com/40',
        image: null,
      },
      likes: 18,
      comments: 4,
      reposts: 2,
      isReposted: false,
      image: 'https://via.placeholder.com/400x200',
    },
  ];

  useEffect(() => {
    setPosts(hardcodedPosts);
    setLoading(false);
  }, []);

  const fetchFeed = async () => {
    if (!token) return;
    
    try {
      const response = await API.getWithAuth('mobile/feed', token);
      if (response?.data) {
        // Merge feed data with repost handlers
        const feedPosts = (response.data.feed || []).map(post => ({
          ...post,
          onRepost: handleRepost,
        }));
        setPosts(feedPosts);
      }
    } catch (error) {
      console.error('[HOME] Error fetching feed:', error);
      // Keep hardcoded posts on error
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
        // Update post in state
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
    // Add new post to the beginning of the feed
    setPosts(prevPosts => [
      {
        ...newPost,
        onRepost: handleRepost,
      },
      ...prevPosts,
    ]);
  };

  const handleCreatePost = () => {
    // Modal is handled in CreatePost component
    console.log('Create post pressed');
  };

  return (
    <AppLayout showNavbar={true}>
      <ScrollView 
        className="flex-1 bg-light dark:bg-dark"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />
        }
      >
        <View className="px-6">
          {/* Stories Section */}
          <View className="mb-6 pt-2">
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
                <StoryItem user={{ name: 'Hamza Ezzagmoute', avatar: 'https://via.placeholder.com/60', image: null }} />
              </View>
              <View className="mr-4">
                <StoryItem user={{ name: 'Nabil SAKR', avatar: 'https://via.placeholder.com/60', image: null }} />
              </View>
              <View className="mr-4">
                <StoryItem user={{ name: 'John Doe', avatar: 'https://via.placeholder.com/60', image: null }} />
              </View>
            </ScrollView>
          </View>

          {/* Create Post Section */}
          <View className="mb-5">
            <CreatePost onPostPress={handleCreatePost} onPostCreated={handlePostCreated} />
          </View>

          {/* Feed Section */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-bold text-black dark:text-white">Feed</Text>
              <Text className="text-sm text-black/60 dark:text-white/60">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </Text>
            </View>
            {loading ? (
              <View className="py-16 items-center">
                <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
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
                <View key={item.id} className={index !== posts.length - 1 ? "mb-6" : ""}>
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
