import { View, Text, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AvatarOptionsModal({ visible, onClose, onView, onChange, avatarUploading, insets, isDark }) {
  return (
<Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => onClose()}
      >
        <Pressable
          onPress={() => onClose()}
          className="flex-1 bg-black/55 justify-end"
        >
          <Pressable
            onPress={() => { }}
            className="bg-light dark:bg-dark rounded-t-3xl px-4 pt-4 pb-6 border-t border-black/10 dark:border-white/10"
            style={{ paddingBottom: insets.bottom + 18 }}
          >
            <View className="items-center mb-3">
              <View className="w-10 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
            </View>

            <Text className="text-base font-bold text-black dark:text-white mb-3">
              Profile picture
            </Text>

            <Pressable onPress={onView} className="flex-row items-center gap-3 px-3 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04]">
              <Ionicons name="eye-outline" size={18} color={isDark ? '#fff' : '#000'} />
              <Text className="text-sm font-semibold text-black dark:text-white">
                View profile picture
              </Text>
            </Pressable>

            <Pressable
              onPress={onChange}
              disabled={avatarUploading}
              className="flex-row items-center gap-3 px-3 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] mt-2"
              style={{ opacity: avatarUploading ? 0.6 : 1 }}
            >
              <Ionicons name="image-outline" size={18} color="#ffc801" />
              <Text className="text-sm font-semibold text-black dark:text-white">
                Change profile picture
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onClose()}
              className="items-center py-3 mt-2"
            >
              <Text className="text-sm font-semibold text-black/60 dark:text-white/60">
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
  );
}
