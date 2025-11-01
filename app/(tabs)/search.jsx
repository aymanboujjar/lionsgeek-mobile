import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Pressable } from 'react-native';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';
import { router } from 'expo-router';
import API from '@/api';

export default function SearchScreen() {
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Hardcoded search results for now
  const hardcodedResults = [
    { id: 1, name: 'Mehdi Forkani', email: 'forkanimahdi@gmail.com', avatar: 'https://via.placeholder.com/50', promo: 'A1', role: 'Admin' },
    { id: 2, name: 'Hamza Ezzagmoute', email: 'hamza@example.com', avatar: 'https://via.placeholder.com/50', promo: 'A2', role: 'Student' },
    { id: 3, name: 'Nabil SAKR', email: 'nabil@example.com', avatar: 'https://via.placeholder.com/50', promo: 'A1', role: 'Student' },
    { id: 4, name: 'John Doe', email: 'john@example.com', avatar: 'https://via.placeholder.com/50', promo: 'A3', role: 'Student' },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    // Simulate search
    setTimeout(() => {
      const filtered = hardcodedResults.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    }, 300);
  };

  const handleUserPress = (userId) => {
    router.push(`/(tabs)/profile?userId=${userId}`);
  };

  return (
    <AppLayout showNavbar={false}>
      <View className="flex-1 bg-light dark:bg-dark">
        {/* Header */}
        <View className="bg-light dark:bg-dark border-b border-light/20 dark:border-dark/20 pt-12 pb-4 px-6">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-black dark:text-white flex-1">Search</Text>
          </View>

          {/* Search Input */}
          <View className="flex-row items-center bg-light/50 dark:bg-dark/50 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
            <TextInput
              className="flex-1 ml-2 text-black dark:text-white"
              placeholder="Search for people..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-4 pb-8">
            {loading ? (
              <View className="py-8">
                <Text className="text-center text-black/60 dark:text-white/60">Searching...</Text>
              </View>
            ) : results.length === 0 && searchQuery.length > 0 ? (
              <View className="py-8">
                <Text className="text-center text-black/60 dark:text-white/60">No results found</Text>
              </View>
            ) : results.length === 0 ? (
              <View className="py-8">
                <Text className="text-center text-black/60 dark:text-white/60">
                  Start typing to search for people
                </Text>
              </View>
            ) : (
              results.map((user) => (
                <Pressable
                  key={user.id}
                  onPress={() => handleUserPress(user.id)}
                  className="mb-3 bg-light dark:bg-dark rounded-lg p-4 border border-light/20 dark:border-dark/20 flex-row items-center"
                >
                  <Image
                    source={{ uri: user.avatar || 'https://via.placeholder.com/50' }}
                    className="w-12 h-12 rounded-full mr-3"
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-black dark:text-white">
                      {user.name}
                    </Text>
                    <Text className="text-sm text-black/60 dark:text-white/60">
                      {user.email}
                    </Text>
                    {user.promo && (
                      <Text className="text-xs text-black/50 dark:text-white/50 mt-1">
                        {user.promo}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </AppLayout>
  );
}

