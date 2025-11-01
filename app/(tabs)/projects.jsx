import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useAppContext } from '@/context';
import API from '@/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';

export default function Projects() {
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    if (!token) return;
    
    try {
      const response = await API.getWithAuth('mobile/projects', token);
      if (response?.data) {
        setProjects(response.data.projects || []);
      }
    } catch (error) {
      console.error('[PROJECTS] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  return (
    <AppLayout>
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
      >
        <View>
        <Text className="text-2xl font-bold text-black dark:text-white mb-4">Projects</Text>
        
        {loading ? (
          <Text className="text-center text-black/60 dark:text-white/60 py-8">Loading...</Text>
        ) : projects.length === 0 ? (
          <View className="py-8">
            <Text className="text-center text-black/60 dark:text-white/60">No projects yet</Text>
          </View>
        ) : (
          projects.map((project) => (
            <Pressable key={project.id} className="mb-4">
              <View className="bg-light dark:bg-dark rounded-lg p-4 border border-light/20 dark:border-dark/20">
                <Text className="text-lg font-semibold text-black dark:text-white mb-2">
                  {project.name}
                </Text>
                <Text className="text-sm text-black/60 dark:text-white/60 mb-3" numberOfLines={2}>
                  {project.description || 'No description'}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-black/50 dark:text-white/50">
                    {new Date(project.created_at).toLocaleDateString()}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${project.status === 'active' ? 'bg-green-500/20 dark:bg-green-500/30' : 'bg-light/50 dark:bg-dark/50'}`}>
                    <Text className={`text-xs font-medium ${project.status === 'active' ? 'text-green-700 dark:text-green-300' : 'text-black/70 dark:text-white/70'}`}>
                      {project.status}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
        </View>
      </ScrollView>
    </AppLayout>
  );
}



