import { useMemo, useState } from 'react';
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
import { userHasAnyRole } from '@/utils/roles';

const STATUSES = [
  { id: 'active', label: 'Active' },
  { id: 'on_hold', label: 'On hold' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const PREDEFINED = [
  { id: 'creation_du_site_web', label: 'Website creation' },
  { id: 'creation_de_contenue_reseaux_sociaux', label: 'Social content' },
  { id: 'shooting_images_videos', label: 'Shooting & media' },
];

export default function ProjectFormScreen() {
  const { id, name: pName, description: pDesc, status: pStatus } = useLocalSearchParams();
  const projectId = Array.isArray(id) ? id[0] : id;
  const isEdit = !!projectId;

  const { token, user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const canCreate = userHasAnyRole(user, ['admin', 'super_admin', 'moderateur', 'coach', 'pro']);

  const [name, setName] = useState(
    typeof pName === 'string' ? pName : Array.isArray(pName) ? pName[0] : ''
  );
  const [description, setDescription] = useState(
    typeof pDesc === 'string' ? pDesc : Array.isArray(pDesc) ? pDesc[0] : ''
  );
  const [status, setStatus] = useState(
    (typeof pStatus === 'string' ? pStatus : Array.isArray(pStatus) ? pStatus[0] : null) || 'active'
  );
  const [predefined, setPredefined] = useState([]);
  const [saving, setSaving] = useState(false);

  const text = isDark ? '#fff' : '#111';
  const muted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.48)';
  const hairline = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const fieldBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';

  const title = useMemo(() => (isEdit ? 'Edit project' : 'New project'), [isEdit]);

  const togglePredefined = (key) => {
    setPredefined((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const save = async () => {
    if (!token) return;
    if (!canCreate && !isEdit) {
      Alert.alert('Not allowed', 'Only staff can create projects.');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Missing name', 'Give your project a name.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await API.updateProject(
          projectId,
          { name: trimmed, description: description.trim() || null, status },
          token
        );
        router.replace({ pathname: '/(tabs)/projects/[id]', params: { id: String(projectId) } });
      } else {
        const data = await API.createProject(
          {
            name: trimmed,
            description: description.trim() || null,
            status,
            predefined_tasks: predefined,
          },
          token
        );
        const newId = data?.project?.id;
        if (newId) {
          router.replace({ pathname: '/(tabs)/projects/[id]', params: { id: String(newId) } });
        } else {
          router.replace('/(tabs)/projects');
        }
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Could not save project.');
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
          <Text style={{ flex: 1, color: text, fontSize: 18, fontWeight: '800' }}>{title}</Text>
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
          <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Project name"
            placeholderTextColor={muted}
            style={{
              borderWidth: 1,
              borderColor: hairline,
              backgroundColor: fieldBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === 'ios' ? 12 : 10,
              color: text,
              fontSize: 15,
              fontWeight: '600',
              marginBottom: 16,
            }}
          />

          <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
            DESCRIPTION
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What is this project about?"
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
              fontSize: 15,
              minHeight: 110,
              textAlignVertical: 'top',
              marginBottom: 16,
            }}
          />

          <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>STATUS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {STATUSES.map((s) => {
              const selected = status === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setStatus(s.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: selected ? Colors.alpha : isDark ? 'rgba(255,255,255,0.06)' : '#fff',
                    borderWidth: 1,
                    borderColor: selected ? Colors.alpha : hairline,
                  }}
                >
                  <Text style={{ color: selected ? '#111' : text, fontWeight: '800', fontSize: 12 }}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!isEdit ? (
            <>
              <Text style={{ color: muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                STARTER TASKS (OPTIONAL)
              </Text>
              {PREDEFINED.map((p) => {
                const on = predefined.includes(p.id);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => togglePredefined(p.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: on ? Colors.alpha : hairline,
                      backgroundColor: fieldBg,
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons
                      name={on ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={on ? Colors.alpha : muted}
                    />
                    <Text style={{ color: text, fontWeight: '600', fontSize: 14 }}>{p.label}</Text>
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
