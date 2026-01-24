import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '@/api';

// Component dial minimized chat shortcut
export default function MinimizedChat({ conversation, unreadCount, onOpen, onClose }) {
    return (
        <View className="absolute bottom-4 right-4 z-[100] flex-col items-end gap-2">
            <View className="relative">
                <Pressable
                    onPress={onOpen}
                    className={`relative w-14 h-14 rounded-full overflow-hidden border-2 shadow-lg ${unreadCount > 0 ? 'border-blue-500' : 'border-yellow-500'}`}
                >
                    {conversation.other_user?.image ? (
                        <Image
                            source={{ uri: `${API.APP_URL}/storage/img/profile/${conversation.other_user.image}` }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full bg-gray-300 dark:bg-gray-700 items-center justify-center">
                            <Ionicons name="person" size={24} color="#666" />
                        </View>
                    )}
                    {unreadCount > 0 && (
                        <View className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center border-2 border-white dark:border-gray-900">
                            <Text className="text-[10px] font-bold text-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </Pressable>
                <Pressable
                    onPress={onClose}
                    className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center opacity-0"
                >
                    <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
            </View>
        </View>
    );
}
