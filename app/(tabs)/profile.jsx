import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Pressable } from 'react-native';
import { useAppContext } from '@/context';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import API from '@/api';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';
import CreatePost from '@/components/feed/CreatePost';
import FeedItem from '@/components/feed/FeedItem';

export default function ProfileScreen() {
  const { user: currentUser, token } = useAppContext();
  const { userId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  const isOwnProfile = !userId || userId === currentUser?.id?.toString();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token && !isOwnProfile) return;
      
      try {
        if (isOwnProfile) {
          const response = await API.getWithAuth('mobile/profile', token);
          if (response?.data) {
            setProfile(response.data);
          } else {
            setProfile(currentUser);
          }
        } else {
          setProfile({
            id: userId,
            name: 'Other User',
            email: 'user@example.com',
            avatar: 'https://via.placeholder.com/100',
          });
        }
      } catch (error) {
        console.error('[PROFILE] Error:', error);
        if (isOwnProfile) {
          setProfile(currentUser);
        }
      } finally {
        setLoading(false);
      }
    };

    if (token || isOwnProfile) {
      fetchProfile();
    }
  }, [token, userId, isOwnProfile, currentUser]);

  if (loading) {
    return (
      <AppLayout showNavbar={false}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-black/60 dark:text-white/60">Loading...</Text>
        </View>
      </AppLayout>
    );
  }

  const profileData = profile || currentUser;

  return (
    <AppLayout showNavbar={false}>
      <ScrollView className="flex-1 bg-light dark:bg-dark" showsVerticalScrollIndicator={false}>
        {/* LinkedIn-style Header with Cover */}
        <View className="relative">
          {/* Cover Image */}
          <View className="h-48 bg-alpha/20 dark:bg-alpha/30" />
          
          {/* Profile Header */}
          <View className="bg-light dark:bg-dark border-b border-light/20 dark:border-dark/20 pb-6">
            <View className="flex-row items-center justify-between px-6 -mt-24 mb-4">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-black dark:text-white">Profile</Text>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            {/* Profile Picture and Info */}
            <View className="px-6">
              <View className="items-center mb-4">
                <Image
                  source={{ uri: profileData?.avatar || 'https://via.placeholder.com/100' }}
                  className="w-32 h-32 rounded-full mb-3 border-4 border-light dark:border-dark"
                  defaultSource={require('@/assets/images/icon.png')}
                />
                <Text className="text-2xl font-bold text-black dark:text-white mb-1">
                  {profileData?.name || 'User'}
                </Text>
                <Text className="text-sm text-black/60 dark:text-white/60 mb-1">
                  {profileData?.email || ''}
                </Text>
                {profileData?.promo && (
                  <Text className="text-xs text-black/50 dark:text-white/50 mb-2">
                    {profileData.promo}
                  </Text>
                )}
                {profileData?.roles && profileData.roles.length > 0 && (
                  <View className="flex-row items-center mt-2">
                    {profileData.roles.map((role, idx) => (
                      <View key={idx} className="px-3 py-1 rounded-full bg-alpha/20 mr-2">
                        <Text className="text-xs font-medium text-alpha">
                          {role}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Stats - LinkedIn style */}
              <View className="flex-row justify-around mb-4 py-4 border-t border-light/20 dark:border-dark/20">
                <View className="items-center">
                  <Text className="text-xl font-bold text-black dark:text-white">0</Text>
                  <Text className="text-xs text-black/60 dark:text-white/60 mt-1">Posts</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-black dark:text-white">0</Text>
                  <Text className="text-xs text-black/60 dark:text-white/60 mt-1">Followers</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-black dark:text-white">0</Text>
                  <Text className="text-xs text-black/60 dark:text-white/60 mt-1">Following</Text>
                </View>
              </View>

              {/* Action Buttons - LinkedIn style */}
              {isOwnProfile ? (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {}}
                    className="flex-1 bg-alpha dark:bg-alpha rounded-lg py-3 items-center"
                  >
                    <Text className="text-base font-semibold text-black">Edit Profile</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {}}
                    className="px-4 py-3 border border-light/30 dark:border-dark/30 rounded-lg items-center justify-center bg-light/50 dark:bg-dark/50"
                  >
                    <Ionicons name="add-outline" size={20} color={isDark ? '#fff' : '#000'} />
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {}}
                    className="flex-1 bg-alpha dark:bg-alpha rounded-lg py-3 items-center flex-row justify-center"
                  >
                    <Ionicons name="person-add-outline" size={18} color="#000" />
                    <Text className="ml-2 text-base font-semibold text-black">Connect</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {}}
                    className="px-4 py-3 border border-light/30 dark:border-dark/30 rounded-lg items-center justify-center bg-light/50 dark:bg-dark/50"
                  >
                    <Ionicons name="mail-outline" size={20} color={isDark ? '#fff' : '#000'} />
                  </Pressable>
                  <Pressable
                    onPress={() => {}}
                    className="px-4 py-3 border border-light/30 dark:border-dark/30 rounded-lg items-center justify-center bg-light/50 dark:bg-dark/50"
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? '#fff' : '#000'} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-6 pt-6 pb-8">
          {/* About Section - LinkedIn style */}
          <View className="bg-light dark:bg-dark rounded-xl p-4 mb-4 border border-light/20 dark:border-dark/20">
            <Text className="text-lg font-bold text-black dark:text-white mb-2">About</Text>
            <Text className="text-sm text-black/80 dark:text-white/80 leading-5">
              {profileData?.description || 'No description available yet.'}
            </Text>
          </View>

          {/* Create Post (only for own profile) */}
          {isOwnProfile && (
            <View className="mb-4">
              <CreatePost onPostPress={() => {}} />
            </View>
          )}

          {/* Posts Section */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-black dark:text-white">
                {isOwnProfile ? 'Your Posts' : 'Posts'}
              </Text>
              {posts.length > 0 && (
                <TouchableOpacity>
                  <Text className="text-sm text-alpha">See all</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {posts.length === 0 ? (
              <View className="py-12 items-center">
                <Ionicons name="document-text-outline" size={48} color={isDark ? '#666' : '#999'} />
                <Text className="text-center text-black/60 dark:text-white/60 mt-4">
                  No posts yet
                </Text>
              </View>
            ) : (
              posts.map((post) => (
                <FeedItem key={post.id} item={post} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
