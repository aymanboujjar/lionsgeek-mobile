import { View, Image } from 'react-native';
import { layoutCells } from '../editor/CollagePicker';

export default function CollageOverlay({ overlay, containerSize }) {
  if (!overlay || !containerSize?.width) return null;
  const cells = Array.isArray(overlay.cells) ? overlay.cells : [];
  const slots = layoutCells(overlay.template);
  const { width, height } = containerSize;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height, backgroundColor: '#111' }}>
      {slots.map((slot, i) => {
        const uri = cells[i]?.image_url || cells[i]?.image_uri || cells[i]?.uri;
        if (!uri) return null;
        return (
          <Image
            key={`cell-${i}`}
            source={{ uri }}
            style={{
              position: 'absolute',
              left: (slot.x - slot.w / 2) * width,
              top: (slot.y - slot.h / 2) * height,
              width: slot.w * width,
              height: slot.h * height,
            }}
            resizeMode="cover"
          />
        );
      })}
    </View>
  );
}
