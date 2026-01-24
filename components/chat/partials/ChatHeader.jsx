import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import API from '@/api';

// Header dial chatbox m3a 3amaliyet toolbox
export default function ChatHeader({ conversation, onClose, onBack, onToolboxToggle }) {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-light/20 dark:border-dark/20 bg-light dark:bg-dark">
            {onBack && (
                <Pressable
                    onPress={onBack}
                    className="h-10 w-10 items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                </Pressable>
            )}
            <Pressable
                onPress={() => router.push(`/students/${conversation.other_user.id}`)}
                className="flex-row items-center gap-3 flex-1"
            >
                {conversation.other_user?.image ? (
                    <Image
                        source={{ uri: `${API.APP_URL}/storage/img/profile/${conversation.other_user.image}` }}
                        className="w-11 h-11 rounded-full border-2 border-yellow-500/30"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-11 h-11 rounded-full bg-gray-300 dark:bg-gray-700 items-center justify-center border-2 border-yellow-500/30">
                        <Ionicons name="person" size={20} color="#666" />
                    </View>
                )}
                <View className="flex-1">
                    <Text className="text-base font-semibold text-black dark:text-white" numberOfLines={1}>
                        {conversation.other_user?.name || 'User'}
                    </Text>
                    {conversation.other_user?.last_online && (() => {
                        const lastOnline = new Date(conversation.other_user.last_online);
                        const now = new Date();
                        const diffMinutes = Math.floor((now - lastOnline) / (1000 * 60));
                        const isOnline = diffMinutes <= 5;
                        
                        return (
                            <Text className="text-xs text-black/60 dark:text-white/60" numberOfLines={1}>
                                {isOnline ? 'Active now' : `Last seen ${diffMinutes < 60 ? `${diffMinutes}m ago` : `${Math.floor(diffMinutes / 60)}h ago`}`}
                            </Text>
                        );
                    })()}
                </View>
            </Pressable>
            {onClose && (
                <Pressable
                    onPress={onClose}
                    className="h-10 w-10 items-center justify-center"
                >
                    <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
                </Pressable>
            )}
        </View>
    );
}
