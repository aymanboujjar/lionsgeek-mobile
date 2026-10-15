import { Modal, View, Text, Pressable, Linking } from 'react-native';
import { Home as LogoIcon } from '@/components/logo';
import { Colors } from '@/constants/Colors';

function isSafeActionUrl(url) {
    const value = String(url ?? '').trim();
    return /^https:\/\/\S+$/i.test(value) || /^mailto:[^\s]+$/i.test(value);
}

export default function AppAccessModal({ visible, title, message, buttonLabel, buttonUrl }) {
    const label = String(buttonLabel ?? '').trim();
    const url = String(buttonUrl ?? '').trim();
    const showButton = label !== '' && isSafeActionUrl(url);

    const openAction = () => {
        if (!showButton) return;
        Linking.openURL(url).catch(() => {});
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
        >
            <View className="flex-1 items-center justify-center bg-beta/80 px-6">
                <View className="w-full max-w-sm rounded-2xl border border-card_border bg-light p-6 dark:bg-dark">
                    <View className="mb-4 items-center">
                        <LogoIcon color={Colors.alpha} width={64} height={64} />
                    </View>

                    <Text className="text-center text-xl font-bold text-beta dark:text-light">
                        {title}
                    </Text>

                    <Text className="mt-3 text-center text-sm leading-5 text-beta/70 dark:text-light/70">
                        {message}
                    </Text>

                    {showButton ? (
                        <Pressable
                            onPress={openAction}
                            className="mt-6 rounded-xl bg-alpha py-3.5 active:opacity-90"
                        >
                            <Text className="text-center text-base font-bold text-beta">{label}</Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}
