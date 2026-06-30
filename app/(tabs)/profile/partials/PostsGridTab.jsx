import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '@/components/ui/Skeleton';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PostsGridTab({ posts, postsLoading, isDark, onPostPress, emptyLabel = 'No posts yet', emptyIcon = 'images-outline' }) {
  const TILE_SIZE = Math.floor(SCREEN_WIDTH / 3);
  const GAP = 1.5;

  if (postsLoading) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton
            key={i}
            width={TILE_SIZE - GAP * 0.67}
            height={TILE_SIZE}
            borderRadius={0}
            isDark={isDark}
          />
        ))}
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View className="items-center justify-center py-16 px-6">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
        >
          <Ionicons
            name={emptyIcon}
            size={30}
            color={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}
          />
        </View>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          }}
        >
          {emptyLabel}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
        backgroundColor: isDark ? '#111' : '#d8d8d8',
      }}
    >
      {posts.map((post) => (
        <TouchableOpacity
          key={String(post.id)}
          onPress={() => onPostPress(post)}
          activeOpacity={0.85}
          style={{ width: TILE_SIZE - GAP * 0.67, height: TILE_SIZE }}
        >
          {post.postImage ? (
            <Image
              source={{ uri: post.postImage }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                backgroundColor: isDark ? '#1c1c1e' : '#f2f2f2',
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}
              />
              {post.body ? (
                <Text
                  style={{
                    fontSize: 9,
                    color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)',
                    textAlign: 'center',
                    marginTop: 4,
                    lineHeight: 13,
                  }}
                  numberOfLines={4}
                >
                  {post.body}
                </Text>
              ) : null}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
