import Constants from 'expo-constants';
import API from '@/api';
import { resolveStoreUpdateUrl } from '@/utils/platform';

const shouldSkipVersionCheck = () => {
    const testFlag = process.env.EXPO_PUBLIC_TEST_VERSION_CHECK === 'true';
    if (testFlag) {
        return false;
    }
    return Constants.appOwnership === 'expo';
};

function isSafeActionUrl(url) {
    const value = String(url ?? '').trim();
    return /^https:\/\/\S+$/i.test(value) || /^mailto:[^\s]+$/i.test(value);
}

export async function checkAppVersion() {
    const skipStoreUpdate = shouldSkipVersionCheck();

    const localVersion = (Constants.expoConfig?.version ?? '0.0.0').trim();

    const response = await API.getPublic('mobile/app-version');
    const payload = response?.data ?? {};
    const remoteVersion = String(payload.version ?? '').trim();
    const updateUrl = resolveStoreUpdateUrl(payload);
    const blockMode = payload.block_mode === 'modal' ? 'modal' : 'version';
    const modal = payload.modal ?? {};
    const title = String(modal.title ?? '').trim();
    const message = String(modal.message ?? '').trim();
    const buttonLabel = String(modal.button_label ?? '').trim();
    const buttonUrl = String(modal.button_url ?? '').trim();
    const accessBlocked = blockMode === 'modal' && title !== '' && message !== '';

    const updateRequired =
        !skipStoreUpdate &&
        blockMode === 'version' &&
        Boolean(remoteVersion) &&
        remoteVersion !== localVersion &&
        Boolean(updateUrl);

    return {
        updateRequired,
        updateUrl,
        localVersion,
        remoteVersion,
        accessBlocked,
        access: {
            title,
            message,
            buttonLabel: isSafeActionUrl(buttonUrl) ? buttonLabel : '',
            buttonUrl: isSafeActionUrl(buttonUrl) ? buttonUrl : '',
        },
    };
}
