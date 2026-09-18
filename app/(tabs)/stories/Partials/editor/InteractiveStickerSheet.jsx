import { useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, ScrollView, Platform } from 'react-native';

const TYPES = [
  { id: 'poll', label: 'Poll' },
  { id: 'question', label: 'Question' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'slider', label: 'Slider' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'link', label: 'Link' },
  { id: 'hashtag', label: 'Hashtag' },
  { id: 'location', label: 'Place' },
];

const LG_PLACES = ['LionsGeek Ain Sebaa', 'LionsGeek Casablanca', 'Studio', 'Campus'];

export default function InteractiveStickerSheet({ visible, onClose, onPick }) {
  const [type, setType] = useState('poll');
  const [question, setQuestion] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correct, setCorrect] = useState(0);
  const [emoji, setEmoji] = useState('🔥');
  const [url, setUrl] = useState('https://');
  const [label, setLabel] = useState('');
  const [hours, setHours] = useState('24');

  const reset = () => {
    setQuestion(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setCorrect(0); setEmoji('🔥'); setUrl('https://'); setLabel(''); setHours('24');
  };

  const submit = () => {
    const id = `ix_${Date.now().toString(36)}`;
    const base = { id, type, x: 0.5, y: 0.62, scale: 1, rotation: 0 };
    if (type === 'poll' || type === 'quiz') {
      const options = [optA, optB, optC, optD].map((s) => s.trim()).filter(Boolean);
      if (!question.trim() || options.length < 2) return;
      onPick({ ...base, question: question.trim(), options, ...(type === 'quiz' ? { correct_index: Math.min(correct, options.length - 1) } : {}) });
    } else if (type === 'question' || type === 'slider') {
      if (!question.trim()) return;
      onPick({ ...base, prompt: question.trim(), ...(type === 'slider' ? { emoji } : {}) });
    } else if (type === 'countdown') {
      if (!question.trim()) return;
      const ends = new Date(Date.now() + Math.max(1, Number(hours) || 24) * 3600000);
      onPick({ ...base, title: question.trim(), ends_at: ends.toISOString() });
    } else if (type === 'link') {
      if (!/^https:\/\//i.test(url.trim())) return;
      onPick({ ...base, url: url.trim(), label: (label || 'Open link').trim() });
    } else if (type === 'hashtag') {
      const tag = question.replace(/^#/, '').replace(/[^\w]/g, '').slice(0, 32);
      if (tag.length < 2) return;
      onPick({ ...base, type: 'hashtag', tag, y: 0.78 });
    } else if (type === 'location') {
      const place = (question.trim() || label.trim());
      if (!place) return;
      onPick({ ...base, type: 'location', label: place.slice(0, 80), y: 0.82 });
    }
    reset();
    onClose?.();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#171717', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16, maxHeight: '80%' }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 12 }}>Add sticker</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
          {TYPES.map((t) => (
            <Pressable key={t.id} onPress={() => setType(t.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: type === t.id ? '#ffc801' : 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: type === t.id ? '#000' : '#fff', fontWeight: '700' }}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {(type === 'poll' || type === 'quiz' || type === 'question' || type === 'slider' || type === 'countdown') ? (
          <TextInput value={question} onChangeText={setQuestion} placeholder={type === 'countdown' ? 'Title' : 'Question'} placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
        ) : null}
        {(type === 'poll' || type === 'quiz') ? (
          <>
            <TextInput value={optA} onChangeText={setOptA} placeholder="Option A" placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
            <TextInput value={optB} onChangeText={setOptB} placeholder="Option B" placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
            <TextInput value={optC} onChangeText={setOptC} placeholder="Option C (optional)" placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
            <TextInput value={optD} onChangeText={setOptD} placeholder="Option D (optional)" placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
          </>
        ) : null}
        {type === 'quiz' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {['A', 'B', 'C', 'D'].map((letter, i) => (
              <Pressable key={letter} onPress={() => setCorrect(i)} style={[chip, correct === i && chipOn]}>
                <Text style={correct === i ? chipOnText : chipText}>{letter} is correct</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {type === 'slider' ? (
          <TextInput value={emoji} onChangeText={setEmoji} placeholder="Emoji" placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
        ) : null}
        {type === 'countdown' ? (
          <TextInput value={hours} onChangeText={setHours} keyboardType="number-pad" placeholder="Hours from now" placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
        ) : null}
        {type === 'link' ? (
          <>
            <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" placeholder="https://" placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
            <TextInput value={label} onChangeText={setLabel} placeholder="Button label" placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
          </>
        ) : null}
        {type === 'hashtag' ? (
          <TextInput value={question} onChangeText={setQuestion} placeholder="#topic" placeholderTextColor="rgba(255,255,255,0.4)" autoCapitalize="none" style={inputStyle} />
        ) : null}
        {type === 'location' ? (
          <>
            <TextInput value={question} onChangeText={setQuestion} placeholder="Place name" placeholderTextColor="rgba(255,255,255,0.4)" style={inputStyle} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 10 }}>
              {LG_PLACES.map((p) => (
                <Pressable key={p} onPress={() => setQuestion(p)} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,200,1,0.15)' }}>
                  <Text style={{ color: '#ffc801', fontWeight: '700', fontSize: 12 }}>{p}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}
        <Pressable onPress={submit} style={{ marginTop: 8, backgroundColor: '#ffc801', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#000', fontWeight: '800' }}>Add to story</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const inputStyle = {
  color: '#fff',
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 12,
  marginBottom: 8,
};
const chip = { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' };
const chipOn = { backgroundColor: '#ffc801' };
const chipText = { color: '#fff', fontWeight: '700' };
const chipOnText = { color: '#000', fontWeight: '700' };
