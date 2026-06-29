import { Platform } from 'react-native';

export function isIOS() {
    return Platform.OS === 'ios';
}

export function isAndroid() {
    return Platform.OS === 'android';
}

export function resolveStoreUpdateUrl(stores) {
    const appStoreUrl = String(stores?.app_store_url ?? '').trim();
    const playStoreUrl = String(stores?.play_store_url ?? '').trim();

    if (isIOS()) {
        return appStoreUrl || null;
    }
    if (isAndroid()) {
        return playStoreUrl || null;
    }

    return appStoreUrl || playStoreUrl || null;
}
