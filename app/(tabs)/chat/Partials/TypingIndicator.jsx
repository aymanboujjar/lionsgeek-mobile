import React from 'react';
import { View, Text } from 'react-native';

// Typing indicator component
// Component bach n3rfo ila user kaykteb

export default function TypingIndicator({ userName, isCurrentUser }) {
    return (
        <View className={`flex-row items-center px-4 py-2 rounded-lg mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <View className="flex-row items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-gray-800 rounded-full">
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                    {userName} is typing
                </Text>
                <View className="flex-row gap-1">
                    <View className="w-1 h-1 bg-gray-600 dark:bg-gray-400 rounded-full" />
                    <View className="w-1 h-1 bg-gray-600 dark:bg-gray-400 rounded-full" />
                    <View className="w-1 h-1 bg-gray-600 dark:bg-gray-400 rounded-full" />
                </View>
            </View>
        </View>
    );
}
