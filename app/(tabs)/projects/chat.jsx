import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';
import API from '@/api';
import { Colors } from '@/constants/Colors';

function bubbleTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ProjectChatScreen() {
  const { id } = useLocalSearchParams();
  const projectId = Array.isArray(id) ? id[0] : id;
  const { token, user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const listRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);

  const text = isDark ? '#fff' : '#111';
  const muted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.48)';
  const hairline = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const load = useCallback(async () => {
    if (!token || !projectId) return;
    setError(null);
    try {
      const data = await API.getProjectMessages(projectId, token);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (e) {
      console.error('[PROJECT CHAT]', e);
      setError('Could not load chat.');
    } finally {
      setLoading(false);
    }
  }, [token, projectId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: false }), 50);
    }
  }, [loading, messages.length]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || !token || sending) return;
    setSending(true);
    setDraft('');
    try {
      const data = await API.sendProjectMessage(projectId, content, token);
      if (data?.message) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 40);
      } else {
        await load();
      }
    } catch (e) {
      setDraft(content);
      setError(e?.response?.data?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  }, [draft, token, sending, projectId, load]);

  const renderItem = ({ item }) => {
    const mine = Number(item?.user?.id) === Number(user?.id);
    return (
      <View
        style={{
          marginBottom: 10,
          alignItems: mine ? 'flex-end' : 'flex-start',
          paddingHorizontal: 14,
        }}
      >
        {!mine ? (
          <Text style={{ color: muted, fontSize: 11, fontWeight: '700', marginBottom: 4, marginLeft: 4 }}>
            {item?.user?.name || 'Member'}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '86%' }}>
          {!mine ? (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                overflow: 'hidden',
                backgroundColor: isDark ? '#2a2a2a' : '#ececec',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item?.user?.avatar ? (
                <Image source={{ uri: item.user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ color: text, fontSize: 11, fontWeight: '800' }}>
                  {(item?.user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          ) : null}
          <View
            style={{
              backgroundColor: mine ? Colors.alpha : isDark ? Colors.card_dark : '#fff',
              borderWidth: mine ? 0 : 1,
              borderColor: hairline,
              borderRadius: 16,
              borderBottomRightRadius: mine ? 4 : 16,
              borderBottomLeftRadius: mine ? 16 : 4,
              paddingHorizontal: 12,
              paddingVertical: 9,
            }}
          >
            {item.reply_to?.content ? (
              <View
                style={{
                  borderLeftWidth: 2,
                  borderLeftColor: mine ? '#111' : Colors.alpha,
                  paddingLeft: 8,
                  marginBottom: 6,
                  opacity: 0.8,
                }}
              >
                <Text style={{ color: mine ? '#111' : muted, fontSize: 11, fontWeight: '700' }} numberOfLines={2}>
                  {item.reply_to.content}
                </Text>
              </View>
            ) : null}
            <Text style={{ color: mine ? '#111' : text, fontSize: 14, lineHeight: 20, fontWeight: '500' }}>
              {item.content}
            </Text>
            <Text
              style={{
                color: mine ? 'rgba(0,0,0,0.45)' : muted,
                fontSize: 10,
                marginTop: 4,
                fontWeight: '600',
                alignSelf: 'flex-end',
              }}
            >
              {bubbleTime(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppLayout showNavbar={false}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: isDark ? Colors.dark : Colors.light }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: hairline,
            backgroundColor: isDark ? Colors.card_dark : '#fff',
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text, fontSize: 18, fontWeight: '800' }}>Project chat</Text>
            <Text style={{ color: muted, fontSize: 12, fontWeight: '600', marginTop: 1 }}>
              Team messages for this workspace
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={Colors.alpha} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 14, flexGrow: 1 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 28 }}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color={muted} />
                <Text style={{ color: muted, marginTop: 12, textAlign: 'center', fontWeight: '600' }}>
                  No messages yet. Say hi to the team.
                </Text>
              </View>
            }
            ListHeaderComponent={
              error ? (
                <Text style={{ color: '#dc2626', textAlign: 'center', marginBottom: 8, fontSize: 12 }}>
                  {error}
                </Text>
              ) : null
            }
          />
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: hairline,
            backgroundColor: isDark ? Colors.card_dark : '#fff',
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message…"
            placeholderTextColor={muted}
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 40,
              borderWidth: 1,
              borderColor: hairline,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === 'ios' ? 10 : 8,
              color: text,
              fontSize: 15,
              fontWeight: '500',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : Colors.light,
            }}
          />
          <Pressable
            onPress={send}
            disabled={sending || !draft.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: Colors.alpha,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sending || !draft.trim() ? 0.5 : 1,
            }}
          >
            {sending ? (
              <ActivityIndicator color="#111" />
            ) : (
              <Ionicons name="send" size={18} color="#111" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}
