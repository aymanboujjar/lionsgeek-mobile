import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Image } from 'react-native';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';
import Rolegard from '@/components/Rolegard';

export default function Members() {
  const { token, user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = async () => {
    if (!token) return;
    
    try {
      const response = await API.getWithAuth('mobile/members', token);
      if (response?.data) {
        setMembers(response.data.members || []);
      }
    } catch (error) {
      console.error('[MEMBERS] Error:', error);
      if (error?.response?.status === 403) {
        setMembers([]); // Not authorized
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMembers();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  return (
    <Rolegard authorized={['admin', 'coach']}>
      <AppLayout>
        <ScrollView 
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
        >
          <View>
        <Text className="text-2xl font-bold text-black dark:text-white mb-4">Members</Text>
        
        {loading ? (
          <Text className="text-center text-black/60 dark:text-white/60 py-8">Loading...</Text>
        ) : members.length === 0 ? (
          <View className="py-8">
            <Text className="text-center text-black/60 dark:text-white/60">No members found</Text>
          </View>
        ) : (
          members.map((member) => (
            <Pressable key={member.id} className="mb-3">
              <View className="bg-light dark:bg-dark rounded-lg p-4 border border-light/20 dark:border-dark/20 flex-row items-center">
                <Image
                  source={{ uri: member.avatar || 'https://via.placeholder.com/50' }}
                  className="w-12 h-12 rounded-full mr-3"
                  defaultSource={require('@/assets/images/icon.png')}
                />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-black dark:text-white">
                    {member.name}
                  </Text>
                  <Text className="text-sm text-black/60 dark:text-white/60">
                    {member.email}
                  </Text>
                  {member.promo && (
                    <Text className="text-xs text-black/50 dark:text-white/50 mt-1">
                      {member.promo}
                    </Text>
                  )}
                </View>
                {member.roles && member.roles.length > 0 && (
                  <View className="px-2 py-1 rounded-full bg-alpha/20">
                    <Text className="text-xs font-medium text-alpha">
                      {member.roles[0]}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))
        )}
          </View>
        </ScrollView>
      </AppLayout>
    </Rolegard>
  );
}



