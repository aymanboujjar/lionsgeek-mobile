import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Recording indicator component
// Component bach n3rfo ila user kayrecord audio

export default function RecordingIndicator({ userName, isCurrentUser }) {
    return (
        <View className={`flex-row items-center px-4 py-2 rounded-lg mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <View className="flex-row items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                <Ionicons name="mic" size={14} color="#ef4444" />
                <Text className="text-xs font-medium text-red-500">
                    {userName} is recording
                </Text>
            </View>
        </View>
    );
}
