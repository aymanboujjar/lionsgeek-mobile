import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppContext } from '@/context';
import StoryItem from '@/components/feed/StoryItem';
import FeedItem from '@/components/feed/FeedItem';
import CreatePost from '@/components/feed/CreatePost';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Hardcoded posts
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
      },
      likes: 24,
      comments: 5,
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
      },
      likes: 12,
      comments: 3,
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
      },
      likes: 45,
      comments: 8,
      image: 'https://via.placeholder.com/400x200',
    },
  ];

  const handleCreatePost = () => {
    // Navigate to create post screen or show modal
    console.log('Create post pressed');
  };

  return (
    <AppLayout showNavbar={true}>
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4 pb-8">
          {/* Stories Section */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-4 -mx-6"
            contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 24 }}
          >
            <StoryItem user={user} isOwn={true} />
            <StoryItem user={{ name: 'Hamza Ezzagmoute', avatar: 'https://via.placeholder.com/60' }} />
            <StoryItem user={{ name: 'Nabil SAKR', avatar: 'https://via.placeholder.com/60' }} />
            <StoryItem user={{ name: 'John Doe', avatar: 'https://via.placeholder.com/60' }} />
          </ScrollView>

          {/* Create Post Section */}
          <CreatePost onPostPress={handleCreatePost} />

          {/* Feed Section */}
          {hardcodedPosts.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </AppLayout>
  );
}



