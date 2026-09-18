import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Dimensions,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '@/context';
import API from '@/api';
import Skeleton from '@/components/ui/Skeleton';
import ScanResultOverlay from './ScanResultModal';
import { useHideTabBar } from '@/hooks/useHideTabBar';
import { Colors, getAccentFillColor, getAccentIconColor, getOnAccentTextColor, Overlays } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getEventDisplayName, hasEventPassed, mapValidationMessage, userCanScanEvent } from '@/utils/events';

const DUPLICATE_SCAN_MS = 2500;
const FRAME_SIZE = 260;
const CORNER_SIZE = 36;
const BORDER_WIDTH = 4;
const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

function buildScanResult(message, profile) {
  const status = mapValidationMessage(message);
  const visitorName = profile?.name?.trim() || null;
  const normalized = String(message || '').toLowerCase();

  if (status === 'success') {
    return {
      status: 'success',
      title: 'Check-in successful',
      message: visitorName ? `${visitorName} is registered for this event.` : message,
      visitorName,
    };
  }

  if (status === 'warning') {
    return {
      status: 'warning',
      title: 'Already checked in',
      message: visitorName ? `${visitorName} was already scanned for this event.` : message,
      visitorName,
    };
  }

  if (normalized.includes('another event')) {
    return {
      status: 'error',
      title: 'Wrong event',
      message: 'This visitor is registered for a different event.',
      visitorName,
    };
  }

  if (normalized.includes('no such participant')) {
    return {
      status: 'error',
      title: 'Not registered',
      message: 'This visitor is not registered for this event.',
      visitorName,
    };
  }

  return {
    status: 'error',
    title: 'Check-in failed',
    message: message || 'Could not validate this QR code.',
    visitorName,
  };
}

function ScanFrameCorner({ position, borderColor }) {
  const base = {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor,
  };

  const corners = {
    'top-left': { ...base, top: 0, left: 0, borderTopWidth: BORDER_WIDTH, borderLeftWidth: BORDER_WIDTH },
    'top-right': { ...base, top: 0, right: 0, borderTopWidth: BORDER_WIDTH, borderRightWidth: BORDER_WIDTH },
    'bottom-left': { ...base, bottom: 0, left: 0, borderBottomWidth: BORDER_WIDTH, borderLeftWidth: BORDER_WIDTH },
    'bottom-right': { ...base, bottom: 0, right: 0, borderBottomWidth: BORDER_WIDTH, borderRightWidth: BORDER_WIDTH },
  };

  return <View style={corners[position]} />;
}

export default function EventScanner() {
  useHideTabBar();
  const { user } = useAppContext();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const accentIcon = getAccentIconColor(isDark);
  const accentFill = getAccentFillColor(isDark);
  const onAccentText = getOnAccentTextColor(isDark);
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventData, setEventData] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventLoadError, setEventLoadError] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const scanLockRef = useRef(false);
  const lastScanRef = useRef({ data: null, at: 0 });

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        setEventLoading(false);
        setEventLoadError(true);
        return;
      }
      setEventLoading(true);
      setEventLoadError(false);
      try {
        const response = await API.getEvent(id);
        const event = response?.data?.event ?? null;
        setEventData(event);
        setEventTitle(getEventDisplayName(event?.name));
        if (!event) setEventLoadError(true);
      } catch {
        setEventData(null);
        setEventTitle('Event');
        setEventLoadError(true);
      } finally {
        setEventLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain !== false) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const scanAllowed = eventData ? userCanScanEvent(eventData, user) : false;

  const resetScanner = useCallback(() => {
    scanLockRef.current = false;
    setProcessing(false);
    lastScanRef.current = { data: null, at: 0 };
  }, []);

  const handleResultDismiss = useCallback(() => {
    setLastResult(null);
    resetScanner();
    if (id) {
      router.replace(`/(tabs)/events/${id}`);
    } else {
      router.back();
    }
  }, [id, resetScanner]);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      setLastResult(null);
      resetScanner();
      return () => setIsFocused(false);
    }, [resetScanner])
  );

  const showFailure = useCallback((title, message) => {
    setLastResult({ title, message, status: 'error', visitorName: null });
    setProcessing(false);
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanLockRef.current || processing || !id) return;

    const now = Date.now();
    if (lastScanRef.current.data === data && now - lastScanRef.current.at < DUPLICATE_SCAN_MS) {
      return;
    }

    scanLockRef.current = true;
    setProcessing(true);
    lastScanRef.current = { data, at: now };

    try {
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch {
        showFailure('Invalid QR code', 'This QR code is not a valid event invitation.');
        return;
      }

      if (!qrData.email || qrData.code === undefined) {
        showFailure('Invalid QR code', 'Missing visitor information in this QR code.');
        return;
      }

      const response = await API.validateEventInvitation({
        email: qrData.email,
        code: Number(qrData.code),
        id: Number(id),
      });

      const message = response?.data?.message || 'Scan processed.';
      const profile = response?.data?.profile;
      setLastResult(buildScanResult(message, profile));
    } catch (error) {
      if (__DEV__) {
        console.warn('[Scanner] validation failed:', error?.message);
      }
      showFailure('Error', 'Failed to validate QR code. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const scanPaused = processing || !!lastResult;
  const showCamera = Boolean(permission?.granted && isFocused && scanAllowed);

  const handlePermissionPress = async () => {
    if (permission?.canAskAgain === false) {
      await Linking.openSettings();
      return;
    }
    await requestPermission();
  };

  if (eventLoading || !permission) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.dark }]}>
        <Skeleton width={200} height={18} borderRadius={12} isDark />
      </View>
    );
  }

  if (eventLoadError || !eventData) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={64} color={accentIcon} />
        <Text style={styles.permissionTitle}>Could not load event</Text>
        <Text style={styles.permissionText}>Check your connection and try again.</Text>
        <Pressable onPress={() => router.back()} style={[styles.permissionButton, { backgroundColor: accentFill }]}>
          <Text style={[styles.permissionButtonText, { color: onAccentText }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!scanAllowed) {
    const eventEnded = hasEventPassed(eventData);
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={64} color={accentIcon} />
        <Text style={styles.permissionTitle}>{eventEnded ? 'Scan closed' : 'Scan not available'}</Text>
        <Text style={styles.permissionText}>
          {eventEnded
            ? 'QR scanning is closed after the event. Only admins can check in participants at this time.'
            : 'QR scanning is only available on the event day, before the event date and time.'}
        </Text>
        <Pressable onPress={() => router.back()} style={[styles.permissionButton, { backgroundColor: accentFill }]}>
          <Text style={[styles.permissionButtonText, { color: onAccentText }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-outline" size={64} color={accentIcon} />
        <Text style={styles.permissionTitle}>Camera permission required</Text>
        <Text style={styles.permissionText}>Allow camera access to scan visitor QR codes.</Text>
        <Pressable onPress={handlePermissionPress} style={[styles.permissionButton, { backgroundColor: accentFill }]}>
          <Text style={[styles.permissionButtonText, { color: onAccentText }]}>
            {permission.canAskAgain === false ? 'Open settings' : 'Grant permission'}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {showCamera ? (
        <CameraView
          style={styles.camera}
          facing="back"
          active={showCamera}
          onBarcodeScanned={scanPaused ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
      ) : null}

      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.light} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>SCANNING</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {eventTitle}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.scanFrame}>
          <ScanFrameCorner position="top-left" borderColor={accentFill} />
          <ScanFrameCorner position="top-right" borderColor={accentFill} />
          <ScanFrameCorner position="bottom-left" borderColor={accentFill} />
          <ScanFrameCorner position="bottom-right" borderColor={accentFill} />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]} pointerEvents="none">
        {processing ? (
          <View style={styles.processingRow}>
            <Skeleton width={22} height={22} borderRadius={11} isDark={false} />
            <Text style={styles.footerTitle}>Validating…</Text>
          </View>
        ) : (
          <>
            <Text style={styles.footerTitle}>Position the visitor QR code in the frame</Text>
            <Text style={styles.footerSub}>
              Registered visitors show success. Others show an error, then you return to event details.
            </Text>
          </>
        )}
      </View>

      <ScanResultOverlay visible={!!lastResult} result={lastResult} onDismiss={handleResultDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(250,250,250,0.7)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  frameWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerTitle: {
    color: Colors.light,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footerSub: {
    color: 'rgba(250,250,250,0.7)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: Colors.light,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.beta,
    marginTop: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: Overlays.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontWeight: '700',
  },
  backLink: {
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    color: Overlays.textMuted,
  },
});
