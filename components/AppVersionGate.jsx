import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import ForceUpdateModal from '@/components/ForceUpdateModal';
import { checkAppVersion } from '@/services/appVersionCheck';

export default function AppVersionGate({ children }) {
    const [blocked, setBlocked] = useState(false);
    const [updateUrl, setUpdateUrl] = useState('');
    const [remoteVersion, setRemoteVersion] = useState('');

    const runCheck = useCallback(async () => {
        try {
            const result = await checkAppVersion();
            if (result.updateRequired) {
                setUpdateUrl(result.updateUrl);
                setRemoteVersion(result.remoteVersion ?? '');
                setBlocked(true);
                return;
            }
            setBlocked(false);
            setUpdateUrl('');
            setRemoteVersion('');
        } catch (error) {
            console.warn('[AppVersionGate] version check failed:', error?.message ?? error);
        }
    }, []);

    useEffect(() => {
        runCheck();
    }, [runCheck]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                runCheck();
            }
        });
        return () => subscription.remove();
    }, [runCheck]);

    return (
        <>
            {children}
            <ForceUpdateModal
                visible={blocked}
                updateUrl={updateUrl}
                remoteVersion={remoteVersion}
            />
        </>
    );
}
