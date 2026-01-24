import React, { useState, useCallback, useRef } from 'react';
import { View } from 'react-native';
import ToastNotification from './ToastNotification';

// Toast notification manager - manages multiple toast notifications
// Manager dial toast notifications bach n3mlo queue dial notifications

const MAX_TOASTS = 3;

export default function ToastNotificationManager() {
    const [notifications, setNotifications] = useState([]);
    const shownMessageIdsRef = useRef(new Set());

    // Add notification with deduplication
    const addNotification = useCallback((notification) => {
        // Create unique key for deduplication (message ID or conversation + timestamp)
        const messageId = notification.messageId || 
            `${notification.conversationId}-${notification.userId}-${Date.now()}`;
        
        // Skip if already shown
        if (shownMessageIdsRef.current.has(messageId)) {
            return null;
        }

        shownMessageIdsRef.current.add(messageId);
        const id = Date.now() + Math.random();
        const newNotification = { ...notification, id, messageId };

        setNotifications(prev => {
            const updated = [...prev, newNotification];
            // Keep only last MAX_TOASTS notifications
            return updated.slice(-MAX_TOASTS);
        });

        // Clean up message ID after 30 seconds to allow re-notification if needed
        setTimeout(() => {
            shownMessageIdsRef.current.delete(messageId);
        }, 30000);

        return id;
    }, []);

    // Remove notification
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Handle notification click
    const handleNotificationClick = useCallback((notification) => {
        // Dispatch event to open chat
        if (notification.conversationId) {
            // In React Native, we'll use a different event system or callback
            // For now, we'll just remove the notification
        }
        removeNotification(notification.id);
    }, [removeNotification]);

    // Expose addNotification globally
    React.useEffect(() => {
        if (typeof global !== 'undefined') {
            global.showChatToast = addNotification;
        }
        return () => {
            if (typeof global !== 'undefined') {
                delete global.showChatToast;
            }
        };
    }, [addNotification]);

    return (
        <View className="absolute top-4 right-4 z-[9998]" style={{ maxWidth: 400 }}>
            <View className="flex-col gap-2">
                {notifications.map((notification) => (
                    <View key={notification.id}>
                        <ToastNotification
                            notification={notification}
                            onClose={() => removeNotification(notification.id)}
                            onClick={() => handleNotificationClick(notification)}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}
