import { Platform, Vibration } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

/**
 * Looping incoming-call ringtone for Android (CallKit owns iOS ringing).
 * Idempotent start/stop so CallKeep + the incoming screen share one player.
 */

let player = null;
let starting = false;
let vibrateTimer = null;

export async function startIncomingRinger() {
  if (Platform.OS === 'ios') return;
  if (player || starting) return;
  starting = true;

  try {
    Vibration.vibrate([0, 1000, 500, 1000, 1500], true);
  } catch (_) {}

  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
    const asset = require('../assets/sounds/ringtone.wav');
    const next = createAudioPlayer(asset);
    next.loop = true;
    next.volume = 1;
    next.play();
    if (!starting) {
      try { next.pause(); } catch (_) {}
      try { next.release(); } catch (_) {}
      return;
    }
    player = next;
  } catch (e) {
    if (__DEV__) console.warn('[incomingRinger] play failed', e?.message);
  } finally {
    starting = false;
  }
}

export function stopIncomingRinger() {
  starting = false;
  try { Vibration.cancel(); } catch (_) {}
  if (vibrateTimer) {
    clearInterval(vibrateTimer);
    vibrateTimer = null;
  }
  const current = player;
  player = null;
  if (!current) return;
  try { current.pause(); } catch (_) {}
  try { current.release(); } catch (_) {}
}
