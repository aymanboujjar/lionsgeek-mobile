import { useState } from 'react';
import { View, Text, Pressable, TextInput, Linking } from 'react-native';

/**
 * Interactive story stickers (poll, question, quiz, slider, countdown, link).
 * Server-side results live on story.interactions; this only renders + submits.
 */
export default function InteractiveOverlay({
  overlay,
  containerSize,
  interaction,
  isMine,
  disabled,
  onSubmit,
}) {
  if (!overlay || !containerSize) return null;
  const cx = (overlay.x ?? 0.5) * containerSize.width;
  const cy = (overlay.y ?? 0.5) * containerSize.height;
  const mine = interaction?.my_response;

  return (
    <View
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        transform: [{ translateX: -110 }, { translateY: -40 }],
        width: 220,
      }}
    >
      {overlay.type === 'poll' || overlay.type === 'quiz' ? (
        <ChoiceSticker
          title={overlay.question}
          options={overlay.options || []}
          mine={mine}
          counts={interaction?.counts}
          isMine={isMine}
          disabled={disabled}
          quizResult={overlay.type === 'quiz' ? interaction?.is_correct : null}
          onPick={(index) => onSubmit?.({ index })}
        />
      ) : null}
      {overlay.type === 'question' ? (
        <QuestionSticker
          prompt={overlay.prompt}
          mine={mine}
          isMine={isMine}
          disabled={disabled}
          onSubmit={(text) => onSubmit?.({ text })}
        />
      ) : null}
      {overlay.type === 'slider' ? (
        <SliderSticker
          prompt={overlay.prompt}
          emoji={overlay.emoji || '🔥'}
          mine={mine}
          isMine={isMine}
          disabled={disabled}
          onSubmit={(value) => onSubmit?.({ value })}
        />
      ) : null}
      {overlay.type === 'countdown' ? (
        <CountdownSticker title={overlay.title} endsAt={overlay.ends_at} />
      ) : null}
      {overlay.type === 'link' ? (
        <LinkSticker
          label={overlay.label}
          url={overlay.url}
          disabled={disabled}
          onOpen={() => onSubmit?.({ opened: true })}
        />
      ) : null}
    </View>
  );
}

function Card({ children }) {
  return (
    <View style={{ backgroundColor: 'rgba(0,0,0,0.62)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,200,1,0.45)' }}>
      {children}
    </View>
  );
}

function ChoiceSticker({ title, options, mine, counts, isMine, disabled, quizResult, onPick }) {
  return (
    <Card>
      <Text style={{ color: '#fff', fontWeight: '800', marginBottom: 8 }}>{title}</Text>
      {options.map((opt, i) => {
        const picked = mine && Number(mine.index) === i;
        return (
          <Pressable
            key={`${opt}-${i}`}
            disabled={disabled || !!mine || isMine}
            onPress={() => onPick(i)}
            style={{
              marginTop: 6,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 10,
              backgroundColor: picked ? '#ffc801' : 'rgba(255,255,255,0.12)',
            }}
          >
            <Text style={{ color: picked ? '#000' : '#fff', fontWeight: '700' }}>
              {opt}{isMine && counts?.[i] != null ? ` · ${counts[i]}` : ''}
            </Text>
          </Pressable>
        );
      })}
      {quizResult === true ? <Text style={{ color: '#86efac', marginTop: 8, fontWeight: '700' }}>Correct</Text> : null}
      {quizResult === false ? <Text style={{ color: '#fca5a5', marginTop: 8, fontWeight: '700' }}>Not this time</Text> : null}
    </Card>
  );
}

function QuestionSticker({ prompt, mine, isMine, disabled, onSubmit }) {
  const [text, setText] = useState('');
  return (
    <Card>
      <Text style={{ color: '#fff', fontWeight: '800', marginBottom: 8 }}>{prompt}</Text>
      {mine || isMine ? (
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{mine?.text || 'Answers are only visible to the owner.'}</Text>
      ) : (
        <>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Your answer"
            placeholderTextColor="rgba(255,255,255,0.45)"
            editable={!disabled}
            style={{ color: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)', paddingVertical: 6 }}
          />
          <Pressable
            onPress={() => text.trim() && onSubmit(text.trim())}
            style={{ marginTop: 8, alignSelf: 'flex-end', backgroundColor: '#ffc801', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: '#000', fontWeight: '800' }}>Send</Text>
          </Pressable>
        </>
      )}
    </Card>
  );
}

function SliderSticker({ prompt, emoji, mine, isMine, disabled, onSubmit }) {
  const value = mine?.value ?? 50;
  return (
    <Card>
      <Text style={{ color: '#fff', fontWeight: '800' }}>{emoji} {prompt}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        {[0, 25, 50, 75, 100].map((v) => (
          <Pressable
            key={v}
            disabled={disabled || !!mine || isMine}
            onPress={() => onSubmit(v)}
            style={{
              width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
              backgroundColor: value === v && mine ? '#ffc801' : 'rgba(255,255,255,0.15)',
            }}
          >
            <Text style={{ color: value === v && mine ? '#000' : '#fff', fontSize: 11, fontWeight: '800' }}>{v}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function CountdownSticker({ title, endsAt }) {
  const end = endsAt ? new Date(endsAt).getTime() : 0;
  const diff = Math.max(0, end - Date.now());
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return (
    <Card>
      <Text style={{ color: '#ffc801', fontWeight: '800' }}>{title}</Text>
      <Text style={{ color: '#fff', marginTop: 6, fontWeight: '700' }}>
        {diff <= 0 ? 'Ended' : `${hrs}h ${mins}m left`}
      </Text>
    </Card>
  );
}

function LinkSticker({ label, url, disabled, onOpen }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={async () => {
        if (!url || !/^https:\/\//i.test(url)) return;
        onOpen?.();
        try { await Linking.openURL(url); } catch (_) {}
      }}
    >
      <Card>
        <Text style={{ color: '#ffc801', fontWeight: '800' }}>{label || 'Open link'}</Text>
        <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4, fontSize: 11 }}>{url}</Text>
      </Card>
    </Pressable>
  );
}
