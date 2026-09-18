import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import API from '@/api';

export default function StoryArchiveScreen() {
  const { token } = useAppContext();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await API.listStoryArchive(token);
      setStories(Array.isArray(data?.stories) ? data.stories : []);
    } catch (_) {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const reshare = (story) => {
    Alert.alert('Share again?', 'This posts a new 24-hour story from this archive item.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Share',
        onPress: async () => {
          try {
            await API.reshareStory(story.id, token);
            Alert.alert('Posted', 'Your story is live again for 24 hours.');
            router.replace('/(tabs)/home');
          } catch (e) {
            Alert.alert('Could not share', e?.message || 'Try again.');
          }
        },
      },
    ]);
  };

  const remove = (story) => {
    Alert.alert('Delete from archive?', 'This permanently removes the story.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.deleteStory(story.id, token);
            setStories((prev) => prev.filter((s) => s.id !== story.id));
          } catch (e) {
            Alert.alert('Error', e?.message || 'Could not delete.');
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0f0f0f' : '#f4f1ea', paddingTop: 54 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={isDark ? '#fff' : '#111'} />
        </Pressable>
        <Text style={{ marginLeft: 8, fontSize: 20, fontWeight: '800', color: isDark ? '#fff' : '#111' }}>Story archive</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#ffc801" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 48, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>
              Expired stories stay here privately.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => reshare(item)}
              onLongPress={() => remove(item)}
              style={{ width: '33.33%', aspectRatio: 9 / 16, padding: 4 }}
            >
              <View style={{ flex: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: item.bg_color || '#111' }}>
                {item.media_url ? (
                  <Image source={{ uri: item.media_url }} style={{ width: '100%', height: '100%' }} />
                ) : null}
                {item.is_hidden ? (
                  <View style={{ position: 'absolute', bottom: 6, left: 6, right: 6 }}>
                    <Text style={{ color: '#ffc801', fontSize: 10, fontWeight: '800' }}>Removed</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
