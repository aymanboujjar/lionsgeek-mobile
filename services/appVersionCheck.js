import Constants from 'expo-constants';
import API from '@/api';

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
    const updateUrl = String(payload.update_url ?? '').trim();

    const updateRequired =
        Boolean(updateUrl) &&
        Boolean(remoteVersion) &&
        remoteVersion !== localVersion;

    return { updateRequired, updateUrl, localVersion, remoteVersion };
}
