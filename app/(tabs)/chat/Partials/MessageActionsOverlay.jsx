import React, { useMemo } from 'react';
import {
    View,
    Text,
    Pressable,
    Modal,
    StyleSheet,
    ScrollView,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { isPlainTextMessage } from './MessageItem';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

function MenuRow({ icon, label, onPress, destructive = false, showChevron = false }) {
    const color = destructive ? '#ff6b7a' : '#f5f5f5';
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center px-4 py-[14px] active:opacity-70"
        >
            <Ionicons name={icon} size={22} color={color} />
            <Text
                style={{ color }}
                className="ml-3.5 text-[16px] font-normal flex-1"
            >
                {label}
            </Text>
            {showChevron ? (
                <Ionicons name="chevron-forward" size={18} color="#8e8e8e" />
            ) : null}
        </Pressable>
    );
}

/**
 * Instagram-style long-press overlay: reactions + action sheet around the message.
 */
export default function MessageActionsOverlay({
    visible,
    message,
    isCurrentUser,
    canEdit,
    onClose,
    onReply,
    onForward,
    onCopy,
    onEdit,
    onDelete,
    onReact,
    previewContent,
}) {
    const timeLabel = useMemo(() => {
        if (!message?.created_at) return '';
        try {
            return format(new Date(message.created_at), 'HH:mm');
        } catch {
            return '';
        }
    }, [message?.created_at]);

    if (!visible || !message) return null;

    const canCopy = Boolean(
        message.body
        && !String(message.body).trim().startsWith('{')
    ) || isPlainTextMessage(message);

    const myReaction = message.my_reaction;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.root}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, styles.androidScrim]} />
                    )}
                </Pressable>

                <View
                    pointerEvents="box-none"
                    style={[
                        styles.content,
                        isCurrentUser ? styles.alignEnd : styles.alignStart,
                    ]}
                >
                    {/* Reaction pill */}
                    <View style={styles.reactionBar}>
                        {QUICK_REACTIONS.map((emoji) => {
                            const selected = myReaction === emoji;
                            return (
                                <Pressable
                                    key={emoji}
                                    onPress={() => onReact?.(emoji)}
                                    style={[styles.reactionBtn, selected && styles.reactionSelected]}
                                    hitSlop={6}
                                >
                                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                                </Pressable>
                            );
                        })}
                        <Pressable
                            onPress={() => onReact?.('➕')}
                            style={styles.reactionBtn}
                            hitSlop={6}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                        </Pressable>
                    </View>

                    {/* Highlighted message preview */}
                    <View
                        style={[
                            styles.bubbleWrap,
                            isCurrentUser ? styles.bubbleOwn : styles.bubbleOther,
                        ]}
                    >
                        {previewContent}
                    </View>

                    {/* Actions menu */}
                    <View style={[styles.menu, isCurrentUser ? styles.menuOwn : styles.menuOther]}>
                        {timeLabel ? (
                            <Text style={styles.timeLabel}>{timeLabel}</Text>
                        ) : null}

                        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                            <MenuRow
                                icon="arrow-undo-outline"
                                label="Reply"
                                onPress={() => {
                                    onClose();
                                    onReply?.(message);
                                }}
                            />
                            <MenuRow
                                icon="paper-plane-outline"
                                label="Forward"
                                onPress={() => {
                                    onClose();
                                    onForward?.(message);
                                }}
                            />
                            {canCopy ? (
                                <MenuRow
                                    icon="copy-outline"
                                    label="Copy"
                                    onPress={() => {
                                        onClose();
                                        onCopy?.(message);
                                    }}
                                />
                            ) : null}
                            {canEdit ? (
                                <MenuRow
                                    icon="pencil-outline"
                                    label="Edit"
                                    onPress={() => {
                                        onClose();
                                        onEdit?.(message);
                                    }}
                                />
                            ) : null}
                            {isCurrentUser ? (
                                <MenuRow
                                    icon="trash-outline"
                                    label="Delete"
                                    destructive
                                    onPress={() => {
                                        onClose();
                                        onDelete?.(message);
                                    }}
                                />
                            ) : null}
                        </ScrollView>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 18,
    },
    androidScrim: {
        backgroundColor: 'rgba(0,0,0,0.72)',
    },
    content: {
        width: '100%',
        maxWidth: 360,
        alignSelf: 'center',
        gap: 10,
    },
    alignEnd: {
        alignItems: 'flex-end',
    },
    alignStart: {
        alignItems: 'flex-start',
    },
    reactionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(28,28,28,0.94)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 2,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    reactionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reactionSelected: {
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    reactionEmoji: {
        fontSize: 22,
    },
    bubbleWrap: {
        maxWidth: '92%',
        borderRadius: 22,
        overflow: 'hidden',
    },
    bubbleOwn: {
        backgroundColor: '#ffc801',
        alignSelf: 'flex-end',
    },
    bubbleOther: {
        backgroundColor: '#2c2c2c',
        alignSelf: 'flex-start',
    },
    menu: {
        width: 250,
        maxHeight: 360,
        backgroundColor: 'rgba(32,32,32,0.96)',
        borderRadius: 18,
        paddingVertical: 6,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    menuOwn: {
        alignSelf: 'flex-end',
    },
    menuOther: {
        alignSelf: 'flex-start',
    },
    timeLabel: {
        color: '#8e8e8e',
        fontSize: 12,
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 4,
    },
});
