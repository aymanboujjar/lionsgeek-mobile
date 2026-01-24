import React from 'react';
import { View, Text, Pressable, Image, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '@/api';

// Panel dial preview f right side dial chatbox
export default function PreviewPanel({ attachment, onClose, onPrevious, onNext, hasMultiple, currentIndex, totalCount }) {
    if (!attachment) return null;

    const isImage = attachment.type === 'image' || attachment.path?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    const isVideo = attachment.type === 'video' || attachment.path?.match(/\.(mp4|webm|mov|avi)$/i);

    const handleDownload = async () => {
        const url = attachment.path.startsWith('/storage/') || attachment.path.startsWith('http') 
            ? attachment.path 
            : `${API.APP_URL}/storage/${attachment.path}`;
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error('Error opening URL:', error);
        }
    };

    const imageUrl = attachment.path.startsWith('/storage/') || attachment.path.startsWith('http')
        ? attachment.path
        : `${API.APP_URL}/storage/${attachment.path}`;

    return (
        <View className="w-full h-full bg-gray-900 dark:bg-black flex-col">
            {/* Controls Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
                <Text className="text-sm font-semibold text-white">Preview</Text>
                <View className="flex-row items-center gap-2">
                    {hasMultiple && (
                        <>
                            <Pressable
                                onPress={onPrevious}
                                className="h-8 w-8 items-center justify-center"
                            >
                                <Ionicons name="chevron-back" size={16} color="#fff" />
                            </Pressable>
                            <Text className="text-xs text-gray-400">
                                {currentIndex + 1} / {totalCount}
                            </Text>
                            <Pressable
                                onPress={onNext}
                                className="h-8 w-8 items-center justify-center"
                            >
                                <Ionicons name="chevron-forward" size={16} color="#fff" />
                            </Pressable>
                        </>
                    )}
                </View>
                <View className="flex-row items-center gap-2">
                    <Pressable
                        onPress={handleDownload}
                        className="h-8 w-8 items-center justify-center"
                    >
                        <Ionicons name="download" size={16} color="#fff" />
                    </Pressable>
                    <Pressable
                        onPress={onClose}
                        className="h-8 w-8 items-center justify-center"
                    >
                        <Ionicons name="close" size={16} color="#fff" />
                    </Pressable>
                </View>
            </View>

            {/* Content - Full Height */}
            <ScrollView className="flex-1" contentContainerClassName="flex-1 items-center justify-center p-4 bg-black">
                {isImage && attachment.path && (
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-full"
                        resizeMode="contain"
                    />
                )}

                {isVideo && attachment.path && (
                    <View className="w-full h-full items-center justify-center">
                        <Text className="text-white">Video preview not available in React Native</Text>
                        <Text className="text-gray-400 text-sm mt-2">Use expo-av Video component for full video support</Text>
                    </View>
                )}

                {!isImage && !isVideo && attachment.path && (
                    <View className="bg-gray-800 rounded-lg p-12 items-center gap-4 max-w-md">
                        <Ionicons name="document" size={96} color="#ffc801" />
                        <Text className="text-white text-center font-medium">{attachment.name || 'Attachment'}</Text>
                        <Pressable
                            onPress={handleDownload}
                            className="bg-yellow-500 px-4 py-2 rounded-lg"
                        >
                            <Text className="text-black font-semibold">Download</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
