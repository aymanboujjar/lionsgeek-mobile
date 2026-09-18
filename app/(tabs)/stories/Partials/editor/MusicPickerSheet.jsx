import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  Keyboard,
  Alert,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useAppContext } from '@/context';
import API from '@/api';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PREVIEW_MAX_MS,
  STORY_MAX_MS,
  CATEGORY_SECTIONS,
  getClipDurationMs,
  getPreviewPlayableMs,
  getMaxStartMs,
  buildMusicOverlayPayload,
  formatDuration,
  formatMs,
} from '@/utils/musicUtils';

const GOLD = '#ffc801';
const { height: WINDOW_H } = Dimensions.get('window');
const SHEET_H = Math.round(WINDOW_H * 0.86);

const DISPLAY_STYLES = [
  { id: 'none', label: 'Sound', icon: 'headset-outline' },
  { id: 'pill', label: 'Pill', icon: 'ellipse-outline' },
  { id: 'card', label: 'Card', icon: 'albums-outline' },
  { id: 'minimal', label: 'Line', icon: 'remove-outline' },
];

const CATEGORIES = [
  { id: 'trending', label: 'Tendance', icon: 'flame-outline' },
  { id: 'for_you', label: 'Top Maroc', icon: 'trophy-outline' },
  { id: 'original', label: 'Original', icon: 'mic-outline' },
  { id: 'saved', label: 'Saved', icon: 'bookmark-outline' },
];

/**
 * Story music picker — GET /mobile/music/browse (Morocco charts & trending).
 */
export default function MusicPickerSheet({ visible, onClose, onPick }) {
  const { token } = useAppContext();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_H);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('trending');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(null);
  const [savedTracks, setSavedTracks] = useState([]);
  const [sectionTitle, setSectionTitle] = useState('Tendance au Maroc');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [startMs, setStartMs] = useState(0);
  const [display, setDisplay] = useState('none');
  const [playing, setPlaying] = useState(false);
  const inputRef = useRef(null);
  const soundRef = useRef(null);
  const positionTimerRef = useRef(null);
  const [audioPos, setAudioPos] = useState(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
    } else {
      translateY.value = withTiming(SHEET_H, { duration: 200 });
      setTimeout(() => {
        setQuery('');
        setCategory('trending');
        setResults([]);
        setSelected(null);
        setStartMs(0);
        setDisplay('none');
        setFeaturedIndex(0);
        setSectionTitle('Tendance au Maroc');
      }, 220);
    }
  }, [visible]);

  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers',
        });
      } catch (_) {}
    })();
    return () => unloadAudio();
  }, []);

  const unloadAudio = useCallback(async () => {
    if (positionTimerRef.current) {
      clearInterval(positionTimerRef.current);
      positionTimerRef.current = null;
    }
    if (soundRef.current) {
      try { soundRef.current.pause(); } catch (_) {}
      try { soundRef.current.release(); } catch (_) {}
      soundRef.current = null;
    }
    setPlaying(false);
    setAudioPos(0);
  }, []);

  useEffect(() => {
    if (!visible) unloadAudio();
  }, [visible, unloadAudio]);

  const toggleSaved = useCallback((track) => {
    if (!track?.id) return;
    setSavedTracks((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) return prev.filter((t) => t.id !== track.id);
      return [track, ...prev];
    });
  }, []);

  const isTrackSaved = useCallback(
    (track) => savedTracks.some((t) => t.id === track?.id),
    [savedTracks],
  );

  useEffect(() => {
    if (!visible) return;

    if (category === 'saved' && !query.trim()) {
      setResults(savedTracks);
      setSectionTitle('Saved');
      setLoading(false);
      return;
    }

    const section = query.trim()
      ? 'search'
      : (CATEGORY_SECTIONS[category] || 'top_morocco');

    if (section === 'saved') return;

    let cancelled = false;
    setLoading(true);
    const delay = query.trim() ? 350 : 0;
    const t = setTimeout(async () => {
      try {
        const data = await API.browseMusic(token, {
          section,
          country: 'MA',
          q: query.trim(),
          limit: 50,
        });
        if (cancelled) return;
        setSectionTitle(data?.title || 'Tendance au Maroc');
        setSource(data?.source || null);
        setResults(Array.isArray(data?.items) ? data.items : []);
        setFeaturedIndex(0);
      } catch (_) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delay);

    return () => { cancelled = true; clearTimeout(t); };
  }, [query, category, token, visible, savedTracks]);

  const playTrack = useCallback(async (track) => {
    await unloadAudio();
    if (!track?.preview_url) {
      setPlaying(false);
      return;
    }
    try {
      const player = createAudioPlayer({ uri: track.preview_url });
      player.loop = true;
      player.volume = 1.0;
      player.play();
      soundRef.current = player;
      setPlaying(true);
      positionTimerRef.current = setInterval(() => {
        try {
          const player = soundRef.current;
          if (player) setAudioPos(Math.round((player.currentTime || 0) * 1000));
        } catch (_) {}
      }, 150);
    } catch (e) {
      Alert.alert('Playback error', e?.message || 'Could not play preview.');
      setPlaying(false);
    }
  }, [unloadAudio]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) {
      if (selected) await playTrack(selected);
      return;
    }
    try {
      const player = soundRef.current;
      if (player.playing) {
        player.pause();
        setPlaying(false);
      } else {
        player.play();
        setPlaying(true);
      }
    } catch (_) {}
  }, [selected, playTrack]);

  const handleSelectTrack = useCallback(async (track) => {
    setSelected(track);
    setStartMs(0);
    setDisplay('none');
    await playTrack(track);
  }, [playTrack]);

  const clipDurationMs = selected ? getClipDurationMs(selected) : STORY_MAX_MS;
  const previewPlayableMs = selected ? getPreviewPlayableMs(selected) : PREVIEW_MAX_MS;
  const maxStartMs = selected ? getMaxStartMs(selected) : 0;
  const trimWindowFraction = clipDurationMs > 0
    ? Math.min(1, previewPlayableMs / clipDurationMs)
    : 1;

  const trackBarRef = useRef({ width: 0, x: 0 });
  const onTrackBarLayout = useCallback((e) => {
    const { width, x } = e.nativeEvent.layout;
    trackBarRef.current = { width, x };
  }, []);

  const setStartFromPosition = useCallback(async (positionX) => {
    const { width } = trackBarRef.current;
    if (!width || !selected) return;
    const movable = width * (1 - trimWindowFraction);
    const clamped = Math.max(0, Math.min(movable, positionX));
    const ratio = movable > 0 ? clamped / movable : 0;
    const newStart = Math.round(ratio * maxStartMs);
    setStartMs(newStart);
    if (soundRef.current) {
      try {
        soundRef.current.seekTo(newStart / 1000);
      } catch (_) {}
    }
  }, [selected, maxStartMs, trimWindowFraction]);

  const trimPanGesture = Gesture.Pan()
    .onUpdate((e) => {
      runOnJS(setStartFromPosition)(e.x);
    })
    .onEnd((e) => {
      runOnJS(setStartFromPosition)(e.x);
    });

  const commit = useCallback(async () => {
    if (!selected) return;
    await unloadAudio();
    const overlay = buildMusicOverlayPayload(selected, {
      startMs,
      display,
      source: selected.source || source,
    });
    if (selected.local_uri || selected.source === 'user') {
      overlay.local_uri = selected.local_uri || selected.preview_url;
      overlay.mimeType = selected.mimeType || 'audio/mpeg';
      overlay.source = 'user';
      overlay.original_volume = 0;
      overlay.music_volume = 0.85;
    }
    onPick?.(overlay);
  }, [selected, startMs, display, source, unloadAudio, onPick]);

  const dismiss = useCallback(async () => {
    Keyboard.dismiss();
    await unloadAudio();
    onClose && onClose();
  }, [onClose, unloadAudio]);

  const pickOwnAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;
      await unloadAudio();
      setSelected({
        id: `user_${Date.now()}`,
        title: file.name || 'Your audio',
        artist: 'You',
        preview_url: file.uri,
        local_uri: file.uri,
        mimeType: file.mimeType || 'audio/mpeg',
        duration_ms: 60000,
        source: 'user',
      });
      setStartMs(0);
      setDisplay('sticker');
    } catch (e) {
      Alert.alert('Could not add audio', e?.message || 'Try another file.');
    }
  }, [unloadAudio]);

  const closePanGesture = Gesture.Pan()
    .activeOffsetY(15)
    .failOffsetY(-15)
    .onUpdate((e) => { if (e.translationY > 0) translateY.value = e.translationY; })
    .onEnd((e) => {
      if (e.translationY > 140 || e.velocityY > 700) {
        translateY.value = withTiming(SHEET_H, { duration: 200 }, (f) => {
          if (f) runOnJS(dismiss)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 180 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - translateY.value / SHEET_H) * 0.62,
  }));

  const waveformBars = useMemo(() => {
    if (!selected) return [];
    const seed = (selected.id || '').split('').reduce((acc, c) => (acc + c.charCodeAt(0)) | 0, 0);
    const bars = [];
    for (let i = 0; i < 56; i++) {
      const v = Math.abs(Math.sin(seed * 0.13 + i * 0.41) * 0.6 + Math.cos(i * 0.83) * 0.4);
      bars.push(0.18 + Math.min(0.82, v));
    }
    return bars;
  }, [selected]);

  const isSearching = query.trim().length > 0;
  const listTracks = category === 'saved' && !isSearching ? savedTracks : results;
  const listLoading = loading;
  const showTrendBadge = category === 'trending' && !isSearching;

  if (!visible && translateY.value === SHEET_H) return null;

  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      style={styles.root}
    >
      <Pressable onPress={dismiss} style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      <GestureHandlerRootView style={styles.sheetHost} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <LinearGradient
            colors={['#1c1708', '#111111']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <GestureDetector gesture={closePanGesture}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Music</Text>
              <Text style={styles.headerSub}>Add a track to this story</Text>
            </View>
            <Pressable onPress={dismiss} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.42)" />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search songs or artists"
                placeholderTextColor="rgba(255,255,255,0.38)"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                </Pressable>
              ) : loading ? (
                <ActivityIndicator size="small" color={GOLD} />
              ) : null}
            </View>
            <Pressable
              onPress={pickOwnAudio}
              style={styles.ownAudioBtn}
              hitSlop={6}
              accessibilityLabel="Use audio you own"
            >
              <Ionicons name="folder-open-outline" size={18} color={GOLD} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={styles.chipsScroll}
          >
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={active ? '#111' : 'rgba(255,255,255,0.72)'}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={{ paddingBottom: selected ? 340 : 28 }}
            showsVerticalScrollIndicator={false}
          >
            {listLoading && listTracks.length === 0 ? (
              <View style={styles.skelWrap}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={styles.skelRow}>
                    <View style={styles.skelArt} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <View style={[styles.skelLine, { width: i % 2 ? '58%' : '72%' }]} />
                      <View style={[styles.skelLine, { width: '38%', opacity: 0.5 }]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : !listLoading && listTracks.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name={category === 'saved' ? 'bookmark-outline' : 'musical-notes-outline'}
                    size={28}
                    color={GOLD}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {category === 'saved' ? 'Nothing saved yet' : 'No tracks found'}
                </Text>
                <Text style={styles.emptySub}>
                  {category === 'saved'
                    ? 'Tap the bookmark on a song to keep it here.'
                    : 'Try another search, or add a file you own.'}
                </Text>
              </View>
            ) : (
              <>
                {listTracks.length > 0 && !isSearching ? (
                  <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                ) : isSearching ? (
                  <Text style={styles.sectionTitle}>Search results</Text>
                ) : null}

                {listTracks.length > 0 && !selected && !isSearching ? (
                  <FeaturedCard
                    track={listTracks[featuredIndex % listTracks.length]}
                    index={featuredIndex}
                    total={Math.min(listTracks.length, 4)}
                    onPress={() => handleSelectTrack(listTracks[featuredIndex % listTracks.length])}
                    onDotPress={setFeaturedIndex}
                  />
                ) : null}

                {listTracks.map((t, index) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    rank={!isSearching && category !== 'saved' && category !== 'original' ? index + 1 : null}
                    showTrendBadge={showTrendBadge}
                    isSelected={selected?.id === t.id}
                    isPlaying={selected?.id === t.id && playing}
                    isSaved={isTrackSaved(t)}
                    onPress={() => handleSelectTrack(t)}
                    onToggleSave={() => toggleSaved(t)}
                  />
                ))}
              </>
            )}
          </ScrollView>

          {selected ? (
            <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
              <LinearGradient
                colors={['rgba(17,17,17,0)', '#161616']}
                style={styles.dockFade}
                pointerEvents="none"
              />
              <View style={styles.dockInner}>
                <View style={styles.dockTrack}>
                  {selected.cover_url ? (
                    <Image source={{ uri: selected.cover_url }} style={styles.dockArt} />
                  ) : (
                    <View style={[styles.dockArt, styles.artFallback]}>
                      <Ionicons name="musical-note" size={26} color={GOLD} />
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={styles.dockTitle}>{selected.title}</Text>
                    <Text numberOfLines={1} style={styles.dockArtist}>{selected.artist}</Text>
                    <Text style={styles.dockTime}>
                      {`${formatMs(startMs)} – ${formatMs(Math.min(startMs + previewPlayableMs, clipDurationMs))}`}
                    </Text>
                  </View>
                  <Pressable onPress={togglePlay} style={styles.playBtn}>
                    <Ionicons
                      name={playing ? 'pause' : 'play'}
                      size={22}
                      color="#111"
                      style={playing ? null : { marginLeft: 2 }}
                    />
                  </Pressable>
                </View>

                {!selected.preview_url ? (
                  <Text style={styles.dockHint}>No audio preview — this will show as a sticker only.</Text>
                ) : (
                  <GestureDetector gesture={trimPanGesture}>
                    <View onLayout={onTrackBarLayout} style={styles.waveWrap}>
                      <View style={styles.waveBars}>
                        {waveformBars.map((h, i) => (
                          <View
                            key={i}
                            style={[styles.waveBar, { height: `${h * 86}%` }]}
                          />
                        ))}
                      </View>
                      <Trimmable
                        startMs={startMs}
                        waveformBars={waveformBars}
                        clipDurationMs={clipDurationMs}
                        previewPlayableMs={previewPlayableMs}
                      />
                      <Playhead audioPos={audioPos} totalMs={clipDurationMs} />
                    </View>
                  </GestureDetector>
                )}

                <Text style={styles.dockLabel}>Display</Text>
                <View style={styles.displayRow}>
                  {DISPLAY_STYLES.map((s) => {
                    const active = display === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => setDisplay(s.id)}
                        style={[styles.displayChip, active && styles.displayChipActive]}
                      >
                        <Ionicons name={s.icon} size={15} color={active ? '#111' : 'rgba(255,255,255,0.75)'} />
                        <Text style={[styles.displayText, active && styles.displayTextActive]}>{s.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable onPress={commit} style={styles.doneBtn}>
                  <Ionicons name="checkmark" size={18} color="#111" />
                  <Text style={styles.doneText}>Add to story</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </Animated.View>
      </GestureHandlerRootView>
    </View>
  );
}

function FeaturedCard({ track, index, total, onPress, onDotPress }) {
  if (!track) return null;
  return (
    <View style={styles.featuredWrap}>
      <Pressable onPress={onPress} style={styles.featuredCard}>
        {track.cover_url ? (
          <Image source={{ uri: track.cover_url }} style={styles.featuredBg} blurRadius={Platform.OS === 'ios' ? 28 : 8} />
        ) : null}
        <LinearGradient
          colors={['rgba(17,17,17,0.15)', 'rgba(17,17,17,0.82)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.featuredGoldEdge} />
        <View style={styles.featuredContent}>
          {track.cover_url ? (
            <Image source={{ uri: track.cover_url }} style={styles.featuredArt} />
          ) : (
            <View style={[styles.featuredArt, styles.artFallback]}>
              <Ionicons name="musical-note" size={26} color={GOLD} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.featuredKicker}>Featured</Text>
            <Text numberOfLines={1} style={styles.featuredTitle}>{track.title}</Text>
            <Text numberOfLines={1} style={styles.featuredArtist}>{track.artist}</Text>
          </View>
          <View style={styles.featuredPlay}>
            <Ionicons name="play" size={16} color="#111" style={{ marginLeft: 1 }} />
          </View>
        </View>
      </Pressable>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }).map((_, i) => (
          <Pressable key={i} onPress={() => onDotPress?.(i)} hitSlop={8}>
            <View style={[styles.dot, i === (index % total) && styles.dotActive]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TrackRow({
  track, rank, showTrendBadge, isSelected, isPlaying, isSaved, onPress, onToggleSave,
}) {
  const hasPreview = !!track?.preview_url;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.trackRow,
        isSelected && styles.trackRowSelected,
        { opacity: hasPreview ? 1 : 0.55 },
      ]}
    >
      {rank ? (
        <Text style={[styles.rank, rank <= 3 && styles.rankHot]}>{rank}</Text>
      ) : null}

      <View style={styles.artWrap}>
        {track.cover_url ? (
          <Image source={{ uri: track.cover_url }} style={styles.art} />
        ) : (
          <View style={[styles.art, styles.artFallback]}>
            <Ionicons name="musical-note" size={16} color={GOLD} />
          </View>
        )}
        {isSelected ? (
          <View style={styles.artPlayOverlay}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color="#111" />
          </View>
        ) : null}
      </View>

      <View style={styles.trackMeta}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.trackTitle, isSelected && styles.trackTitleActive]}>
            {track.title}
          </Text>
          {track.explicit ? (
            <View style={styles.explicitBadge}>
              <Text style={styles.explicitText}>E</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.subRow}>
          {showTrendBadge ? (
            <Ionicons name="flame" size={11} color={GOLD} />
          ) : null}
          <Text numberOfLines={1} style={styles.trackArtist}>{track.artist}</Text>
          <Text style={styles.dotSep}>·</Text>
          <Text style={styles.trackDuration}>{formatDuration(track.duration_ms)}</Text>
        </View>
      </View>

      <Pressable onPress={onToggleSave} hitSlop={12} style={styles.saveBtn}>
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={18}
          color={isSaved ? GOLD : 'rgba(255,255,255,0.55)'}
        />
      </Pressable>
    </Pressable>
  );
}

function Trimmable({ startMs, waveformBars, clipDurationMs, previewPlayableMs }) {
  const windowFraction = clipDurationMs > 0
    ? Math.min(1, previewPlayableMs / clipDurationMs)
    : 1;
  const maxStart = Math.max(0, clipDurationMs - previewPlayableMs);
  const leftFraction = maxStart > 0 ? (startMs / maxStart) * (1 - windowFraction) : 0;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: `${leftFraction * 100}%`,
        width: `${windowFraction * 100}%`,
        borderWidth: 1.5,
        borderColor: GOLD,
        borderRadius: 10,
        backgroundColor: 'rgba(255,200,1,0.16)',
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, gap: 2 }}>
        {waveformBars.slice(0, Math.round(waveformBars.length * windowFraction)).map((h, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: `${h * 78}%`,
              backgroundColor: GOLD,
              borderRadius: 1.5,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function Playhead({ audioPos, totalMs }) {
  const left = `${(audioPos / Math.max(1, totalMs)) * 100}%`;
  return (
    <View
      pointerEvents="none"
      style={[styles.playhead, { left }]}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    inset: 0,
    zIndex: 2000,
    elevation: 2000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  sheetHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    height: SHEET_H,
    backgroundColor: '#111',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,1,0.16)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 0,
  },
  ownAudioBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,200,1,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,1,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  chipText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#111',
  },
  list: {
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 18,
    marginBottom: 10,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  skelWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  skelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skelArt: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  skelLine: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  empty: {
    paddingHorizontal: 28,
    paddingTop: 56,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,200,1,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  featuredWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 118,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,200,1,0.18)',
  },
  featuredBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  featuredGoldEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: GOLD,
  },
  featuredContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 16,
    gap: 12,
  },
  featuredArt: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#222',
  },
  featuredKicker: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  featuredTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  featuredArtist: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '600',
  },
  featuredPlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: GOLD,
    width: 16,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 14,
  },
  trackRowSelected: {
    backgroundColor: 'rgba(255,200,1,0.1)',
  },
  rank: {
    width: 22,
    color: 'rgba(255,255,255,0.32)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 6,
  },
  rankHot: {
    color: GOLD,
  },
  artWrap: {
    width: 48,
    height: 48,
    flexShrink: 0,
  },
  art: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#222',
  },
  artFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,200,1,0.1)',
  },
  artPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackMeta: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    flexShrink: 1,
  },
  trackTitleActive: {
    color: GOLD,
  },
  explicitBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 3,
  },
  explicitText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  trackArtist: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 12,
    flexShrink: 1,
    fontWeight: '600',
  },
  dotSep: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 12,
  },
  trackDuration: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    flexShrink: 0,
    padding: 4,
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  dockFade: {
    height: 18,
  },
  dockInner: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,200,1,0.18)',
  },
  dockTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  dockArt: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#222',
  },
  dockTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  dockArtist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '600',
  },
  dockTime: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  playBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 8,
  },
  waveWrap: {
    height: 62,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  waveBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 2,
  },
  waveBar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
  },
  playhead: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  dockLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  displayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  displayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  displayChipActive: {
    backgroundColor: GOLD,
  },
  displayText: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    fontSize: 11,
  },
  displayTextActive: {
    color: '#111',
  },
  doneBtn: {
    marginTop: 14,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  doneText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 16,
  },
});
