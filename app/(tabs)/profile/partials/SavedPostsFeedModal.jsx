import { View, Text, Modal, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FeedItem from '../../_feed/Partials/FeedItem';

export default function SavedPostsFeedModal({
  visible,
  onClose,
  posts,
  selectedIndex,
  insets,
  isDark,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-light dark:bg-dark">
        <View
          className="flex-row items-center px-4 bg-light dark:bg-dark border-b border-black/10 dark:border-white/10"
          style={{ paddingTop: insets.top + 10, paddingBottom: 10 }}
        >
          <TouchableOpacity onPress={onClose} hitSlop={12} activeOpacity={0.7}>
            <Ionicons name="chevron-down" size={26} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text className="ml-3 text-base font-bold text-black dark:text-white">Saved Posts</Text>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <FeedItem item={item} />}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={selectedIndex >= 0 ? selectedIndex : 0}
          getItemLayout={(_, index) => ({
            length: 520,
            offset: 520 * index,
            index,
          })}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        />
      </View>
    </Modal>
  );
}
