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

export async function checkAppVersion() {
    if (shouldSkipVersionCheck()) {
        return { updateRequired: false };
    }

    const localVersion = (Constants.expoConfig?.version ?? '0.0.0').trim();

    const response = await API.getPublic('mobile/app-version');
    const payload = response?.data ?? {};
    const remoteVersion = String(payload.version ?? '').trim();
    const updateUrl = resolveStoreUpdateUrl(payload);

    const updateRequired =
        Boolean(remoteVersion) &&
        remoteVersion !== localVersion &&
        Boolean(updateUrl);

    return { updateRequired, updateUrl, localVersion, remoteVersion };
}
