import { View } from 'react-native';

export default function OnlineBadge({ lastOnline }) {
  if (!lastOnline) return null;

  const diffMinutes = Math.floor((Date.now() - new Date(lastOnline)) / 60000);
  const isOnline = diffMinutes <= 5;

  if (!isOnline) return null;

  return (
    <View
      className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-good border-2 border-light dark:border-dark"
    />
  );
}
