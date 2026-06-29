import { Modal, View, Text, Pressable, Linking } from 'react-native';
import { Home as LogoIcon } from '@/components/logo';
import { Colors } from '@/constants/Colors';

export default function ForceUpdateModal({ visible, updateUrl, remoteVersion }) {
    const handleUpdate = () => {
        if (!updateUrl) return;
        Linking.openURL(updateUrl).catch(() => {});
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
                        Update required
                    </Text>

                    <Text className="mt-3 text-center text-sm leading-5 text-beta/70 dark:text-light/70">
                        A new version of LionsGeek is available
                        {remoteVersion ? ` (${remoteVersion})` : ''}. Please update to continue using the app.
                    </Text>

                    <Pressable
                        onPress={handleUpdate}
                        className="mt-6 rounded-xl bg-alpha py-3.5 active:opacity-90"
                    >
                        <Text className="text-center text-base font-bold text-beta">Update now</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
