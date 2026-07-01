import { useState } from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';

export default function AboutCard({ profile, isDark }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bio = profile?.bio ?? profile?.about ?? profile?.description ?? null;
  const bioText = typeof bio === 'string' ? bio.trim() : String(bio ?? '').trim();
  if (!bioText) return null;

  const MAX_ABOUT_CHARS = 100;
  const isTruncatable = bioText.length > MAX_ABOUT_CHARS;
  const displayedText =
    isExpanded || !isTruncatable
      ? bioText
      : `${bioText.slice(0, MAX_ABOUT_CHARS).trimEnd()}…`;

  const toggleExpanded = () => {
    if (!isTruncatable) return;
    setIsExpanded((prev) => !prev);
  };

  return (
    <View className="mx-4 mb-3 rounded-2xl bg-light dark:bg-dark border border-black/10 dark:border-white/10 p-4">
      <Text className="text-base font-bold text-black dark:text-white mb-2">About</Text>
      <Pressable onPress={toggleExpanded} disabled={!isTruncatable}>
        <Text className="text-sm text-black/70 dark:text-white/70 leading-[22px]">
          {displayedText}
        </Text>
      </Pressable>

      {isTruncatable && (
        <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7} hitSlop={10}>
          <Text className="mt-2 text-sm text-alpha font-semibold">
            {isExpanded ? 'See less' : 'See more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
