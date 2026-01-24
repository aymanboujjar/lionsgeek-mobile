import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import FloatingChatWindow from './FloatingChatWindow';
import API from '@/api';
import { useAppContext } from '@/context';

export default function ChatManager() {
    const [openChats, setOpenChats] = useState([]);
    const [expandedChat, setExpandedChat] = useState(null);
    const { token } = useAppContext();

    useEffect(() => {
        const handleOpenChat = async (event) => {
            const { userId } = event.detail;
            
            // Check if chat already open
            if (openChats.find(chat => chat.otherUserId === userId)) {
                // If minimized, maximize it
                setOpenChats(prev => prev.map(chat => 
                    chat.otherUserId === userId 
                        ? { ...chat, isMinimized: false }
                        : chat
                ));
                return;
            }

            try {
                const response = await API.getWithAuth(`mobile/chat/conversation/${userId}`, token);
                if (response && response.data) {
                    setOpenChats(prev => [...prev, {
                        id: response.data.conversation.id,
                        conversation: response.data.conversation,
                        otherUserId: userId,
                        isMinimized: false
                    }]);
                }
            } catch (error) {
                console.error('Failed to open chat:', error);
            }
        };

        // In React Native, we'll use a different event system
        // For now, we'll expose a method that can be called directly
        if (typeof global !== 'undefined') {
            global.openChat = handleOpenChat;
        }

        return () => {
            if (typeof global !== 'undefined') {
                delete global.openChat;
            }
        };
    }, [openChats, token]);

    const handleClose = (chatId) => {
        setOpenChats(prev => prev.filter(chat => chat.id !== chatId));
    };

    const handleMinimize = (chatId) => {
        setOpenChats(prev => prev.map(chat => 
            chat.id === chatId 
                ? { ...chat, isMinimized: !chat.isMinimized, isExpanded: false }
                : chat
        ));
        if (expandedChat === chatId) {
            setExpandedChat(null);
        }
    };

    const handleExpand = (chatId) => {
        setOpenChats(prev => prev.map(chat => 
            chat.id === chatId 
                ? { ...chat, isExpanded: !chat.isExpanded, isMinimized: false }
                : { ...chat, isExpanded: false }
        ));
        setExpandedChat(expandedChat === chatId ? null : chatId);
    };

    if (openChats.length === 0) return null;

    // Separate expanded and normal chats
    const expandedChatData = openChats.find(chat => chat.id === expandedChat);
    const normalChats = openChats.filter(chat => chat.id !== expandedChat);

    return (
        <>
            {/* Expanded Chat */}
            {expandedChatData && (
                <View className="absolute inset-4 z-[60] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800">
                    <FloatingChatWindow
                        conversation={expandedChatData.conversation}
                        isMinimized={false}
                        isExpanded={true}
                        onClose={() => {
                            handleClose(expandedChatData.id);
                            setExpandedChat(null);
                        }}
                        onMinimize={() => handleMinimize(expandedChatData.id)}
                        onExpand={() => handleExpand(expandedChatData.id)}
                    />
                </View>
            )}

            {/* Normal Floating Chats */}
            {normalChats.length > 0 && (
                <View className="absolute bottom-20 right-4 z-50 flex-col gap-2 items-end">
                    {normalChats.map((chat, index) => {
                        // Stack windows with slight offset
                        const offset = (normalChats.length - 1 - index) * 8;
                        return (
                            <View
                                key={chat.id}
                                style={{
                                    transform: [{ translateX: -offset }, { translateY: -offset }],
                                    zIndex: 50 + index,
                                }}
                            >
                                <FloatingChatWindow
                                    conversation={chat.conversation}
                                    isMinimized={chat.isMinimized}
                                    isExpanded={false}
                                    onClose={() => handleClose(chat.id)}
                                    onMinimize={() => handleMinimize(chat.id)}
                                    onExpand={() => handleExpand(chat.id)}
                                />
                            </View>
                        );
                    })}
                </View>
            )}
        </>
    );
}
