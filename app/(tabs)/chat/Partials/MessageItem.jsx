import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import * as Haptics from 'expo-haptics';
import API from '@/api';
import VoiceMessage from './VoiceMessage';
import { useAppContext } from '@/context';
import { isGatedChatAttachmentUrl, resolveAttachmentUrl } from '@/utils/resolveAttachmentUrl';

function tryParsePostShare(body) {
    if (!body || typeof body !== 'string') return null;
    const trimmed = body.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed?.type !== 'post_share' || !parsed?.post_id) return null;
        return parsed;
    } catch {
        return null;
    }
}

function tryParseStoryReply(body) {
    if (!body) return null;
    let parsed = body;
    if (typeof body === 'string') {
        const trimmed = body.trim();
        if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
        try {
            parsed = JSON.parse(trimmed);
        } catch {
            return null;
        }
    }
    if (parsed?.type !== 'story_reply') return null;
    return parsed;
}

export function isPlainTextMessage(message) {
    if (!message) return false;
    if (message.attachment_path || message.attachment_type) return false;
    const body = typeof message.body === 'string' ? message.body.trim() : '';
    if (!body) return false;
    if (tryParsePostShare(body) || tryParseStoryReply(body)) return false;
    return true;
}

function resolveImageUrl(value) {
    if (!value || typeof value !== 'string') return null;
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    const baseUrl = (API?.APP_URL || '').replace(/\/+$/, '');
    if (!baseUrl) return null;
    if (value.includes('storage/')) {
        const cleanPath = value.startsWith('/') ? value : `/${value}`;
        return `${baseUrl}${cleanPath}`;
    }
    if (value.includes('img/posts/')) {
        const cleanPath = value.startsWith('/') ? value : `/${value}`;
        return `${baseUrl}/storage/${cleanPath.replace(/^\//, '')}`;
    }
    return `${baseUrl}/storage/img/posts/${value}`;
}

// Component dial message wahda
export default function MessageItem({
    message,
    isCurrentUser,
    currentUser,
    otherUser,
    showDateSeparator,
    isPlayingAudio,
    audioProgress,
    audioDuration,
    onLongPressMessage,
    onReactToMessage,
    onPlayAudio,
    onPreviewAttachment,
    onDownloadAttachment,
    formatMessageTime,
    formatSeenTime,
}) {
    const router = useRouter();
    const { token } = useAppContext();
    const postShare = tryParsePostShare(message?.body);
    const storyReply = tryParseStoryReply(message?.body);
    const attachmentMediaUrl = resolveAttachmentUrl(message.attachment_url || message.attachment_path);
    const authHeaders = isGatedChatAttachmentUrl(attachmentMediaUrl) && token
        ? { Authorization: `Bearer ${token}` }
        : undefined;

    const handleLongPress = () => {
        if (message?.pending) return;
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
            // optional
        }
        onLongPressMessage?.(message);
    };

    const imageUrl = attachmentMediaUrl;
    const attachmentName = String(message.attachment_name || message.attachment_path || '');
    const looksLikeVoiceNote = /\.(m4a|aac|caf|mp3|wav)$/i.test(attachmentName)
        || /voice-message|audio\./i.test(attachmentName);
    const isAudioAttachment = message.attachment_type === 'audio'
        || (message.attachment_type === 'video' && looksLikeVoiceNote);
    const isVideoAttachment = message.attachment_type === 'video' && !looksLikeVoiceNote;

    const bubbleRadius = isCurrentUser
        ? {
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 4,
        }
        : {
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 18,
        };

    const hasTextBody = Boolean(
        (message.body && !postShare && !storyReply) || postShare || storyReply
    );
    const isImageOnly =
        message.attachment_type === 'image' &&
        message.attachment_path &&
        !hasTextBody &&
        !isAudioAttachment &&
        !isVideoAttachment;
    const isVideoOnly = isVideoAttachment && message.attachment_path && !hasTextBody;
    const isAudioOnly = isAudioAttachment && message.attachment_path && !hasTextBody;
    const isMediaBubble = isImageOnly || isVideoOnly;
    const isEdited = Boolean(message.edited)
        || (
            message.updated_at
            && message.created_at
            && new Date(message.updated_at).getTime() !== new Date(message.created_at).getTime()
        );

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const replyPreview = message.reply_preview;
    const reactions = Array.isArray(message.reactions) ? message.reactions : [];

    const metaRow = (
        <View className={`flex-row items-center gap-1 ${isCurrentUser ? 'justify-end' : 'justify-start'} mt-1 px-1`}>
            {isEdited ? (
                <Text className="text-[11px] text-beta/45 dark:text-light/45">Edited</Text>
            ) : null}
            <Text className="text-[11px] text-beta/45 dark:text-light/45">
                {formatMessageTime(message.created_at)}
            </Text>
            {isCurrentUser ? (
                <View className="ml-0.5">
                    {message.pending ? (
                        <Ionicons name="time-outline" size={12} color="#888" />
                    ) : message.is_read && message.read_at ? (
                        <Ionicons name="checkmark-done" size={14} color="#3b82f6" />
                    ) : (
                        <Ionicons name="checkmark" size={14} color="#888" />
                    )}
                </View>
            ) : null}
        </View>
    );

    return (
        <>
            {showDateSeparator && (
                <View className="flex-row items-center my-5 px-2">
                    <View className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                    <Text className="mx-3 text-[10px] font-bold tracking-[0.2em] text-black/40 dark:text-white/40 uppercase">
                        {isToday(new Date(message.created_at))
                            ? 'Today'
                            : isYesterday(new Date(message.created_at))
                                ? 'Yesterday'
                                : format(new Date(message.created_at), 'MMM d, yyyy')}
                    </Text>
                    <View className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                </View>
            )}
            <View className={`flex-row mb-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                {!isCurrentUser && (
                    <Pressable
                        onPress={() => router.push(`/students/${otherUser.id}`)}
                        className="mr-2 self-end mb-1"
                    >
                        {otherUser?.image ? (
                            <Image
                                source={{ uri: `${API.APP_URL}/storage/img/profile/${otherUser.image}` }}
                                className="w-7 h-7 rounded-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-zinc-700 items-center justify-center">
                                <Ionicons name="person" size={14} color="#888" />
                            </View>
                        )}
                    </Pressable>
                )}

                <View className="max-w-[78%]">
                    {/* Instagram-style standalone image / video bubble */}
                    {isMediaBubble ? (
                        <View>
                            <Pressable
                                onPress={() =>
                                    onPreviewAttachment({
                                        type: isVideoOnly ? 'video' : 'image',
                                        path: message.attachment_url || message.attachment_path,
                                        name: message.attachment_name,
                                    })
                                }
                                onLongPress={handleLongPress}
                                delayLongPress={280}
                                className="rounded-[22px] overflow-hidden bg-neutral-200 dark:bg-zinc-800"
                                style={{ width: 260, maxWidth: '100%' }}
                            >
                                {isImageOnly ? (
                                    <Image
                                        source={{ uri: imageUrl, headers: authHeaders }}
                                        style={{ width: '100%', height: 320 }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className="w-full h-72 items-center justify-center bg-black">
                                        <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center border border-white/30">
                                            <Ionicons name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
                                        </View>
                                    </View>
                                )}
                            </Pressable>
                            {metaRow}
                        </View>
                    ) : (
                        <Pressable
                            onLongPress={handleLongPress}
                            delayLongPress={280}
                            className={`rounded-[22px] overflow-hidden ${
                                isCurrentUser
                                    ? 'bg-alpha'
                                    : isAudioOnly
                                        ? 'bg-neutral-200 dark:bg-[#2c2c2c]'
                                        : 'bg-neutral-200 dark:bg-[#2c2c2c]'
                            }`}
                            style={bubbleRadius}
                        >
                            <View className={isAudioOnly ? 'px-3 py-2.5' : 'px-3.5 py-3'}>
                                {replyPreview ? (
                                    <View
                                        className={`mb-2 pl-2.5 border-l-2 ${
                                            isCurrentUser ? 'border-black/35' : 'border-alpha'
                                        }`}
                                    >
                                        <Text
                                            className={`text-[11px] font-semibold ${
                                                isCurrentUser ? 'text-black/55' : 'text-alpha'
                                            }`}
                                            numberOfLines={1}
                                        >
                                            {replyPreview.sender_name || 'Reply'}
                                        </Text>
                                        <Text
                                            className={`text-[12px] ${
                                                isCurrentUser ? 'text-black/70' : 'text-black/60 dark:text-white/60'
                                            }`}
                                            numberOfLines={2}
                                        >
                                            {replyPreview.body || 'Message'}
                                        </Text>
                                    </View>
                                ) : null}
                                {postShare ? (
                                    <Pressable
                                        onPress={() => router.push(`/(tabs)/posts/${postShare.post_id}`)}
                                        className="overflow-hidden rounded-2xl bg-black/10"
                                    >
                                        {resolveImageUrl(postShare.image) ? (
                                            <Image
                                                source={{ uri: resolveImageUrl(postShare.image) }}
                                                className="w-full h-44"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View className="w-full h-28 items-center justify-center bg-black/10">
                                                <Ionicons name="image-outline" size={28} color={isCurrentUser ? '#111' : '#aaa'} />
                                            </View>
                                        )}
                                        <View className="p-3 gap-1">
                                            <Text
                                                className={`text-xs font-semibold ${isCurrentUser ? 'text-black/70' : 'text-white/70'}`}
                                                numberOfLines={1}
                                            >
                                                {postShare.author_name || 'Post'}
                                            </Text>
                                            <Text
                                                className={`text-sm font-semibold ${isCurrentUser ? 'text-black' : 'text-white'}`}
                                                numberOfLines={2}
                                            >
                                                {postShare.description || 'Shared a post'}
                                            </Text>
                                        </View>
                                    </Pressable>
                                ) : storyReply ? (
                                    <View className="overflow-hidden rounded-2xl bg-black/10">
                                        {resolveImageUrl(
                                            storyReply.image || storyReply.story_image || storyReply.thumbnail
                                        ) ? (
                                            <Image
                                                source={{
                                                    uri: resolveImageUrl(
                                                        storyReply.image ||
                                                            storyReply.story_image ||
                                                            storyReply.thumbnail
                                                    ),
                                                }}
                                                className="w-full h-40"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View className="w-full h-24 items-center justify-center bg-black/10">
                                                <Ionicons
                                                    name="sparkles-outline"
                                                    size={26}
                                                    color={isCurrentUser ? '#111' : '#aaa'}
                                                />
                                            </View>
                                        )}
                                        <View className="p-3 gap-1">
                                            <Text
                                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                                    isCurrentUser ? 'text-black/60' : 'text-white/55'
                                                }`}
                                            >
                                                Story reply
                                            </Text>
                                            <Text
                                                className={`text-sm font-semibold ${isCurrentUser ? 'text-black' : 'text-white'}`}
                                                numberOfLines={4}
                                            >
                                                {storyReply.text ||
                                                    storyReply.reply ||
                                                    storyReply.message ||
                                                    'Replied to a story'}
                                            </Text>
                                        </View>
                                    </View>
                                ) : message.body ? (
                                    <Text
                                        className={`text-[15px] leading-[21px] ${
                                            isCurrentUser ? 'text-black' : 'text-black dark:text-white'
                                        }`}
                                    >
                                        {message.body}
                                    </Text>
                                ) : null}

                                {message.attachment_type === 'image' && message.attachment_path && hasTextBody ? (
                                    <Pressable
                                        onPress={() =>
                                            onPreviewAttachment({
                                                type: 'image',
                                                path: message.attachment_url || message.attachment_path,
                                                name: message.attachment_name,
                                            })
                                        }
                                        className="mt-2 rounded-2xl overflow-hidden"
                                    >
                                        <Image
                                            source={{ uri: imageUrl, headers: authHeaders }}
                                            style={{ width: '100%', height: 220 }}
                                            resizeMode="cover"
                                        />
                                    </Pressable>
                                ) : null}

                                {isVideoAttachment && message.attachment_path && hasTextBody ? (
                                    <Pressable
                                        onPress={() =>
                                            onPreviewAttachment({
                                                type: 'video',
                                                path: message.attachment_url || message.attachment_path,
                                                name: message.attachment_name,
                                            })
                                        }
                                        className="mt-2 rounded-2xl overflow-hidden bg-black"
                                    >
                                        <View className="w-full h-48 items-center justify-center">
                                            <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                                                <Ionicons name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
                                            </View>
                                        </View>
                                    </Pressable>
                                ) : null}

                                {message.attachment_type === 'file' && message.attachment_path ? (
                                    <Pressable
                                        onPress={() =>
                                            onDownloadAttachment(
                                                message.attachment_url || message.attachment_path,
                                                message.attachment_name
                                            )
                                        }
                                        className={`mt-2 w-full flex-row items-center gap-3 p-3 rounded-2xl ${
                                            isCurrentUser ? 'bg-black/10' : 'bg-black/10 dark:bg-white/10'
                                        }`}
                                    >
                                        <View className="w-10 h-10 rounded-xl bg-alpha/25 items-center justify-center">
                                            <Ionicons name="document-text" size={20} color={isCurrentUser ? '#111' : '#ffc801'} />
                                        </View>
                                        <View className="flex-1 min-w-0">
                                            <Text
                                                className={`text-sm font-semibold ${isCurrentUser ? 'text-black' : 'text-black dark:text-white'}`}
                                                numberOfLines={1}
                                            >
                                                {message.attachment_name || 'Attachment'}
                                            </Text>
                                            {message.attachment_size ? (
                                                <Text
                                                    className={`text-[11px] mt-0.5 ${
                                                        isCurrentUser ? 'text-black/55' : 'text-black/50 dark:text-white/50'
                                                    }`}
                                                >
                                                    {formatFileSize(message.attachment_size)}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <Ionicons
                                            name="download-outline"
                                            size={18}
                                            color={isCurrentUser ? '#111' : '#ffc801'}
                                        />
                                    </Pressable>
                                ) : null}

                                {isAudioAttachment && message.attachment_path ? (
                                    <View className={hasTextBody ? 'mt-2' : ''}>
                                        <VoiceMessage
                                            audioUrl={imageUrl}
                                            duration={audioDuration[message.id] || message.audio_duration}
                                            isCurrentUser={isCurrentUser}
                                            headers={authHeaders}
                                        />
                                    </View>
                                ) : null}

                                {!isAudioOnly ? (
                                    <View className="flex-row items-center gap-1.5 justify-end mt-1.5">
                                        {isEdited ? (
                                            <Text
                                                className={`text-[11px] ${
                                                    isCurrentUser ? 'text-black/55' : 'text-black/40 dark:text-white/40'
                                                }`}
                                            >
                                                Edited
                                            </Text>
                                        ) : null}
                                        <Text
                                            className={`text-[11px] ${
                                                isCurrentUser ? 'text-black/60' : 'text-black/45 dark:text-white/45'
                                            }`}
                                        >
                                            {formatMessageTime(message.created_at)}
                                        </Text>
                                        {isCurrentUser ? (
                                            <View className="ml-0.5">
                                                {message.pending ? (
                                                    <Ionicons name="time-outline" size={12} color="#666" />
                                                ) : message.is_read && message.read_at ? (
                                                    <Ionicons name="checkmark-done" size={14} color="#3b82f6" />
                                                ) : (
                                                    <Ionicons name="checkmark" size={14} color="#666" />
                                                )}
                                            </View>
                                        ) : null}
                                    </View>
                                ) : null}
                            </View>
                            {isAudioOnly ? metaRow : null}
                        </Pressable>
                    )}
                    {reactions.length > 0 ? (
                        <View
                            className={`flex-row flex-wrap gap-1 mt-1 ${
                                isCurrentUser ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            {reactions.map((item) => (
                                <Pressable
                                    key={item.reaction}
                                    onPress={() => onReactToMessage?.(message, item.reaction)}
                                    className={`flex-row items-center px-2 py-0.5 rounded-full border ${
                                        message.my_reaction === item.reaction
                                            ? 'bg-alpha/25 border-alpha/50'
                                            : 'bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/10'
                                    }`}
                                >
                                    <Text className="text-[13px]">{item.reaction}</Text>
                                    {item.count > 1 ? (
                                        <Text className="ml-1 text-[11px] text-beta/60 dark:text-light/60">
                                            {item.count}
                                        </Text>
                                    ) : null}
                                </Pressable>
                            ))}
                        </View>
                    ) : null}
                </View>

                {isCurrentUser && (
                    <Pressable
                        onPress={() => router.push(`/students/${currentUser.id}`)}
                        className="ml-2 self-end mb-1"
                    >
                        {currentUser?.image ? (
                            <Image
                                source={{ uri: `${API.APP_URL}/storage/img/profile/${currentUser.image}` }}
                                className="w-7 h-7 rounded-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-7 h-7 rounded-full bg-alpha/30 items-center justify-center">
                                <Ionicons name="person" size={14} color="#444" />
                            </View>
                        )}
                    </Pressable>
                )}
            </View>
        </>
    );
}
