import { useState, useCallback } from 'react';
import { View } from 'react-native';
import TextOverlay from './overlays/TextOverlay';
import StickerOverlay from './overlays/StickerOverlay';
import DrawingOverlay from './overlays/DrawingOverlay';
import MentionOverlay from './overlays/MentionOverlay';
import MusicOverlay from './overlays/MusicOverlay';
import InteractiveOverlay from './overlays/InteractiveOverlay';

/**
 * Read-only overlay layer. Drops in on top of the story media in the viewer
 * and the highlight viewer. Measures its own bounds via onLayout so the
 * normalized coordinates of each overlay get scaled to the actual viewport.
 *
 * The wrapper is `pointerEvents="box-none"` so taps fall through to the
 * underlying tap zones (prev/next) UNLESS they hit a mention chip — those
 * absorb the tap so they can route to a profile.
 *
 * Props:
 *   overlays         – array from the API (see StoryController::mapStory)
 *   onMentionPress   – called with the mention overlay when a chip is tapped
 *   musicAnimated    – whether the music sticker's bouncing bars animate
 *                      (false while the story is paused)
 *   style            – optional extra style
 */
export default function OverlayRenderer({ overlays, onMentionPress, musicAnimated = true, interactions = [], isMine = false, onInteract, style }) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const list = Array.isArray(overlays) ? overlays : [];

  return (
    <View
      onLayout={onLayout}
      pointerEvents="box-none"
      style={[{ position: 'absolute', inset: 0 }, style]}
    >
      {size.width > 0 && size.height > 0 ? list.map((o) => {
        if (!o || typeof o !== 'object') return null;
        if (o.type === 'drawing') {
          return <DrawingOverlay key={o.id} overlay={o} containerSize={size} />;
        }
        if (o.type === 'filter') {
          return (
            <View
              key={o.id}
              pointerEvents="none"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: o.color || '#000',
                opacity: typeof o.opacity === 'number' ? o.opacity : 0.2,
              }}
            />
          );
        }
        if (o.type === 'text') {
          return <TextOverlay key={o.id} overlay={o} containerSize={size} />;
        }
        if (o.type === 'sticker') {
          return <StickerOverlay key={o.id} overlay={o} containerSize={size} />;
        }
        if (o.type === 'mention') {
          return (
            <MentionOverlay
              key={o.id}
              overlay={o}
              containerSize={size}
              onPress={onMentionPress ? () => onMentionPress(o) : undefined}
            />
          );
        }
        if (o.type === 'music') {
          return (
            <MusicOverlay
              key={o.id}
              overlay={o}
              containerSize={size}
              animated={musicAnimated}
            />
          );
        }
        if (o.type === 'layout' || o.type === 'boomerang' || o.type === 'gradient' || o.type === 'blur' || o.type === 'media_transform') {
          return null;
        }
        if (o.type === 'hashtag' || o.type === 'location') {
          return (
            <TextOverlay
              key={o.id}
              overlay={{
                ...o,
                type: 'text',
                text: o.type === 'hashtag' ? `#${o.tag || ''}` : (o.label || ''),
                has_bg: true,
                color: '#000000',
                bg_color: '#ffc801',
              }}
              containerSize={size}
            />
          );
        }
        if (['poll', 'question', 'quiz', 'slider', 'countdown', 'link'].includes(o.type)) {
          const interaction = (interactions || []).find((x) => x.overlay_id === o.id) || null;
          return (
            <InteractiveOverlay
              key={o.id}
              overlay={o}
              containerSize={size}
              interaction={interaction}
              isMine={isMine}
              onSubmit={(value) => onInteract?.(o.id, value)}
            />
          );
        }
        return null;
      }) : null}
    </View>
  );
}
