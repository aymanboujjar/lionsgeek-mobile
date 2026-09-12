import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, Platform, Image, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import * as DocumentPicker from 'expo-document-picker';
import AudioRecorder from './AudioRecorder';
import VoiceRecorder from './VoiceRecorder';
import Skeleton from '@/components/ui/Skeleton';

// Conditionally import expo-image-picker
let ImagePicker = null;
try {
    ImagePicker = require('expo-image-picker');
} catch (_error) {
    console.warn('expo-image-picker not installed. Camera and photo library features will be disabled.');
}

// Component dial input dial message
export default function MessageInput({
    newMessage,
    setNewMessage,
    sending,
    isRecording,
    recordingTime,
    attachment,
    setAttachment,
    audioBlob,
    audioURL,
    setAudioBlob,
    setAudioURL,
    mediaRecorderRef,
    fileInputRef,
    handleFileSelect,
    startRecording,
    stopRecording,
    cancelRecording,
    handleSendMessage,
    editingMessage = null,
    onCancelEdit,
    replyToMessage = null,
    onCancelReply,
    isExpanded,
    audioDuration,
    onTypingStart,
    onTypingStop,
    isPaused,
    onPause,
    onResume,
}) {
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabOverflow();
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [voiceIsRecording, setVoiceIsRecording] = useState(false);
    const isDark = colorScheme === 'dark';
    const ph = isDark ? '#737373' : '#737373';
    // Above tab bar when idle; drop that inset while typing so composer sits on the keyboard.
    const composerBottomPad = keyboardVisible
        ? 6
        : tabBarHeight > 0
            ? tabBarHeight + 6
            : Math.max(insets.bottom, 6);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Typing indicator management
    const typingTimeoutRef = useRef(null);
    const hasTypedRef = useRef(false);
    const lastTypingTimeRef = useRef(0);

    // Handle typing events on input change - triggers typing indicator
    const handleInputChange = (value) => {
        setNewMessage(value);

        if (!onTypingStart || !onTypingStop) return;

        // Only trigger if user is actually typing (has content)
        if (value.trim().length > 0) {
            const now = Date.now();

            // Debounce typing start - only trigger every 1 second max
            if (!hasTypedRef.current || (now - lastTypingTimeRef.current) > 1000) {
                onTypingStart();
                hasTypedRef.current = true;
                lastTypingTimeRef.current = now;
            }

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                onTypingStop();
                hasTypedRef.current = false;
            }, 2000);
        } else {
            // Stop typing if input is cleared
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            onTypingStop();
            hasTypedRef.current = false;
        }
    };

    // Stop typing when message is sent or component unmounts
    useEffect(() => {
        if (!newMessage.trim() && hasTypedRef.current && onTypingStop) {
            onTypingStop();
            hasTypedRef.current = false;
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (hasTypedRef.current && onTypingStop) {
                onTypingStop();
            }
        };
    }, [newMessage, onTypingStop]);

    const isImageAttachment = (a) =>
        a?.uri &&
        (a.type?.startsWith?.('image/') ||
            /\.(jpe?g|png|gif|webp|heic)$/i.test(a.name || '') ||
            (!a.type && a.uri && !/\.(mp4|mov|webm|m4v|pdf|doc|zip)$/i.test(a.name || '')));

    const isVideoAttachment = (a) =>
        a?.uri && (a.type?.startsWith?.('video/') || /\.(mp4|mov|webm|m4v)$/i.test(a.name || ''));

    // Format audio duration
    const formatAudioDuration = (seconds) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Request permissions
    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web' && ImagePicker) {
                try {
                    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
                        Alert.alert('Permission needed', 'Camera and media library permissions are required to attach files.');
                    }
                } catch (error) {
                    console.warn('Failed to request image picker permissions:', error);
                }
            }
        })();
    }, []);

    // Show attachment options menu
    const showAttachmentMenu = () => {
        const options = [];

        if (ImagePicker) {
            options.push(
                {
                    text: 'Camera',
                    onPress: handleCameraCapture,
                    style: 'default',
                },
                {
                    text: 'Photo Library',
                    onPress: handleImagePicker,
                    style: 'default',
                }
            );
        }

        options.push(
            {
                text: 'Files',
                onPress: handleFilePicker,
                style: 'default',
            },
            {
                text: 'Cancel',
                style: 'cancel',
            }
        );

        Alert.alert(
            'Choose Attachment',
            'Select how you want to attach a file',
            options,
            { cancelable: true }
        );
    };

    // Handle camera capture
    const handleCameraCapture = async () => {
        if (!ImagePicker) {
            Alert.alert('Not Available', 'Camera feature requires expo-image-picker. Please run: npm install');
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                quality: 0.8,
                allowsMultipleSelection: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setAttachment({
                    uri: asset.uri,
                    name: asset.uri.split('/').pop() || 'photo.jpg',
                    type: asset.type === 'image' ? 'image/jpeg' : asset.mimeType || 'image/jpeg',
                    size: asset.fileSize || 0,
                });
            }
        } catch (error) {
            console.error('Error capturing from camera:', error);
            Alert.alert('Error', 'Failed to capture image from camera');
        }
    };

    // Handle image picker (photo library)
    const handleImagePicker = async () => {
        if (!ImagePicker) {
            Alert.alert('Not Available', 'Photo library feature requires expo-image-picker. Please run: npm install');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                quality: 0.8,
                allowsMultipleSelection: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setAttachment({
                    uri: asset.uri,
                    name: asset.uri.split('/').pop() || (asset.type === 'image' ? 'photo.jpg' : 'video.mp4'),
                    type: asset.type === 'image' ? (asset.mimeType || 'image/jpeg') : (asset.mimeType || 'video/mp4'),
                    size: asset.fileSize || 0,
                });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image from library');
        }
    };

    // Handle file picker
    const handleFilePicker = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'video/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const file = result.assets[0];
                setAttachment({
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType,
                    size: file.size,
                });
            }
        } catch (error) {
            console.error('Error picking file:', error);
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    return (
        <View
            className="px-3 pt-2 border-t border-beta/10 dark:border-light/10 bg-light dark:bg-dark"
            style={{ paddingBottom: composerBottomPad }}
        >
            {editingMessage ? (
                <View className="mb-2 flex-row items-center gap-2 px-3 py-2 rounded-2xl bg-alpha/20 border border-alpha/30">
                    <Ionicons name="pencil" size={16} color="#ffc801" />
                    <View className="flex-1 min-w-0">
                        <Text className="text-[11px] font-bold uppercase tracking-wider text-beta/60 dark:text-light/60">
                            Editing message
                        </Text>
                        <Text className="text-sm text-beta dark:text-light" numberOfLines={1}>
                            {editingMessage.body}
                        </Text>
                    </View>
                    <Pressable
                        onPress={onCancelEdit}
                        hitSlop={8}
                        className="w-8 h-8 rounded-full bg-beta/10 dark:bg-light/10 items-center justify-center"
                    >
                        <Ionicons name="close" size={16} color={ph} />
                    </Pressable>
                </View>
            ) : replyToMessage ? (
                <View className="mb-2 flex-row items-center gap-2 px-3 py-2 rounded-2xl bg-beta/5 dark:bg-light/5 border border-beta/10 dark:border-light/10">
                    <View className="w-1 self-stretch rounded-full bg-alpha" />
                    <View className="flex-1 min-w-0">
                        <Text className="text-[11px] font-bold uppercase tracking-wider text-alpha">
                            Replying
                        </Text>
                        <Text className="text-sm text-beta dark:text-light" numberOfLines={1}>
                            {replyToMessage.body
                                || (replyToMessage.attachment_type === 'audio'
                                    ? 'Voice message'
                                    : replyToMessage.attachment_name || 'Message')}
                        </Text>
                    </View>
                    <Pressable
                        onPress={onCancelReply}
                        hitSlop={8}
                        className="w-8 h-8 rounded-full bg-beta/10 dark:bg-light/10 items-center justify-center"
                    >
                        <Ionicons name="close" size={16} color={ph} />
                    </Pressable>
                </View>
            ) : null}

            {attachment && !editingMessage && (
                <View className="mb-2">
                    {isImageAttachment(attachment) ? (
                        <View className="relative rounded-[22px] overflow-hidden self-stretch">
                            <Image
                                source={{ uri: attachment.uri }}
                                style={{ width: '100%', height: 220 }}
                                resizeMode="cover"
                            />
                            <Pressable
                                onPress={() => setAttachment(null)}
                                hitSlop={10}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/55 items-center justify-center"
                            >
                                <Ionicons name="close" size={18} color="#fff" />
                            </Pressable>
                        </View>
                    ) : isVideoAttachment(attachment) ? (
                        <View className="relative w-full h-44 rounded-[22px] overflow-hidden bg-black">
                            <View className="absolute inset-0 items-center justify-center">
                                <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center border border-white/30">
                                    <Ionicons name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
                                </View>
                            </View>
                            <Pressable
                                onPress={() => setAttachment(null)}
                                hitSlop={10}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/55 items-center justify-center"
                            >
                                <Ionicons name="close" size={18} color="#fff" />
                            </Pressable>
                        </View>
                    ) : (
                        <View className="flex-row items-center gap-3 px-3 py-3 rounded-2xl border border-beta/10 dark:border-light/10">
                            <View className="w-12 h-12 rounded-xl bg-alpha/20 items-center justify-center border border-alpha/30">
                                <Ionicons name="document-text" size={24} color="#ffc801" />
                            </View>
                            <View className="flex-1 min-w-0">
                                <Text className="text-sm font-semibold text-beta dark:text-light" numberOfLines={2}>
                                    {attachment.name || 'File'}
                                </Text>
                                {attachment.size ? (
                                    <Text className="text-[11px] text-beta/50 dark:text-light/50 mt-0.5">
                                        {(attachment.size / 1024).toFixed(1)} KB
                                    </Text>
                                ) : null}
                            </View>
                            <Pressable onPress={() => setAttachment(null)} hitSlop={8} className="p-2 rounded-full bg-beta/10 dark:bg-light/10">
                                <Ionicons name="close" size={20} color={ph} />
                            </Pressable>
                        </View>
                    )}
                </View>
            )}

            {audioURL && audioBlob && !editingMessage && (
                <View className="mb-2 rounded-[22px] overflow-hidden bg-alpha px-3 py-2.5">
                    <View className="flex-row items-center gap-2.5">
                        <Ionicons name="mic" size={22} color="#000" />
                        <View className="flex-1 flex-row items-center gap-[2.5px] h-8">
                            {Array.from({ length: 28 }, (_, i) => (
                                <View
                                    key={i}
                                    style={{
                                        width: 2.5,
                                        height: 8 + (i % 6) * 3.5,
                                        borderRadius: 999,
                                        backgroundColor: 'rgba(0,0,0,0.75)',
                                    }}
                                />
                            ))}
                        </View>
                        <Text className="text-[12px] font-semibold text-black/65 tabular-nums w-9 text-right">
                            {audioDuration ? formatAudioDuration(audioDuration) : '0:00'}
                        </Text>
                        <Pressable
                            onPress={() => {
                                setAudioBlob(null);
                                setAudioURL(null);
                            }}
                            hitSlop={8}
                            className="w-8 h-8 rounded-full bg-black/10 items-center justify-center"
                        >
                            <Ionicons name="close" size={16} color="#000" />
                        </Pressable>
                    </View>
                </View>
            )}

            {/* Recording Indicator - Instagram Style (parent-driven) */}
            {isRecording && !editingMessage ? (
                <View className="mb-1">
                    <AudioRecorder
                        onSend={() => {
                            stopRecording();
                            setTimeout(() => {
                                if (audioBlob) {
                                    handleSendMessage();
                                }
                            }, 100);
                        }}
                        onCancel={cancelRecording}
                        isRecording={isRecording}
                        isPaused={isPaused}
                        onPause={onPause}
                        onResume={onResume}
                        recordingTime={recordingTime}
                    />
                </View>
            ) : (
                <View
                    className={
                        voiceIsRecording && !editingMessage
                            ? 'w-full'
                            : 'flex-row gap-2 items-end bg-light dark:bg-dark rounded-[24px] border border-beta/10 dark:border-light/10 px-1.5 py-1.5'
                    }
                >
                    {!voiceIsRecording || editingMessage ? (
                        <>
                            {!editingMessage ? (
                                <Pressable
                                    onPress={showAttachmentMenu}
                                    className="w-10 h-10 rounded-2xl bg-beta/5 dark:bg-light/5 items-center justify-center active:opacity-70"
                                >
                                    <Ionicons name="add" size={22} color="#ffc801" />
                                </Pressable>
                            ) : (
                                <View className="w-10 h-10 rounded-2xl bg-alpha/20 items-center justify-center">
                                    <Ionicons name="pencil" size={18} color="#ffc801" />
                                </View>
                            )}

                            <View className="flex-1">
                                <TextInput
                                    value={newMessage}
                                    onChangeText={handleInputChange}
                                    placeholder={editingMessage ? 'Edit message…' : 'Write a message…'}
                                    placeholderTextColor={ph}
                                    className="min-h-10 text-[15px] px-2 py-2 text-beta dark:text-light"
                                    editable={!sending}
                                    multiline
                                    style={{ maxHeight: 100 }}
                                />
                            </View>
                        </>
                    ) : null}

                    {!editingMessage ? (
                        <View className={voiceIsRecording ? 'w-full' : undefined}>
                          <VoiceRecorder
                            onRecordingComplete={(uri) => {
                                setAudioBlob({ uri });
                                setAudioURL(uri);
                            }}
                            onCancel={() => {
                                setAudioBlob(null);
                                setAudioURL(null);
                                setVoiceIsRecording(false);
                            }}
                            onRecordingChange={setVoiceIsRecording}
                            disabled={sending}
                            onSendAudioDirect={async (uri, duration) => {
                                await handleSendMessage(null, {
                                    audioBlob: { uri },
                                    audioURL: uri,
                                    audioDuration: duration,
                                    body: '',
                                });
                            }}
                          />
                        </View>
                    ) : null}

                    {(!voiceIsRecording || editingMessage) ? (
                        <Pressable
                            onPress={handleSendMessage}
                            disabled={
                                sending
                                || (editingMessage
                                    ? !newMessage.trim()
                                    : (!newMessage.trim() && !attachment && !audioBlob))
                            }
                            className={`w-11 h-11 rounded-2xl items-center justify-center border ${
                                sending
                                || (editingMessage
                                    ? !newMessage.trim()
                                    : (!newMessage.trim() && !attachment && !audioBlob))
                                    ? 'bg-neutral-200 dark:bg-zinc-800 opacity-55 border-transparent'
                                    : 'bg-alpha active:opacity-90 border-black/10'
                            }`}
                        >
                            {sending ? (
                                <Skeleton width={16} height={16} borderRadius={8} isDark={isDark} />
                            ) : (
                                <Ionicons
                                    name={editingMessage ? 'checkmark' : 'arrow-up'}
                                    size={22}
                                    color="#000"
                                />
                            )}
                        </Pressable>
                    ) : null}
                </View>
            )}
        </View>
    );
}
