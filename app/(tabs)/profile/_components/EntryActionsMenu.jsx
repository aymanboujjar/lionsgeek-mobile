import { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Three-dot button that opens a bottom-sheet menu with Edit and Delete.
 * Shared by the resume cards (experience / education).
 *
 * Props:
 *  - isDark: bool
 *  - title: string (shown at the top of the menu, e.g. the entry name)
 *  - onEdit: () => void
 *  - onDelete: () => void  (should ask for confirmation itself)
 *  - deleting: bool
 */
export default function EntryActionsMenu({ isDark, title, onEdit, onDelete, deleting = false }) {
  const [open, setOpen] = useState(false);

  const iconColor = isDark ? '#ffffff' : '#000000';
  const divider = isDark ? '#2e2e2e' : '#e8e5e0';

  const run = (action) => {
    setOpen(false);
    // Let the sheet finish closing so an Alert opened by the action is not dropped (iOS).
    setTimeout(() => action?.(), 300);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        disabled={deleting}
        hitSlop={10}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="More actions"
        className="w-6 h-6 items-center justify-center"
      >
        {deleting ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Ionicons name="ellipsis-vertical" size={16} color={iconColor} />
        )}
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setOpen(false)}
        />
        <View
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 24,
            backgroundColor: isDark ? '#1c1c1c' : '#ffffff',
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: divider,
            overflow: 'hidden',
          }}
        >
          {title ? (
            <>
              <Text
                numberOfLines={1}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  fontSize: 12,
                  fontWeight: '700',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                }}
              >
                {title}
              </Text>
              <View style={{ height: 0.5, backgroundColor: divider }} />
            </>
          ) : null}

          <Pressable
            onPress={() => run(onEdit)}
            accessibilityRole="button"
            style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Ionicons name="pencil" size={18} color={iconColor} />
            <Text style={{ color: iconColor, fontWeight: '800' }}>Edit</Text>
          </Pressable>

          <View style={{ height: 0.5, backgroundColor: divider }} />

          <Pressable
            onPress={() => run(onDelete)}
            accessibilityRole="button"
            style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={iconColor} />
            <Text style={{ color: '#ef4444', fontWeight: '900' }}>Delete</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
