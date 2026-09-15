import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

/**
 * Pan / pinch / rotate a 9:16 media layer. Transform is stored in parent state.
 */
export default function MediaTransformLayer({
  enabled = true,
  transform = { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
  onChange,
  children,
}) {
  const x = useSharedValue(transform.x ?? 0.5);
  const y = useSharedValue(transform.y ?? 0.5);
  const scale = useSharedValue(transform.scale ?? 1);
  const rotation = useSharedValue(transform.rotation ?? 0);
  const startX = useSharedValue(transform.x ?? 0.5);
  const startY = useSharedValue(transform.y ?? 0.5);
  const startScale = useSharedValue(transform.scale ?? 1);
  const startRot = useSharedValue(transform.rotation ?? 0);

  useEffect(() => {
    x.value = transform.x ?? 0.5;
    y.value = transform.y ?? 0.5;
    scale.value = transform.scale ?? 1;
    rotation.value = transform.rotation ?? 0;
  }, [transform.x, transform.y, transform.scale, transform.rotation]);

  const commit = (nx, ny, ns, nr) => {
    onChange?.({
      x: nx,
      y: ny,
      scale: ns,
      rotation: nr,
    });
  };

  const pan = Gesture.Pan()
    .enabled(enabled)
    .onBegin(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((e) => {
      x.value = startX.value + e.translationX / 400;
      y.value = startY.value + e.translationY / 700;
    })
    .onEnd(() => {
      runOnJS(commit)(x.value, y.value, scale.value, rotation.value);
    });

  const pinch = Gesture.Pinch()
    .enabled(enabled)
    .onBegin(() => { startScale.value = scale.value; })
    .onUpdate((e) => {
      scale.value = Math.max(0.6, Math.min(3.5, startScale.value * e.scale));
    })
    .onEnd(() => {
      runOnJS(commit)(x.value, y.value, scale.value, rotation.value);
    });

  const rotate = Gesture.Rotation()
    .enabled(enabled)
    .onBegin(() => { startRot.value = rotation.value; })
    .onUpdate((e) => {
      rotation.value = startRot.value + (e.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      runOnJS(commit)(x.value, y.value, scale.value, rotation.value);
    });

  const composed = Gesture.Simultaneous(pan, pinch, rotate);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (x.value - 0.5) * 400 },
      { translateY: (y.value - 0.5) * 700 },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return enabled ? (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ flex: 1, overflow: 'hidden' }, style]}>
        <View style={{ flex: 1 }}>{children}</View>
      </Animated.View>
    </GestureDetector>
  ) : (
    <View style={{ flex: 1, overflow: 'hidden' }}>{children}</View>
  );
}
