import { useEffect, useRef } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';

/**
 * Full-bleed story / highlight video using expo-video.
 * Exposes pause/play on `playerRef` so gesture handlers can control playback.
 */
export default function StoryVideo({
  uri,
  style,
  muted = false,
  shouldPlay = true,
  isLooping = false,
  onReady,
  onEnd,
  playerRef: externalPlayerRef,
}) {
  const internalRef = useRef(null);
  const player = useVideoPlayer(uri || null, (p) => {
    p.loop = isLooping;
    p.muted = muted;
    if (shouldPlay && uri) p.play();
  });

  useEffect(() => {
    internalRef.current = player;
    if (externalPlayerRef) externalPlayerRef.current = player;
    return () => {
      if (externalPlayerRef?.current === player) {
        externalPlayerRef.current = null;
      }
    };
  }, [player, externalPlayerRef]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    player.loop = isLooping;
  }, [isLooping, player]);

  useEffect(() => {
    if (!uri) return;
    let cancelled = false;
    (async () => {
      try {
        await player.replaceAsync(uri);
        if (cancelled) return;
        player.loop = isLooping;
        player.muted = muted;
        if (shouldPlay) player.play();
        else player.pause();
      } catch (_) {
        onReady?.();
      }
    })();
    return () => { cancelled = true; };
  }, [uri]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!uri) return;
    if (shouldPlay) player.play();
    else player.pause();
  }, [shouldPlay, player, uri]);

  useEffect(() => {
    const endSub = player.addListener('playToEnd', () => {
      onEnd?.();
    });
    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' || error) onReady?.();
    });
    return () => {
      endSub.remove();
      statusSub.remove();
    };
  }, [player, onEnd, onReady]);

  if (!uri) return null;

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
      onFirstFrameRender={() => onReady?.()}
    />
  );
}
