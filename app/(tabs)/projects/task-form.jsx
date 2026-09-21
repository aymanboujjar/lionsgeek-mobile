import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppLayout from '@/components/layout/AppLayout';
import API from '@/api';
import { Colors } from '@/constants/Colors';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['todo', 'in_progress', 'review', 'completed'];

export default function TaskFormScreen() {
  const params = useLocalSearchParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;
  const isEdit = !!taskId;

  const { token } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [title, setTitle] = useState(typeof params.title === 'string' ? params.title : '');
  const [description, setDescription] = useState(
    typeof params.description === 'string' ? params.description : ''
  );
  const [priority, setPriority] = useState(
    typeof params.priority === 'string' ? params.priority : 'medium'
  );
  const [status, setStatus] = useState(typeof params.status === 'string' ? params.status : 'todo');
  const [assignedTo, setAssignedTo] = useState(
    typeof params.assignedTo === 'string' ? params.assignedTo : ''
  );
  const [dueDate, setDueDate] = useState(typeof params.dueDate === 'string' ? params.dueDate : '');
  const [team, setTeam] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [saving, setSaving] = useState(false);

  const text = isDark ? '#fff' : '#111';
  const muted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.48)';
  const hairline = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const fieldBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';

  useEffect(() => {
    if (!token || !projectId) return;
    (async () => {
      try {
        const data = await API.getProject(projectId, token);
        setTeam(Array.isArray(data?.team) ? data.team : []);
        setCanManage(!!data?.project?.can_manage_tasks);
      } catch (_) {}
    })();
  }, [token, projectId]);

  const screenTitle = useMemo(() => (isEdit ? 'Edit task' : 'New task'), [isEdit]);

  const save = async () => {
    if (!token || !projectId) return;
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Missing title', 'Give the task a title.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: trimmed,
        description: description.trim() || null,
        priority,
        status,
        assigned_to: assignedTo ? Number(assignedTo) : null,
        due_date: dueDate.trim() || null,
      };
      if (isEdit) {
        await API.updateProjectTask(projectId, taskId, payload, token);
      } else {
        await API.createProjectTask(projectId, payload, token);
      }
      router.replace({ pathname: '/(tabs)/projects/[id]', params: { id: String(projectId) } });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Could not save task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout showNavbar={false}>
      <View className="flex-1 bg-light dark:bg-dark">
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
          <Text style={{ flex: 1, color: text, fontSize: 18, fontWeight: '800' }}>{screenTitle}</Text>
          <Pressable
            onPress={save}
            disabled={saving}
            style={{
              backgroundColor: Colors.alpha,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#111" />
            ) : (
              <Text style={{ color: '#111', fontWeight: '800', fontSize: 13 }}>Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor={muted}
            style={{
              borderWidth: 1,
              borderColor: hairline,
              backgroundColor: fieldBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === 'ios' ? 12 : 10,
              color: text,
              fontWeight: '600',
              marginBottom: 14,
            }}
          />

          <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
            DESCRIPTION
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Details…"
            placeholderTextColor={muted}
            multiline
            style={{
              borderWidth: 1,
              borderColor: hairline,
              backgroundColor: fieldBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: text,
              minHeight: 100,
              textAlignVertical: 'top',
              marginBottom: 14,
            }}
          />

          <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>PRIORITY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {PRIORITIES.map((p) => {
              const on = priority === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: on ? Colors.alpha : fieldBg,
                    borderWidth: 1,
                    borderColor: on ? Colors.alpha : hairline,
                  }}
                >
                  <Text style={{ color: on ? '#111' : text, fontWeight: '800', fontSize: 12 }}>
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>STATUS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {STATUSES.map((s) => {
              const on = status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: on ? Colors.alpha : fieldBg,
                    borderWidth: 1,
                    borderColor: on ? Colors.alpha : hairline,
                  }}
                >
                  <Text style={{ color: on ? '#111' : text, fontWeight: '800', fontSize: 12 }}>
                    {s.replace('_', ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
            DUE DATE (YYYY-MM-DD)
          </Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-09-30"
            placeholderTextColor={muted}
            style={{
              borderWidth: 1,
              borderColor: hairline,
              backgroundColor: fieldBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === 'ios' ? 12 : 10,
              color: text,
              marginBottom: 14,
            }}
          />

          {canManage ? (
            <>
              <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                ASSIGN TO
              </Text>
              <Pressable
                onPress={() => setAssignedTo('')}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: !assignedTo ? Colors.alpha : hairline,
                  backgroundColor: fieldBg,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: text, fontWeight: '600' }}>Unassigned</Text>
              </Pressable>
              {team.map((m) => {
                const on = String(assignedTo) === String(m.id);
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setAssignedTo(String(m.id))}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: on ? Colors.alpha : hairline,
                      backgroundColor: fieldBg,
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons
                      name={on ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={on ? Colors.alpha : muted}
                    />
                    <Text style={{ color: text, fontWeight: '600' }}>{m.name}</Text>
                  </Pressable>
                );
              })}
            </>
          ) : null}
        </ScrollView>
      </View>
    </AppLayout>
  );
}
