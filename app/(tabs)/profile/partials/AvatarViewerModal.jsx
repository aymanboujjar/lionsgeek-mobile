import { View, Image, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AvatarViewerModal({ visible, onClose, profileImageUrl, insets }) {
  return (
<Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => onClose()}
      >
        <View className="flex-1 bg-black">
          <View
            className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-4"
            style={{ paddingTop: insets.top + 10, zIndex: 5 }}
          >
            <TouchableOpacity
              onPress={() => onClose()}
              hitSlop={12}
              activeOpacity={0.75}
              className="w-10 h-10 rounded-full items-center justify-center bg-white/10"
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <Pressable className="flex-1 items-center justify-center" onPress={() => onClose()}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={{ width: '92%', aspectRatio: 1, borderRadius: 18 }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-72 h-72 rounded-2xl bg-white/10 items-center justify-center">
                <Ionicons name="person" size={64} color="rgba(255,255,255,0.6)" />
              </View>
            )}
          </Pressable>
        </View>
      </Modal>
  );
}
