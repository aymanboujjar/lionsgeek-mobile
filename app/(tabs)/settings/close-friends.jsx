import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
  StyleSheet,
  SectionList,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import API from '@/api';

const GOLD = Colors.alpha;
const TOP_INSET = (Platform.OS === 'ios' ? 54 : RNStatusBar.currentHeight ?? 24) + 6;

function Avatar({ user, size = 48, ring = false, isDark }) {
  const initial = (user?.name || 'U').charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ring ? 2 : 0,
          borderColor: ring ? GOLD : 'transparent',
        },
      ]}
    >
      {user?.avatar ? (
        <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: isDark ? '#2a2a2a' : '#ececec' }]}>
          <Text style={{ color: isDark ? '#fff' : '#111', fontWeight: '800', fontSize: size * 0.34 }}>
            {initial}
          </Text>
        </View>
      )}
    </View>
  );
}

function CircleAction({ selected, pending, onPress, isDark }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      hitSlop={10}
      style={({ pressed }) => [
        styles.circle,
        selected ? styles.circleOn : styles.circleOff,
        !selected && {
          borderColor: isDark ? 'rgba(255,200,1,0.55)' : 'rgba(0,0,0,0.22)',
        },
        (pressed || pending) && { opacity: 0.55 },
      ]}
    >
      {pending ? (
        <ActivityIndicator size="small" color={selected ? '#111' : GOLD} />
      ) : selected ? (
        <Ionicons name="checkmark" size={16} color="#111" />
      ) : (
        <Ionicons name="add" size={16} color={isDark ? GOLD : '#111'} />
      )}
    </Pressable>
  );
}

function PersonRow({ user, pending, onToggle, isDark, text }) {
  const selected = !!user.is_close;
  return (
    <View style={styles.row}>
      <Avatar user={user} size={44} ring={selected} isDark={isDark} />
      <Text style={[styles.rowName, { color: text }]} numberOfLines={1}>
        {user.name}
      </Text>
      <CircleAction
        selected={selected}
        pending={pending}
        isDark={isDark}
        onPress={() => onToggle(user)}
      />
    </View>
  );
}

/**
 * Close Friends manager.
 * Candidates = people you follow. Explicit Add / Remove actions, split list.
 */
export default function CloseFriendsScreen() {
  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await API.listCloseFriends(token);
      const closeIds = new Set((data?.close_friends || []).map((u) => u.id));
      const list = (data?.candidates || []).map((u) => ({
        ...u,
        is_close: closeIds.has(u.id),
      }));
      const candIds = new Set(list.map((u) => u.id));
      (data?.close_friends || []).forEach((u) => {
        if (!candIds.has(u.id)) list.push({ ...u, is_close: true });
      });
      setCandidates(list);
    } catch (_) {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (u) => {
      if (!token || pendingIds.has(u.id)) return;
      const wasClose = u.is_close;
      setPendingIds((s) => new Set(s).add(u.id));
      setCandidates((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, is_close: !wasClose } : x))
      );
      try {
        if (wasClose) {
          await API.removeCloseFriend(u.id, token);
        } else {
          await API.addCloseFriend(u.id, token);
        }
      } catch (e) {
        setCandidates((prev) =>
          prev.map((x) => (x.id === u.id ? { ...x, is_close: wasClose } : x))
        );
        Alert.alert('Error', e?.message || 'Could not update close friends.');
      } finally {
        setPendingIds((s) => {
          const n = new Set(s);
          n.delete(u.id);
          return n;
        });
      }
    },
    [token, pendingIds]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((u) => (u.name || '').toLowerCase().includes(q));
  }, [candidates, query]);

  const onList = useMemo(() => filtered.filter((u) => u.is_close), [filtered]);
  const suggested = useMemo(() => filtered.filter((u) => !u.is_close), [filtered]);
  const closeAll = useMemo(() => candidates.filter((u) => u.is_close), [candidates]);
  const closeCount = closeAll.length;

  const sections = useMemo(() => {
    const next = [];
    if (onList.length > 0) {
      next.push({ key: 'on', title: 'On your list', data: onList });
    }
    if (suggested.length > 0) {
      next.push({ key: 'suggested', title: 'Suggested', data: suggested });
    }
    return next;
  }, [onList, suggested]);

  const bg = isDark ? Colors.dark : Colors.light;
  const text = isDark ? '#fff' : '#111';
  const muted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.48)';
  const hairline = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const surface = isDark ? Colors.card_dark : '#fff';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[
          styles.header,
          {
            paddingTop: TOP_INSET,
            borderBottomColor: hairline,
            backgroundColor: surface,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: text }]}>Close Friends</Text>
          <Text style={[styles.subtitle, { color: muted }]}>
            {closeCount === 0
              ? 'No one on your list yet'
              : `${closeCount} ${closeCount === 1 ? 'person' : 'people'} on your list`}
          </Text>
        </View>
      </View>

      <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(255,200,1,0.1)' : 'rgba(255,200,1,0.16)' }]}>
        <View style={styles.infoIcon}>
          <Ionicons name="star" size={14} color="#111" />
        </View>
        <Text style={[styles.infoText, { color: isDark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.7)' }]}>
          People you add can see stories you share to Close Friends. They won’t be notified when you
          add or remove them.
        </Text>
      </View>

      <View
        style={[
          styles.searchWrap,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
            borderColor: hairline,
          },
        ]}
      >
        <Ionicons name="search" size={16} color={muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people you follow"
          placeholderTextColor={muted}
          style={{ flex: 1, color: text, fontSize: 15, paddingVertical: 0, fontWeight: '600' }}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={muted} />
          </Pressable>
        ) : null}
      </View>

      {!loading && closeAll.length > 0 && !query ? (
        <View style={styles.stripWrap}>
          <Text style={[styles.stripLabel, { color: muted }]}>Quick remove</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stripContent}
          >
            {closeAll.map((u) => {
              const pending = pendingIds.has(u.id);
              return (
                <Pressable
                  key={u.id}
                  onPress={() => toggle(u)}
                  disabled={pending}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: surface,
                      borderColor: hairline,
                      opacity: pressed || pending ? 0.6 : 1,
                    },
                  ]}
                >
                  <Avatar user={u} size={40} ring isDark={isDark} />
                  <Text style={[styles.chipName, { color: text }]} numberOfLines={1}>
                    {(u.name || '').split(' ')[0]}
                  </Text>
                  <View style={styles.chipRemove}>
                    {pending ? (
                      <ActivityIndicator size="small" color="#111" />
                    ) : (
                      <Ionicons name="close" size={12} color="#111" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={GOLD} />
        </View>
      ) : sections.length === 0 ? (
        <View style={[styles.centered, { paddingHorizontal: 32 }]}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={28} color="#111" />
          </View>
          <Text style={[styles.emptyTitle, { color: text }]}>
            {query ? 'No matches' : 'Build your list'}
          </Text>
          <Text style={[styles.emptyBody, { color: muted }]}>
            {query
              ? 'Try another name.'
              : 'Follow people first, then add them here so they can see your Close Friends stories.'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: hairline }]} />
          )}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: bg }]}>
              <Text style={[styles.sectionTitle, { color: text }]}>{section.title}</Text>
              <Text style={[styles.sectionCount, { color: muted }]}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <PersonRow
              user={item}
              pending={pendingIds.has(item.id)}
              onToggle={toggle}
              isDark={isDark}
              text={text}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  infoBanner: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
  },
  searchWrap: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  stripWrap: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  stripLabel: {
    paddingHorizontal: 18,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  stripContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipName: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 72,
  },
  chipRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    minWidth: 0,
  },
  avatar: {
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  circleOn: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  circleOff: {
    backgroundColor: 'transparent',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyBody: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
});
