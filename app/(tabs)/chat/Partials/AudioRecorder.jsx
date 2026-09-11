import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Instagram-style voice recording chrome:
 * - Full-width accent pill (stop · dots · duration)
 * - Controls row: trash · pause · send
 */
export default function AudioRecorder({
  onSend,
  onCancel,
  isRecording,
  recordingTime = 0,
  isPaused = false,
  onPause,
  onResume,
  canSend = true,
  sending = false,
}) {
  const isDark = useColorScheme() === 'dark';
  const [waveTick, setWaveTick] = useState(0);
  const dots = useMemo(() => Array.from({ length: 36 }, (_, i) => i), []);
  const controlIcon = isDark ? '#fff' : '#111';

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const id = setInterval(() => setWaveTick((t) => t + 1), 160);
    return () => clearInterval(id);
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeDots = isPaused
    ? Math.floor(dots.length * 0.35)
    : Math.min(dots.length, 4 + ((recordingTime * 3 + waveTick) % (dots.length - 4)));

  return (
    <View className="w-full">
      <View className="w-full rounded-full bg-alpha px-4 py-3.5 flex-row items-center gap-3">
        <Pressable
          onPress={isPaused ? onResume : onPause}
          hitSlop={8}
          className="w-7 h-7 items-center justify-center"
        >
          {isPaused ? (
            <Ionicons name="play" size={18} color="#000" style={{ marginLeft: 2 }} />
          ) : (
            <View className="w-3.5 h-3.5 rounded-[3px] bg-black" />
          )}
        </Pressable>

        <View className="flex-1 flex-row items-center justify-between px-1">
          {dots.map((dot) => {
            const lit = dot < activeDots;
            return (
              <View
                key={dot}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: lit ? '#000' : 'rgba(0,0,0,0.22)',
                }}
              />
            );
          })}
        </View>

        <Text className="text-[15px] font-semibold text-black tabular-nums min-w-[36px] text-right">
          {formatTime(recordingTime)}
        </Text>
      </View>

      <View className="mt-3 flex-row items-center justify-between px-1">
        <Pressable onPress={onCancel} hitSlop={10} className="w-11 h-11 items-center justify-center">
          <Ionicons name="trash-outline" size={24} color={controlIcon} />
        </Pressable>

        <Pressable
          onPress={isPaused ? onResume : onPause}
          hitSlop={8}
          className={`w-12 h-12 rounded-full items-center justify-center border ${
            isDark ? 'bg-white/10 border-white/15' : 'bg-black/5 border-black/10'
          }`}
        >
          <Ionicons
            name={isPaused ? 'play' : 'pause'}
            size={22}
            color={controlIcon}
            style={isPaused ? { marginLeft: 2 } : undefined}
          />
        </Pressable>

        <Pressable
          onPress={onSend}
          disabled={!canSend || sending}
          className={`w-14 h-14 rounded-full items-center justify-center ${
            !canSend || sending ? 'bg-[#3897f0]/50' : 'bg-[#3897f0]'
          }`}
        >
          <Ionicons name="paper-plane" size={22} color="#fff" style={{ marginLeft: 2, marginTop: 1 }} />
        </Pressable>
      </View>
    </View>
  );
}
