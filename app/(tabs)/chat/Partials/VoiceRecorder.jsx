import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import Skeleton from '@/components/ui/Skeleton';
import AudioRecorder from './AudioRecorder';

/**
 * Mic button + Instagram-style recording UI.
 * Tap mic to start; trash / pause / send control the take.
 */
export default function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  disabled,
  onStopRecordingRef,
  onSendAudioDirect,
  onRecordingChange,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [canSend, setCanSend] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    extension: '.m4a',
    android: {
      ...RecordingPresets.HIGH_QUALITY.android,
      extension: '.m4a',
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
    },
  });
  const recorderState = useAudioRecorderState(audioRecorder);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const notifyRecording = useCallback(
    (active) => {
      onRecordingChange?.(active);
    },
    [onRecordingChange]
  );

  const startRecording = async () => {
    try {
      setError(null);

      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        throw new Error('Microphone permission denied');
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setCanSend(false);
      notifyRecording(true);

      clearTimer();
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          if (next >= 1) setCanSend(true);
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to start recording');
      setIsRecording(false);
      notifyRecording(false);
    }
  };

  const pauseRecording = () => {
    try {
      if (typeof audioRecorder.pause === 'function') {
        audioRecorder.pause();
      }
    } catch (err) {
      console.warn('Pause recording failed:', err);
    }
    setIsPaused(true);
    clearTimer();
  };

  const resumeRecording = async () => {
    try {
      audioRecorder.record();
    } catch (err) {
      console.warn('Resume recording failed:', err);
    }
    setIsPaused(false);
    clearTimer();
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const next = prev + 1;
        if (next >= 1) setCanSend(true);
        return next;
      });
    }, 1000);
  };

  const stopRecordingAndSend = useCallback(async () => {
    if (!isRecording && !recorderState.isRecording) return;
    if (!canSend) return;

    clearTimer();

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      const duration = Math.round(audioRecorder.currentTime) || recordingTime;

      setIsRecording(false);
      setIsPaused(false);
      setCanSend(false);
      setRecordingTime(0);
      notifyRecording(false);

      if (uri) {
        const fileType = 'audio/mp4';
        if (onSendAudioDirect) {
          setIsUploading(true);
          try {
            await onSendAudioDirect(uri, duration, fileType);
          } catch (err) {
            console.error('Error sending audio:', err);
            setError('Failed to send audio: ' + err.message);
          } finally {
            setIsUploading(false);
          }
          return;
        }
        if (onRecordingComplete) {
          await onRecordingComplete(uri, duration, fileType);
        }
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Failed to process recording');
      setIsRecording(false);
      setIsPaused(false);
      notifyRecording(false);
    }
  }, [
    isRecording,
    canSend,
    recordingTime,
    onSendAudioDirect,
    onRecordingComplete,
    audioRecorder,
    recorderState.isRecording,
    notifyRecording,
  ]);

  const handleCancel = async () => {
    clearTimer();
    if (isRecording || recorderState.isRecording) {
      try {
        await audioRecorder.stop();
      } catch (err) {
        console.error('Error stopping recording:', err);
      }
    }
    setIsRecording(false);
    setIsPaused(false);
    setCanSend(false);
    setRecordingTime(0);
    setError(null);
    notifyRecording(false);
    onCancel?.();
  };

  useEffect(() => {
    return () => {
      clearTimer();
      try {
        if (audioRecorder?.isRecording) {
          audioRecorder.stop().catch(() => {});
        }
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (onStopRecordingRef) {
      onStopRecordingRef.current = {
        stopAndSend: stopRecordingAndSend,
        isRecording,
        canSend,
      };
    }
  }, [isRecording, canSend, stopRecordingAndSend, onStopRecordingRef]);

  if (isRecording) {
    return (
      <AudioRecorder
        isRecording={isRecording}
        recordingTime={recordingTime}
        isPaused={isPaused}
        onPause={pauseRecording}
        onResume={resumeRecording}
        onCancel={handleCancel}
        onSend={stopRecordingAndSend}
        canSend={canSend}
        sending={isUploading}
      />
    );
  }

  return (
    <Pressable
      onPress={startRecording}
      className={`h-10 w-10 items-center justify-center rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.04] dark:bg-white/[0.06] ${
        disabled ? 'opacity-50' : ''
      }`}
      disabled={disabled || isUploading}
    >
      {isUploading ? (
        <Skeleton width={16} height={16} borderRadius={8} isDark={false} />
      ) : (
        <Ionicons name="mic" size={20} color="#ffc801" />
      )}
    </Pressable>
  );
}
