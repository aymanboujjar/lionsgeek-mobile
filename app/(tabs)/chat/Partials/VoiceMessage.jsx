import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';

/** Deterministic Instagram-like waveform heights */
function barHeight(index, total) {
  const wave = Math.sin(index * 0.55) * 0.5 + Math.cos(index * 1.1) * 0.35;
  const midBoost = 1 - Math.abs(index / total - 0.45) * 1.2;
  const normalized = Math.max(0.2, Math.min(1, 0.45 + wave * 0.35 + midBoost * 0.35));
  return Math.round(8 + normalized * 22);
}

export default function VoiceMessage({ audioUrl, duration, isCurrentUser, onPlayStateChange, headers }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef(null);
  const statusSubRef = useRef(null);
  const bars = useMemo(() => Array.from({ length: 32 }, (_, i) => barHeight(i, 32)), []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const releasePlayer = () => {
    if (statusSubRef.current) {
      try {
        statusSubRef.current.remove();
      } catch (_) {}
      statusSubRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch (_) {}
      try {
        playerRef.current.release();
      } catch (_) {}
      playerRef.current = null;
    }
  };

  const togglePlayback = async () => {
    try {
      if (!playerRef.current) {
        const source = headers ? { uri: audioUrl, headers } : { uri: audioUrl };
        const player = createAudioPlayer(source);
        playerRef.current = player;

        statusSubRef.current = player.addListener('playbackStatusUpdate', (status) => {
          setCurrentTime(status.currentTime || 0);
          setIsPlaying(!!status.playing);

          if (
            status.didJustFinish ||
            (!status.playing &&
              status.currentTime > 0 &&
              status.duration > 0 &&
              status.currentTime >= status.duration - 0.05)
          ) {
            setIsPlaying(false);
            setCurrentTime(0);
            onPlayStateChange?.(false);
            try {
              player.seekTo(0);
            } catch (_) {}
          }
        });

        player.play();
        setIsPlaying(true);
        onPlayStateChange?.(true);
      } else {
        const player = playerRef.current;
        if (player.playing) {
          player.pause();
          setIsPlaying(false);
          onPlayStateChange?.(false);
        } else {
          player.play();
          setIsPlaying(true);
          onPlayStateChange?.(true);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  useEffect(() => {
    return () => {
      releasePlayer();
    };
  }, []);

  const safeDuration = Math.max(duration || 0, 1);
  const progress = Math.min((currentTime || 0) / safeDuration, 1);
  const activeBars = Math.max(0, Math.round(progress * bars.length));
  const displayTime = isPlaying || currentTime > 0 ? currentTime : duration || 0;

  // Social DM: play · waveform · duration
  const iconColor = isCurrentUser ? '#000' : isDark ? '#ffc801' : '#111';
  const barActiveColor = isCurrentUser ? 'rgba(0,0,0,0.88)' : isDark ? '#ffffff' : 'rgba(0,0,0,0.75)';
  const barIdleColor = isCurrentUser ? 'rgba(0,0,0,0.28)' : isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)';
  const timeColor = isCurrentUser ? 'text-black/65' : isDark ? 'text-white/70' : 'text-black/55';

  return (
    <Pressable onPress={togglePlayback} className="flex-row items-center gap-2.5 min-w-[220px] py-0.5">
      <View className="w-9 h-9 items-center justify-center">
        {isPlaying ? (
          <Ionicons name="pause" size={26} color={iconColor} />
        ) : (
          <Ionicons name="play" size={26} color={iconColor} style={{ marginLeft: 2 }} />
        )}
      </View>

      <View className="flex-1 flex-row items-center gap-[2.5px] h-8">
        {bars.map((h, index) => {
          const active = !isPlaying || index < activeBars;
          return (
            <View
              key={index}
              style={{
                width: 2.5,
                height: h,
                borderRadius: 999,
                backgroundColor: active ? barActiveColor : barIdleColor,
              }}
            />
          );
        })}
      </View>

      <Text className={`text-[12px] font-semibold tabular-nums w-9 text-right ${timeColor}`}>
        {formatTime(displayTime)}
      </Text>
    </Pressable>
  );
}
