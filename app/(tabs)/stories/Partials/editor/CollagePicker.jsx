import { View, Text, Pressable, Image, ScrollView } from 'react-native';

const TEMPLATES = [
  { id: '2v', n: 2, label: 'Top / bottom' },
  { id: '2h', n: 2, label: 'Side by side' },
  { id: '3', n: 3, label: 'Three' },
  { id: '4', n: 4, label: 'Grid' },
];

export function layoutCells(template) {
  if (template === '2h') {
    return [
      { x: 0.25, y: 0.5, w: 0.5, h: 1 },
      { x: 0.75, y: 0.5, w: 0.5, h: 1 },
    ];
  }
  if (template === '3') {
    return [
      { x: 0.5, y: 0.25, w: 1, h: 0.5 },
      { x: 0.25, y: 0.75, w: 0.5, h: 0.5 },
      { x: 0.75, y: 0.75, w: 0.5, h: 0.5 },
    ];
  }
  if (template === '4') {
    return [
      { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
      { x: 0.75, y: 0.25, w: 0.5, h: 0.5 },
      { x: 0.25, y: 0.75, w: 0.5, h: 0.5 },
      { x: 0.75, y: 0.75, w: 0.5, h: 0.5 },
    ];
  }
  return [
    { x: 0.5, y: 0.25, w: 1, h: 0.5 },
    { x: 0.5, y: 0.75, w: 1, h: 0.5 },
  ];
}

export default function CollagePicker({ assets = [], onCancel, onConfirm }) {
  const count = Math.min(4, Math.max(2, assets.length));
  const options = TEMPLATES.filter((t) => t.n === count);
  const defaultId = options[0]?.id || '2v';

  return (
    <View style={{ flex: 1, backgroundColor: '#050508', paddingTop: 72, paddingHorizontal: 20 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>Layout</Text>
      <Text style={{ color: 'rgba(255,255,255,0.55)', marginTop: 8, marginBottom: 18 }}>
        Choose a collage for {count} photos.
      </Text>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 28 }}>
        {options.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onConfirm?.({ template: t.id, assets: assets.slice(0, t.n) })}
            style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,200,1,0.35)' }}
          >
            <Text style={{ color: '#ffc801', fontWeight: '800', marginBottom: 10 }}>{t.label}</Text>
            <View style={{ height: 160, flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden', borderRadius: 10, backgroundColor: '#111' }}>
              {assets.slice(0, t.n).map((a, i) => (
                <Image
                  key={`${a.uri}-${i}`}
                  source={{ uri: a.uri }}
                  style={{
                    width: t.id === '2h' || t.id === '4' || (t.id === '3' && i > 0) ? '50%' : '100%',
                    height: t.id === '2h' ? '100%' : '50%',
                  }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable onPress={onCancel} style={{ paddingVertical: 16, alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>Cancel</Text>
      </Pressable>
    </View>
  );
}
