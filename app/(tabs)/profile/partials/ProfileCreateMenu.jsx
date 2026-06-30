import { View, Text, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileCreateMenu({ visible, onClose, onAction, insets, isDark }) {
  return (
<Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          onPress={onClose}
          className="flex-1 bg-black/35 justify-end"
        >
          <Pressable
            onPress={() => {}}
            className="bg-light dark:bg-dark rounded-t-3xl px-4 pt-4 pb-6 border-t border-black/10 dark:border-white/10"
            style={{ paddingBottom: insets.bottom + 18 }}
          >
            <View className="items-center mb-3">
              <View className="w-10 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
            </View>

            <Text className="text-base font-bold text-black dark:text-white mb-3">
              Create
            </Text>

            <Pressable
              onPress={() => onAction('post')}
              className="flex-row items-center gap-3 px-3 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04]"
            >
              <View className="w-9 h-9 rounded-xl bg-alpha/15 items-center justify-center">
                <Ionicons name="create-outline" size={18} color="#ffc801" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-black dark:text-white">Create Post</Text>
                <Text className="text-xs text-black/45 dark:text-white/45 mt-0.5">Share something with your network</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'} />
            </Pressable>

            <Pressable
              onPress={() => onAction('education')}
              className="flex-row items-center gap-3 px-3 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] mt-2"
            >
              <View className="w-9 h-9 rounded-xl bg-alpha/15 items-center justify-center">
                <Ionicons name="school-outline" size={18} color="#ffc801" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-black dark:text-white">Create Education</Text>
                <Text className="text-xs text-black/45 dark:text-white/45 mt-0.5">Add a school or certification</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'} />
            </Pressable>

            <Pressable
              onPress={() => onAction('experience')}
              className="flex-row items-center gap-3 px-3 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] mt-2"
            >
              <View className="w-9 h-9 rounded-xl bg-alpha/15 items-center justify-center">
                <Ionicons name="briefcase-outline" size={18} color="#ffc801" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-black dark:text-white">Create Experience</Text>
                <Text className="text-xs text-black/45 dark:text-white/45 mt-0.5">Add a role to your resume</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'} />
            </Pressable>

            <Pressable onPress={onClose} className="items-center py-3 mt-2">
              <Text className="text-sm font-semibold text-black/60 dark:text-white/60">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
  );
}
