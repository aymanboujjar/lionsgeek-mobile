import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Alert, AppState, Linking, KeyboardAvoidingView, Platform, Share, Text } from 'react-native';
import { format, isToday, isYesterday } from 'date-fns';
import * as Clipboard from 'expo-clipboard';
import { useAppContext } from '@/context';
import API from '@/api';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PreviewPanel from './PreviewPanel';
import ChatToolbox from './ChatToolbox';
import TypingIndicator from './TypingIndicator';
import RecordingIndicator from './RecordingIndicator';
import MessageActionsOverlay from './MessageActionsOverlay';
import { isPlainTextMessage } from './MessageItem';
import { isGatedChatAttachmentUrl, resolveAttachmentUrl } from '@/utils/resolveAttachmentUrl';

// Main ChatBox component - refactored b components so9or
export default function ChatBox({ conversation, onBack, isExpanded, onExpand, suppressMessageListLoadingSkeleton }) {
    const { user, token } = useAppContext();
    const currentUser = user;
    const [messages, setMessages] = useState(conversation.messages || []);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMoreOlder, setHasMoreOlder] = useState(true);
    const [attachment, setAttachment] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioURL, setAudioURL] = useState(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(null);
    const [previewAttachment, setPreviewAttachment] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [audioProgress, setAudioProgress] = useState({});
    const [audioDuration, setAudioDuration] = useState({});
    const [sessionMessageIds, setSessionMessageIds] = useState(() => new Set());
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [contextMessage, setContextMessage] = useState(null);
    const [showToolbox, setShowToolbox] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [recordingUsers, setRecordingUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const pendingTempIdsRef = useRef(new Set());
    const typingTimeoutRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);
    const nearBottomRef = useRef(true);
    const sendingRef = useRef(false);

    // Reset session + fetch when conversation changes (single effect).
    useEffect(() => {
        setSessionMessageIds(new Set());
        setEditingMessage(null);
        setReplyToMessage(null);
        setContextMessage(null);
        setNewMessage('');
        setMessages(prev => {
            return prev.filter(m => m.pending && pendingTempIdsRef.current.has(m.tempId));
        });
        shouldAutoScrollRef.current = true;
        setHasMoreOlder(true);
        fetchMessages();
    }, [conversation.id]);

    const trackSessionMessage = useCallback((id, replaceId = null) => {
        if (id == null && replaceId == null) return;
        setSessionMessageIds((prev) => {
            const next = new Set(prev);
            if (replaceId != null) next.delete(replaceId);
            if (id != null) next.add(id);
            return next;
        });
    }, []);

    useEffect(() => {
        if (shouldAutoScrollRef.current) {
            setTimeout(() => scrollToBottom(), 30);
            shouldAutoScrollRef.current = false;
        }
    }, [messages]);

    // Update recording time timer
    useEffect(() => {
        if (isRecording && !isPaused) {
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        }
        
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, [isRecording, isPaused]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await API.getWithAuth(`mobile/chat/conversation/${conversation.id}/messages?limit=150`, token);

            if (response && response.data) {
                const fetchedMessages = response.data.messages || [];

                setMessages(prev => {
                    const pendingMessages = prev.filter(m => m.pending && pendingTempIdsRef.current.has(m.tempId));
                    const existingIds = new Set(fetchedMessages.map(m => m.id));
                    const stillPending = pendingMessages.filter(m => !existingIds.has(m.tempId));
                    return [...fetchedMessages, ...stillPending];
                });
                setHasMoreOlder(fetchedMessages.length >= 150);
                shouldAutoScrollRef.current = nearBottomRef.current;

                // Mark messages as read when conversation is opened
                const appState = AppState.currentState;
                if (appState === 'active') {
                    await API.postWithAuth(`mobile/chat/conversation/${conversation.id}/read`, {}, token).catch(err => console.error('Failed to mark as read:', err));
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadOlderMessages = async () => {
        if (loadingOlder || !hasMoreOlder || !messages.length) return;
        const oldestId = messages.find((m) => m.id != null && !m.pending)?.id;
        if (!oldestId) return;

        try {
            setLoadingOlder(true);
            const response = await API.getWithAuth(
                `mobile/chat/conversation/${conversation.id}/messages?limit=50&before_id=${oldestId}`,
                token
            );
            const older = response?.data?.messages || [];
            if (older.length === 0) {
                setHasMoreOlder(false);
                return;
            }
            setMessages((prev) => {
                const existing = new Set(prev.map((m) => m.id));
                const uniqueOlder = older.filter((m) => m.id != null && !existing.has(m.id));
                return [...uniqueOlder, ...prev];
            });
            setHasMoreOlder(older.length >= 50);
        } catch (error) {
            console.error('Failed to load older messages:', error);
        } finally {
            setLoadingOlder(false);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            if (typeof messagesEndRef.current.scrollToEnd === 'function') {
                messagesEndRef.current.scrollToEnd({ animated: true });
            }
        }
    };

    // Typing indicator functions (simplified for React Native)
    const startTyping = useCallback(() => {
        // In React Native, we can implement typing indicator via API calls
        // For now, just a placeholder
    }, []);

    const stopTyping = useCallback(() => {
        // Placeholder
    }, []);

    const startRecordingIndicator = useCallback(() => {
        // Placeholder
    }, []);

    const stopRecordingIndicator = useCallback(() => {
        // Placeholder
    }, []);

    const handleSendMessage = async (e, overrides = null) => {
        if (e && e.preventDefault) e.preventDefault();

        const nextAudioBlob = overrides?.audioBlob ?? audioBlob;
        const nextAudioURL = overrides?.audioURL ?? audioURL;
        const nextAttachment = overrides?.attachment ?? attachment;
        const nextMessageBody = overrides?.body !== undefined ? overrides.body : newMessage.trim();

        if ((!nextMessageBody && !nextAttachment && !nextAudioBlob) || sending || sendingRef.current) return;

        sendingRef.current = true;
        const messageBody = typeof nextMessageBody === 'string' ? nextMessageBody.trim() : '';
        const tempId = Date.now();
        pendingTempIdsRef.current.add(tempId);
        
        // Create optimistic message
        const replyTarget = overrides?.replyTo ?? replyToMessage;
        const optimisticMessage = {
            id: tempId,
            tempId: tempId,
            pending: true,
            body: messageBody,
            sender_id: currentUser.id,
            sender: {
                id: currentUser.id,
                name: currentUser.name,
                image: currentUser.image,
            },
            reply_to: replyTarget?.id ?? null,
            reply_preview: replyTarget
                ? {
                    id: replyTarget.id,
                    body: replyTarget.body || (replyTarget.attachment_type ? 'Attachment' : 'Message'),
                    sender_id: replyTarget.sender_id,
                    sender_name:
                        replyTarget.sender?.name
                        || (String(replyTarget.sender_id) === String(currentUser.id)
                            ? currentUser.name
                            : conversation?.other_user?.name),
                    attachment_type: replyTarget.attachment_type,
                }
                : null,
            attachment_path: null,
            attachment_type: null,
            attachment_name: null,
            attachment_size: null,
            is_read: false,
            read_at: null,
            created_at: new Date().toISOString(),
            reactions: [],
            my_reaction: null,
        };

        if (nextAttachment) {
            optimisticMessage.attachment_path = nextAttachment.uri;
            optimisticMessage.attachment_name = nextAttachment.name;
            optimisticMessage.attachment_size = nextAttachment.size;
            
            if (nextAttachment.type.startsWith('image/')) {
                optimisticMessage.attachment_type = 'image';
            } else if (nextAttachment.type.startsWith('video/')) {
                optimisticMessage.attachment_type = 'video';
            } else {
                optimisticMessage.attachment_type = 'file';
            }
        }

        if (nextAudioBlob) {
            optimisticMessage.attachment_path = nextAudioURL || nextAudioBlob.uri;
            optimisticMessage.attachment_type = 'audio';
            optimisticMessage.attachment_name = 'voice-message.m4a';
            optimisticMessage.attachment_size = nextAudioBlob.size || 0;
            if (overrides?.audioDuration != null) {
                optimisticMessage.audio_duration = overrides.audioDuration;
            }
        }

        setMessages(prev => [...prev, optimisticMessage]);
        trackSessionMessage(tempId);
        shouldAutoScrollRef.current = true;

        const formMessageBody = messageBody;
        const formAttachment = nextAttachment;
        const formAudioBlob = nextAudioBlob;
        const formAudioURL = nextAudioURL || nextAudioBlob?.uri;
        const sentAsAudio = Boolean(formAudioBlob);
        
        setNewMessage('');
        setAttachment(null);
        setAudioBlob(null);
        setAudioURL(null);
        setRecordingTime(0);
        setReplyToMessage(null);

        setSending(true);
        
        try {
            const formData = new FormData();
            formData.append('body', formMessageBody || '');
            if (replyTarget?.id) {
                formData.append('reply_to', String(replyTarget.id));
            }            
            if (formAttachment) {
                // React Native FormData format for file uploads
                // Laravel expects the file to have uri, type, and name properties
                const fileExtension = formAttachment.name?.split('.').pop() || 
                    (formAttachment.type?.includes('image') ? 'jpg' : 
                     formAttachment.type?.includes('video') ? 'mp4' : 'file');
                const fileName = formAttachment.name || `attachment.${fileExtension}`;
                
                // Ensure proper MIME type
                let mimeType = formAttachment.type || 'application/octet-stream';
                if (!mimeType || mimeType === 'application/octet-stream') {
                    if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
                    else if (fileExtension === 'png') mimeType = 'image/png';
                    else if (fileExtension === 'mp4') mimeType = 'video/mp4';
                    else if (fileExtension === 'pdf') mimeType = 'application/pdf';
                }
                
                // React Native FormData file format
                const fileData = {
                    uri: formAttachment.uri,
                    type: mimeType,
                    name: fileName,
                };
                
                console.log('[CHATBOX] Uploading file:', {
                    fileName,
                    mimeType,
                    uri: formAttachment.uri.substring(0, 50) + '...',
                });
                
                formData.append('attachment', fileData);
                
                const attachmentType = mimeType.startsWith('image/') ? 'image' 
                    : mimeType.startsWith('video/') ? 'video' 
                    : 'file';
                formData.append('attachment_type', attachmentType);
            }
            
            if (formAudioBlob) {
                // MPEG-4 AAC voice notes are often sniffed as video/mp4 by servers.
                // Force audio MIME + name, and keep attachment_type=audio.
                const audioUri = formAudioBlob.uri || formAudioURL;
                const audioData = {
                    uri: audioUri,
                    type: 'audio/mp4',
                    name: 'voice-message.m4a',
                };
                
                console.log('[CHATBOX] Uploading audio:', {
                    uri: String(audioUri || '').substring(0, 50) + '...',
                });
                
                formData.append('attachment', audioData);
                formData.append('attachment_type', 'audio');
                if (overrides?.audioDuration != null) {
                    formData.append('audio_duration', String(overrides.audioDuration));
                }
            }

            const response = await API.postWithAuth(
                `mobile/chat/conversation/${conversation.id}/send`,
                formData,
                token
            );

            if (response && response.data) {
                const rawMessage = response.data.message || {};
                // If backend mis-classifies m4a/AAC as video, keep it as audio on the client.
                const newMessageData = sentAsAudio
                    ? {
                        ...rawMessage,
                        attachment_type: 'audio',
                        attachment_name: rawMessage.attachment_name?.match(/\.(mp4|m4a|aac|caf)$/i)
                            ? 'voice-message.m4a'
                            : (rawMessage.attachment_name || 'voice-message.m4a'),
                        audio_duration: rawMessage.audio_duration ?? overrides?.audioDuration,
                    }
                    : rawMessage;

                setMessages(prev => {
                    const filtered = prev.filter(msg => msg.tempId !== tempId);
                    const updated = filtered.map(msg => {
                        if (msg.sender_id !== currentUser.id && !msg.is_read) {
                            return {
                                ...msg,
                                is_read: true,
                                read_at: new Date().toISOString(),
                            };
                        }
                        return msg;
                    });
                    
                    const exists = updated.some(msg => msg.id === newMessageData.id);
                    if (!exists) {
                        return [...updated, {
                            ...newMessageData,
                            sender: newMessageData.sender || {
                                id: currentUser.id,
                                name: currentUser.name,
                                image: currentUser.image,
                            }
                        }];
                    }
                    return updated;
                });

                pendingTempIdsRef.current.delete(tempId);
                trackSessionMessage(newMessageData.id, tempId);
                scrollToBottom();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
            pendingTempIdsRef.current.delete(tempId);
            trackSessionMessage(null, tempId);
            Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    const handleStartEditMessage = (message) => {
        if (!message || message.pending) return;
        if (!sessionMessageIds.has(message.id) || !isPlainTextMessage(message)) {
            Alert.alert('Unavailable', 'You can only edit text messages you sent in this open conversation.');
            return;
        }
        setReplyToMessage(null);
        setEditingMessage(message);
        setNewMessage(message.body || '');
        setAttachment(null);
        setAudioBlob(null);
        setAudioURL(null);
    };

    const handleCancelEditMessage = () => {
        setEditingMessage(null);
        setNewMessage('');
    };

    const handleStartReply = (message) => {
        if (!message || message.pending) return;
        setEditingMessage(null);
        setReplyToMessage(message);
    };

    const handleCancelReply = () => {
        setReplyToMessage(null);
    };

    const handleCopyMessage = async (message) => {
        const text = typeof message?.body === 'string' ? message.body.trim() : '';
        if (!text || text.startsWith('{')) {
            Alert.alert('Copy', 'Nothing to copy from this message.');
            return;
        }
        try {
            await Clipboard.setStringAsync(text);
        } catch {
            Alert.alert('Error', 'Failed to copy message.');
        }
    };

    const handleForwardMessage = async (message) => {
        const text = typeof message?.body === 'string' ? message.body.trim() : '';
        const payload = text && !text.startsWith('{')
            ? text
            : message?.attachment_name
                ? `Shared attachment: ${message.attachment_name}`
                : 'Shared a chat message';
        try {
            await Share.share({ message: payload });
        } catch {
            // user dismissed share sheet
        }
    };

    const handleReactToMessage = async (message, reaction) => {
        if (!message?.id || message.pending) return;
        if (reaction === '➕') {
            Alert.alert('React', 'Pick a reaction', [
                { text: '🔥', onPress: () => handleReactToMessage(message, '🔥') },
                { text: '👏', onPress: () => handleReactToMessage(message, '👏') },
                { text: '🙌', onPress: () => handleReactToMessage(message, '🙌') },
                { text: 'Cancel', style: 'cancel' },
            ]);
            return;
        }
        try {
            const response = await API.postWithAuth(
                `mobile/chat/message/${message.id}/react`,
                { reaction },
                token
            );
            const updated = response?.data?.message;
            if (updated) {
                setMessages((prev) =>
                    prev.map((msg) => (msg.id === message.id ? { ...msg, ...updated } : msg))
                );
                setContextMessage((prev) =>
                    prev?.id === message.id ? { ...prev, ...updated } : prev
                );
            }
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to react');
        }
    };

    const handleUpdateMessage = async () => {
        if (!editingMessage || sending) return;
        const body = newMessage.trim();
        if (!body) {
            Alert.alert('Error', 'Message cannot be empty.');
            return;
        }

        setSending(true);
        try {
            const response = await API.put(
                `mobile/chat/message/${editingMessage.id}`,
                token,
                { body }
            );
            const updated = response?.data?.message;
            if (!updated) {
                throw new Error('Failed to update message');
            }

            setMessages((prev) =>
                prev.map((msg) => (msg.id === editingMessage.id ? { ...msg, ...updated } : msg))
            );
            setEditingMessage(null);
            setNewMessage('');
        } catch (error) {
            const apiMessage = error?.response?.data?.message;
            Alert.alert('Error', apiMessage || error.message || 'Failed to update message');
        } finally {
            setSending(false);
        }
    };

    const handleComposerSubmit = async (e, overrides = null) => {
        if (editingMessage) {
            await handleUpdateMessage();
            return;
        }
        await handleSendMessage(e, overrides);
    };

    // Format message time
    const formatMessageTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'few seconds ago';
        if (diffMins < 60) return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
        if (diffHours < 24 && isToday(date)) return format(date, 'h:mm a');
        if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
        if (diffDays < 7) return format(date, 'EEEE');
        return format(date, 'MMM d, yyyy');
    };

    const formatSeenTime = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        if (isToday(date)) return `Seen today at ${format(date, 'h:mm a')}`;
        if (isYesterday(date)) return `Seen yesterday at ${format(date, 'h:mm a')}`;
        return `Seen ${format(date, 'MMM d')}`;
    };

    const handlePlayAudio = (audioPath, messageId) => {
        setIsPlayingAudio(isPlayingAudio === messageId ? null : messageId);
    };

    const handleDeleteMessage = async (messageOrId) => {
        const messageId = typeof messageOrId === 'object' ? (messageOrId.id ?? messageOrId.tempId) : messageOrId;
        const target = messages.find((msg) => msg.id === messageId || msg.tempId === messageId);
        if (!target) return;

        if (String(target.sender_id) !== String(currentUser.id)) {
            return;
        }

        // Pending optimistic messages: remove locally only.
        if (target.pending) {
            setMessages((prev) => prev.filter((msg) => msg.tempId !== target.tempId && msg.id !== messageId));
            pendingTempIdsRef.current.delete(target.tempId);
            trackSessionMessage(null, target.tempId);
            if (editingMessage?.id === messageId || editingMessage?.tempId === target.tempId) {
                handleCancelEditMessage();
            }
            return;
        }

        Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await API.remove(`mobile/chat/message/${target.id}`, token);
                            setMessages((prev) => prev.filter((msg) => msg.id !== target.id));
                            trackSessionMessage(null, target.id);
                            if (editingMessage?.id === target.id) {
                                handleCancelEditMessage();
                            }
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to delete message');
                        }
                    }
                }
            ]
        );
    };

    const handleDownloadAttachment = async (attachmentPath, attachmentName) => {
        if (!attachmentPath) return;
        const url = resolveAttachmentUrl(attachmentPath);
        try {
            if (isGatedChatAttachmentUrl(url) && token) {
                const FileSystem = await import('expo-file-system/legacy');
                const safeName = (attachmentName || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
                const dest = `${FileSystem.cacheDirectory}${Date.now()}_${safeName}`;
                const result = await FileSystem.downloadAsync(url, dest, {
                    headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
                });
                await Linking.openURL(result.uri);
                return;
            }
            await Linking.openURL(url);
        } catch (error) {
            console.error('Error opening URL:', error);
        }
    };

    const getAttachmentsForPreview = () => {
        return messages.filter(m => m.attachment_path && ['image', 'video'].includes(m.attachment_type))
            .map(m => ({ type: m.attachment_type, path: m.attachment_url || m.attachment_path, name: m.attachment_name }));
    };

    const handlePreviewAttachment = (att) => {
        const all = getAttachmentsForPreview();
        const idx = all.findIndex(a => a.path === att.path);
        setPreviewIndex(idx >= 0 ? idx : 0);
        setPreviewAttachment(all[idx >= 0 ? idx : 0]);
        setShowToolbox(false);
    };

    const handleNextPreview = () => {
        const all = getAttachmentsForPreview();
        if (all.length > 0) {
            const nextIndex = (previewIndex + 1) % all.length;
            setPreviewIndex(nextIndex);
            setPreviewAttachment(all[nextIndex]);
        }
    };

    const handlePreviousPreview = () => {
        const all = getAttachmentsForPreview();
        if (all.length > 0) {
            const prevIndex = (previewIndex - 1 + all.length) % all.length;
            setPreviewIndex(prevIndex);
            setPreviewAttachment(all[prevIndex]);
        }
    };

    const allAttachments = getAttachmentsForPreview();
    const hasMultipleAttachments = allAttachments.length > 1;

    // Handle file selection (from MessageInput)
    const handleFileSelect = (file) => {
        setAttachment(file);
    };

    // Recording functions (handled by VoiceRecorder component)
    const startRecording = () => {
        setIsRecording(true);
        setRecordingTime(0);
    };

    const stopRecording = () => {
        setIsRecording(false);
        stopRecordingIndicator();
    };

    const cancelRecording = () => {
        setIsRecording(false);
        setAudioBlob(null);
        setAudioURL(null);
        setRecordingTime(0);
        stopRecordingIndicator();
    };

    const pauseRecording = () => {
        setIsPaused(true);
    };

    const resumeRecording = () => {
        setIsPaused(false);
    };

    const handleListScroll = (event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
        const nearBottom = distanceFromBottom < 120;
        nearBottomRef.current = nearBottom;
        if (contentOffset.y < 80) {
            loadOlderMessages();
        }
    };

    return (
        <View className="bg-light dark:bg-dark flex-col flex-1 overflow-hidden relative">
            {/* Header stays fixed; only messages + composer avoid the keyboard (WhatsApp-style). */}
            <ChatHeader conversation={conversation} onBack={onBack} />

            {/* iOS: padding lifts content. Android + adjustResize: `height` avoids stacking resize + bottom padding. */}
            <KeyboardAvoidingView
                style={{
                    flex: 1,
                    width: '100%',
                    opacity: previewAttachment ? 0 : 1,
                }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                enabled
                keyboardVerticalOffset={0}
            >
                <View style={{ flex: 1, minHeight: 0 }}>
                    <MessageList
                        messages={messages}
                        loading={loading}
                        loadingOlder={loadingOlder}
                        onLoadOlder={loadOlderMessages}
                        suppressInitialLoadingSkeleton={suppressMessageListLoadingSkeleton}
                        currentUser={currentUser}
                        conversation={conversation}
                        isPlayingAudio={isPlayingAudio}
                        audioProgress={audioProgress}
                        audioDuration={audioDuration}
                        onLongPressMessage={setContextMessage}
                        onReactToMessage={handleReactToMessage}
                        onPlayAudio={handlePlayAudio}
                        onPreviewAttachment={handlePreviewAttachment}
                        onDownloadAttachment={handleDownloadAttachment}
                        formatMessageTime={formatMessageTime}
                        formatSeenTime={formatSeenTime}
                        messagesEndRef={messagesEndRef}
                        showToolbox={false}
                        previewAttachment={previewAttachment}
                        typingUsers={typingUsers}
                        recordingUsers={recordingUsers}
                        onScroll={handleListScroll}
                    />
                </View>

                <MessageInput
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    sending={sending}
                    isRecording={isRecording}
                    recordingTime={recordingTime}
                    attachment={attachment}
                    setAttachment={setAttachment}
                    audioBlob={audioBlob}
                    audioURL={audioURL}
                    setAudioBlob={setAudioBlob}
                    setAudioURL={setAudioURL}
                    mediaRecorderRef={null}
                    fileInputRef={null}
                    handleFileSelect={handleFileSelect}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    cancelRecording={cancelRecording}
                    handleSendMessage={handleComposerSubmit}
                    editingMessage={editingMessage}
                    onCancelEdit={handleCancelEditMessage}
                    replyToMessage={replyToMessage}
                    onCancelReply={handleCancelReply}
                    isExpanded={isExpanded}
                    audioDuration={audioDuration['preview']}
                    onTypingStart={startTyping}
                    onTypingStop={stopTyping}
                    isPaused={isPaused}
                    onPause={pauseRecording}
                    onResume={resumeRecording}
                />
            </KeyboardAvoidingView>

            <MessageActionsOverlay
                visible={Boolean(contextMessage)}
                message={contextMessage}
                isCurrentUser={
                    contextMessage
                        ? String(contextMessage.sender_id) === String(currentUser.id)
                        : false
                }
                canEdit={
                    Boolean(
                        contextMessage
                        && String(contextMessage.sender_id) === String(currentUser.id)
                        && sessionMessageIds.has(contextMessage.id)
                        && isPlainTextMessage(contextMessage)
                    )
                }
                onClose={() => setContextMessage(null)}
                onReply={handleStartReply}
                onForward={handleForwardMessage}
                onCopy={handleCopyMessage}
                onEdit={handleStartEditMessage}
                onDelete={handleDeleteMessage}
                onReact={(emoji) => {
                    if (contextMessage) {
                        handleReactToMessage(contextMessage, emoji).finally(() => {
                            if (emoji !== '➕') setContextMessage(null);
                        });
                    }
                }}
                previewContent={
                    <View className="px-3.5 py-3">
                        <Text
                            className={`text-[15px] leading-[21px] ${
                                contextMessage
                                && String(contextMessage.sender_id) === String(currentUser.id)
                                    ? 'text-black'
                                    : 'text-white'
                            }`}
                            numberOfLines={8}
                        >
                            {contextMessage?.body
                                || (contextMessage?.attachment_type === 'audio'
                                    ? 'Voice message'
                                    : contextMessage?.attachment_type === 'image'
                                        ? 'Photo'
                                        : contextMessage?.attachment_name || 'Message')}
                        </Text>
                    </View>
                }
            />

            {/* Preview Panel - Full Width */}
            {previewAttachment && (
                <View className="absolute inset-0 z-50 bg-white dark:bg-gray-900 flex-col">
                    <PreviewPanel
                        attachment={previewAttachment}
                        onClose={() => setPreviewAttachment(null)}
                        onPrevious={handlePreviousPreview}
                        onNext={handleNextPreview}
                        hasMultiple={hasMultipleAttachments}
                        currentIndex={previewIndex}
                        totalCount={allAttachments.length}
                    />
                </View>
            )}
        </View>
    );
}
