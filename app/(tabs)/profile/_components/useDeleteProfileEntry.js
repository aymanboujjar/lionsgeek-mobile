import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import API from '@/api';

const KINDS = {
  experience: {
    title: 'Delete Experience',
    message: 'Are you sure you want to remove this experience?',
    noun: 'experience',
    endpoint: (id) => `mobile/profile/experiences/${id}`,
  },
  education: {
    title: 'Delete Education',
    message: 'Are you sure you want to remove this education entry?',
    noun: 'education',
    endpoint: (id) => `mobile/profile/education/${id}`,
  },
};

/**
 * Shared "confirm, then delete" flow for resume entries (experience / education).
 * Used by the cards (quick delete) and by the edit modals.
 *
 * @param {{ kind: 'experience' | 'education', token: string, onDeleted?: (id: number|string) => void }} options
 * @returns {{ deleting: boolean, deletingId: number|string|null, confirmDelete: (entry: { id: number|string }) => void }}
 */
export default function useDeleteProfileEntry({ kind, token, onDeleted }) {
  const config = KINDS[kind];
  const [deletingId, setDeletingId] = useState(null);
  const busy = useRef(false);

  const confirmDelete = useCallback(
    (entry) => {
      if (!config || entry?.id == null || busy.current) return;

      Alert.alert(config.title, config.message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (busy.current) return;
            busy.current = true;
            setDeletingId(entry.id);
            try {
              await API.remove(config.endpoint(entry.id), token);
              onDeleted?.(entry.id);
            } catch (err) {
              const status = err?.response?.status;
              if (status === 403) {
                Alert.alert('Not allowed', `You can only delete your own ${config.noun}.`);
              } else if (status === 404) {
                Alert.alert('Not found', `This ${config.noun} entry no longer exists.`);
              } else {
                Alert.alert('Error', `Could not delete ${config.noun}. Please try again.`);
              }
            } finally {
              busy.current = false;
              setDeletingId(null);
            }
          },
        },
      ]);
    },
    [config, token, onDeleted],
  );

  return { deleting: deletingId != null, deletingId, confirmDelete };
}
