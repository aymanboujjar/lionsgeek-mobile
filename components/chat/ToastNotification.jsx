import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '@/api';

// Toast notification component for chat messages
// Component dial toast notification bach new messages

export default function ToastNotification({ notification, onClose, onClick }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!notification || !isVisible) return null;

    const getMessagePreview = () => {
        if (notification.attachment_type === 'image') return '📷 Image';
        if (notification.attachment_type === 'video') return '🎥 Video';
        if (notification.attachment_type === 'audio') return '🎤 Voice message';
        if (notification.attachment_type === 'file') return '📎 File';
        return notification.body || 'New message';
    };

    return (
        <Pressable
            onPress={onClick}
            className={`max-w-sm w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-4 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            <View className="flex-row items-start gap-3">
                {notification.sender?.image ? (
                    <Image
                        source={{ uri: `${API.APP_URL}/storage/img/profile/${notification.sender.image}` }}
                        className="w-10 h-10 rounded-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 items-center justify-center">
                        <Ionicons name="person" size={20} color="#666" />
                    </View>
                )}
                <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-semibold text-black dark:text-white" numberOfLines={1}>
                            {notification.sender?.name || 'New message'}
                        </Text>
                        <Pressable
                            onPress={(e) => {
                                setIsVisible(false);
                                setTimeout(() => onClose(), 300);
                            }}
                            className="ml-2"
                        >
                            <Ionicons name="close" size={16} color="#666" />
                        </Pressable>
                    </View>
                    <Text className="text-xs text-gray-600 dark:text-gray-400" numberOfLines={2}>
                        {getMessagePreview()}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
