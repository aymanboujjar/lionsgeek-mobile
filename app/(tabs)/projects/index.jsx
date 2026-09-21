import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';
import Skeleton from '@/components/ui/Skeleton';
import API from '@/api';
import { Colors } from '@/constants/Colors';
import { userHasAnyRole } from '@/utils/roles';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'on_hold', label: 'On hold' },
  { id: 'completed', label: 'Done' },
];

const STATUS_META = {
  active: { label: 'Active', color: '#16a34a', bg: 'rgba(22,163,74,0.14)' },
  completed: { label: 'Completed', color: '#2563eb', bg: 'rgba(37,99,235,0.14)' },
  on_hold: { label: 'On hold', color: '#d97706', bg: 'rgba(217,119,6,0.14)' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: 'rgba(220,38,38,0.14)' },
};

function StatusChip({ status }) {
  const meta = STATUS_META[status] || STATUS_META.active;
  return (
    <View style={{ backgroundColor: meta.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
      <Text style={{ color: meta.color, fontSize: 11, fontWeight: '800' }}>{meta.label}</Text>
    </View>
  );
}

function ProjectCard({ item, isDark }) {
  const progress = Math.max(0, Math.min(100, Number(item.progress_percentage) || 0));
  const muted = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const card = isDark ? Colors.card_dark : '#fff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const text = isDark ? '#fff' : '#111';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(tabs)/projects/[id]', params: { id: String(item.id) } })}
      style={({ pressed }) => ({
        backgroundColor: card,
        borderColor: border,
        borderWidth: 1,
        borderRadius: 18,
        padding: 14,
        opacity: pressed ? 0.85 : 1,
        marginBottom: 12,
      })}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Ionicons name="cube-outline" size={24} color={Colors.alpha} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, color: text, fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
              {item.name}
            </Text>
            <StatusChip status={item.status} />
          </View>
          {item.description ? (
            <Text style={{ color: muted, fontSize: 13, marginTop: 4, fontWeight: '500' }} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="people-outline" size={14} color={muted} />
              <Text style={{ color: muted, fontSize: 12, fontWeight: '600' }}>{item.members_count || 0}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="checkbox-outline" size={14} color={muted} />
              <Text style={{ color: muted, fontSize: 12, fontWeight: '600' }}>
                {item.completed_tasks_count || 0}/{item.tasks_count || 0}
              </Text>
            </View>
            <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginLeft: 'auto' }}>
              {(item.my_role || 'member').replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: muted, fontSize: 11, fontWeight: '700' }}>Progress</Text>
          <Text style={{ color: text, fontSize: 11, fontWeight: '800' }}>{progress}%</Text>
        </View>
        <View style={{ height: 6, borderRadius: 999, backgroundColor: isDark ? '#2e2e2e' : '#ececec', overflow: 'hidden' }}>
          <View style={{ width: `${progress}%`, height: '100%', backgroundColor: Colors.alpha }} />
        </View>
      </View>
    </Pressable>
  );
}

export default function ProjectsListScreen() {
  const { token, user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const canCreate = userHasAnyRole(user, ['admin', 'super_admin', 'moderateur', 'coach', 'pro']);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const text = isDark ? '#fff' : '#111';
  const muted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.48)';
  const hairline = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const load = useCallback(async () => {
    if (!token) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await API.listProjects(token, {
        status: filter === 'all' ? undefined : filter,
        search: query.trim() || undefined,
      });
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
    } catch (e) {
      console.error('[PROJECTS]', e);
      setError('Could not load projects.');
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, filter, query]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => load(), query ? 280 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const header = useMemo(
    () => (
      <View style={{ marginBottom: 14 }}>
        <View
          style={{
            backgroundColor: isDark ? Colors.card_dark : '#fff',
            borderBottomColor: hairline,
            borderBottomWidth: 1,
            marginHorizontal: -16,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color={text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: text, fontSize: 22, fontWeight: '800' }}>Projects</Text>
              <Text style={{ color: muted, fontSize: 12, marginTop: 2, fontWeight: '600' }}>
                Team workspaces, tasks, and chat
              </Text>
            </View>
            {canCreate ? (
              <Pressable
                onPress={() => router.push('/(tabs)/projects/form')}
                style={{
                  backgroundColor: Colors.alpha,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={24} color="#111" />
              </Pressable>
            ) : null}
          </View>

          <View
            style={{
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: hairline,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === 'ios' ? 11 : 7,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : Colors.light,
            }}
          >
            <Ionicons name="search" size={16} color={muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search projects"
              placeholderTextColor={muted}
              style={{ flex: 1, color: text, fontSize: 15, fontWeight: '600', paddingVertical: 0 }}
              autoCorrect={false}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={muted} />
              </Pressable>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => {
              const selected = filter === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFilter(f.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: selected ? Colors.alpha : isDark ? 'rgba(255,255,255,0.06)' : '#fff',
                    borderWidth: 1,
                    borderColor: selected ? Colors.alpha : hairline,
                  }}
                >
                  <Text style={{ color: selected ? '#111' : text, fontSize: 12, fontWeight: '800' }}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {error ? (
          <Text style={{ color: muted, textAlign: 'center', paddingTop: 12, paddingHorizontal: 16, fontSize: 13 }}>
            {error}
          </Text>
        ) : null}
      </View>
    ),
    [canCreate, error, filter, hairline, isDark, muted, query, text]
  );

  if (!token) {
    return (
      <AppLayout showNavbar={false}>
        <View className="flex-1 bg-light dark:bg-dark items-center justify-center px-8">
          <Ionicons name="cube-outline" size={40} color={Colors.alpha} />
          <Text className="mt-4 text-base font-semibold text-black dark:text-white text-center">
            Sign in to see your projects
          </Text>
          <Pressable
            onPress={() => router.push('/auth/login')}
            className="mt-6 rounded-xl bg-alpha px-6 py-3"
          >
            <Text className="text-sm font-bold text-black">Go to login</Text>
          </Pressable>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNavbar={false}>
      <View className="flex-1 bg-light dark:bg-dark">
        <FlatList
          data={projects}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.alpha} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={{ paddingTop: 16, gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      borderRadius: 18,
                      padding: 14,
                      backgroundColor: isDark ? Colors.card_dark : '#fff',
                      borderWidth: 1,
                      borderColor: hairline,
                    }}
                  >
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Skeleton width={52} height={52} borderRadius={14} isDark={isDark} />
                      <View style={{ flex: 1, gap: 8 }}>
                        <Skeleton width="70%" height={14} borderRadius={8} isDark={isDark} />
                        <Skeleton width="90%" height={12} borderRadius={8} isDark={isDark} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    backgroundColor: Colors.alpha,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="cube-outline" size={28} color="#111" />
                </View>
                <Text style={{ color: text, fontSize: 16, fontWeight: '800', marginTop: 14 }}>
                  No projects yet
                </Text>
                <Text style={{ color: muted, textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 19 }}>
                  When a coach or admin adds you to a team project, it will show up here with tasks and chat.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => <ProjectCard item={item} isDark={isDark} />}
        />
      </View>
    </AppLayout>
  );
}
