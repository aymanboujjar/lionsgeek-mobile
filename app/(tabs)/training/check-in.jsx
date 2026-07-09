import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '@/components/layout/AppLayout';
import { useAppContext } from '@/context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import Skeleton from '@/components/ui/Skeleton';
import {
  CHECKIN_RESTRICTED_FALLBACK,
  CHECKIN_UNAVAILABLE_BANNER,
  CHECKIN_UNAVAILABLE_MESSAGE,
  CHECKIN_UNAVAILABLE_TITLE,
  NETWORK_RESTRICTED_FALLBACK,
  checkAttendanceNetwork,
  deriveButtonUi,
  fetchSlotStatus,
  formatCheckInSuccessMessage,
  getApiMessage,
  isStaffUser,
  isStudentUser,
  submitCheckIn,
} from '@/components/training/attendanceCheckIn';

const SLOT_STATUS_POLL_MS = 60_000;

export default function AttendanceCheckIn() {
  const router = useRouter();
  const { token, user } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formationId = user?.formation_id != null ? Number(user.formation_id) : null;
  const pollRef = useRef(null);

  const [slotStatus, setSlotStatus] = useState(null);
  const [slotLoading, setSlotLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [networkMessage, setNetworkMessage] = useState('');

  const buttonUi = useMemo(() => deriveButtonUi(slotStatus), [slotStatus]);

  const refreshSlotStatus = useCallback(async () => {
    if (!token || !formationId || !isStudentUser(user)) return;
    try {
      const data = await fetchSlotStatus(token, formationId);
      setSlotStatus(data);
    } catch (error) {
      console.error('[CHECK-IN] slot-status error:', error);
    } finally {
      setSlotLoading(false);
    }
  }, [token, formationId, user]);

  const checkNetwork = useCallback(async () => {
    if (!token || isStaffUser(user)) {
      setNetworkStatus(null);
      setNetworkMessage('');
      return;
    }

    setNetworkStatus('checking');
    try {
      await checkAttendanceNetwork(token);
      setNetworkStatus('ok');
      setNetworkMessage('');
    } catch (err) {
      if (err?.response?.status === 403) {
        setNetworkStatus('restricted');
        setNetworkMessage(getApiMessage(err, NETWORK_RESTRICTED_FALLBACK));
      } else if (err?.response?.status === 503) {
        setNetworkStatus('unavailable');
        setNetworkMessage(CHECKIN_UNAVAILABLE_BANNER);
      } else {
        setNetworkStatus(null);
        setNetworkMessage('');
      }
    }
  }, [token, user]);

  useFocusEffect(
    useCallback(() => {
      checkNetwork();
      refreshSlotStatus();
    }, [checkNetwork, refreshSlotStatus]),
  );

  useEffect(() => {
    if (!token || !formationId || !isStudentUser(user)) return undefined;

    pollRef.current = setInterval(refreshSlotStatus, SLOT_STATUS_POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token, formationId, user, refreshSlotStatus]);

  const handleCheckInRestricted = useCallback(
    (error) => {
      const message = getApiMessage(error, CHECKIN_RESTRICTED_FALLBACK);
      Alert.alert('Cannot Check In', message, [
        { text: 'OK' },
        {
          text: 'Retry',
          onPress: async () => {
            if (!token || !slotStatus?.attendance_day || !formationId) return;
            setCheckingIn(true);
            try {
              await checkAttendanceNetwork(token);
              setNetworkStatus('ok');
              setNetworkMessage('');
              const data = await submitCheckIn(token, {
                formation_id: formationId,
                attendance_day: slotStatus.attendance_day,
              });
              Alert.alert('Attendance Marked', formatCheckInSuccessMessage(data));
              await refreshSlotStatus();
            } catch (retryError) {
              if (retryError?.response?.status === 403) {
                handleCheckInRestricted(retryError);
              } else if (retryError?.response?.status === 503) {
                Alert.alert(CHECKIN_UNAVAILABLE_TITLE, CHECKIN_UNAVAILABLE_MESSAGE);
              } else if (retryError?.response?.status === 409 || retryError?.response?.status === 422) {
                await refreshSlotStatus();
              } else {
                Alert.alert('Error', 'Failed to mark attendance. Please try again.');
              }
            } finally {
              setCheckingIn(false);
            }
          },
        },
      ]);
    },
    [token, slotStatus, formationId, refreshSlotStatus],
  );

  const handleCheckIn = useCallback(async () => {
    if (!token || !formationId || !slotStatus?.attendance_day || checkingIn || !buttonUi.actionable) {
      return;
    }

    setCheckingIn(true);
    try {
      const data = await submitCheckIn(token, {
        formation_id: formationId,
        attendance_day: slotStatus.attendance_day,
      });
      Alert.alert('Attendance Marked', formatCheckInSuccessMessage(data));
      await refreshSlotStatus();
    } catch (error) {
      const status = error?.response?.status;
      if (status === 403) {
        handleCheckInRestricted(error);
      } else if (status === 503) {
        Alert.alert(CHECKIN_UNAVAILABLE_TITLE, CHECKIN_UNAVAILABLE_MESSAGE);
      } else if (status === 409) {
        await refreshSlotStatus();
        Alert.alert('Already Marked', getApiMessage(error, 'You have already marked attendance for this slot.'));
      } else if (status === 422) {
        await refreshSlotStatus();
        Alert.alert('No Active Slot', getApiMessage(error, 'There is no active attendance slot right now.'));
      } else {
        console.error('[CHECK-IN] check-in error:', error);
        Alert.alert('Error', 'Failed to mark attendance. Please try again.');
      }
    } finally {
      setCheckingIn(false);
    }
  }, [
    token,
    formationId,
    slotStatus,
    checkingIn,
    buttonUi.actionable,
    refreshSlotStatus,
    handleCheckInRestricted,
  ]);

  if (isStaffUser(user)) {
    return (
      <AppLayout>
        <View style={styles.centered(isDark)}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.alpha} />
          <Text style={styles.title(isDark)}>Student check-in only</Text>
          <Text style={styles.subtitle(isDark)}>
            Attendance check-in is available to enrolled students.
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </AppLayout>
    );
  }

  if (!formationId) {
    return (
      <AppLayout>
        <View style={styles.centered(isDark)}>
          <Ionicons name="school-outline" size={48} color={Colors.alpha} />
          <Text style={styles.title(isDark)}>No training enrolled</Text>
          <Text style={styles.subtitle(isDark)}>
            You need an active training enrollment to check in. Contact staff if this looks wrong.
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <View style={styles.screen(isDark)}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton(isDark)} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={isDark ? Colors.light : Colors.beta} />
          </Pressable>
          <Text style={styles.headerTitle(isDark)}>Mark attendance</Text>
          <View style={{ width: 40 }} />
        </View>

        {networkStatus === 'restricted' && (
          <View style={styles.networkBannerRestricted}>
            <Ionicons name="wifi-outline" size={18} color={Colors.light} />
            <Text style={styles.networkBannerText}>{networkMessage}</Text>
            <Pressable onPress={checkNetwork} style={styles.networkBannerAction}>
              <Text style={styles.networkBannerActionText}>Check again</Text>
            </Pressable>
          </View>
        )}

        {networkStatus === 'unavailable' && (
          <View style={styles.networkBannerUnavailable}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.light} />
            <Text style={styles.networkBannerText}>{networkMessage}</Text>
          </View>
        )}

        {networkStatus === 'ok' && (
          <View style={styles.networkBannerOk(isDark)}>
            <Ionicons name="wifi" size={16} color={Colors.good} />
            <Text style={styles.networkBannerOkText}>On school WiFi</Text>
          </View>
        )}

        {buttonUi.showReminderBanner ? (
          <View style={styles.reminderBanner}>
            <Ionicons name="notifications-outline" size={18} color={Colors.beta} />
            <Text style={styles.reminderBannerText}>{buttonUi.reminderBannerText}</Text>
          </View>
        ) : null}

        <View style={styles.content}>
          {slotLoading && !slotStatus ? (
            <View style={styles.loadingBlock}>
              <Skeleton width={280} height={56} borderRadius={16} isDark={isDark} />
              <View style={{ height: 16 }} />
              <Skeleton width={220} height={14} borderRadius={10} isDark={isDark} />
            </View>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.checkInButton,
                  buttonUi.disabled && styles.checkInButtonDisabled,
                  pressed && !buttonUi.disabled && !checkingIn && styles.checkInButtonPressed,
                ]}
                onPress={handleCheckIn}
                disabled={buttonUi.disabled || checkingIn}
              >
                {checkingIn ? (
                  <ActivityIndicator color={Colors.light} />
                ) : (
                  <>
                    <Ionicons
                      name={buttonUi.disabled ? 'checkmark-circle-outline' : 'finger-print-outline'}
                      size={28}
                      color={Colors.light}
                    />
                    <Text style={styles.checkInButtonText}>{buttonUi.label}</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.helperText(isDark)}>
                Attendance timing is managed by the server. Connect to school WiFi before checking in.
              </Text>
            </>
          )}
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  screen: (isDark) => ({
    flex: 1,
    backgroundColor: isDark ? Colors.dark : Colors.light,
  }),
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: (isDark) => ({
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? Colors.dark_gray : Colors.light,
    borderWidth: 1,
    borderColor: isDark ? Colors.dark : Colors.dark_gray,
  }),
  headerTitle: (isDark) => ({
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? Colors.light : Colors.beta,
  }),
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  loadingBlock: {
    alignItems: 'center',
    width: '100%',
  },
  checkInButton: {
    width: '100%',
    maxWidth: 340,
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: Colors.alpha,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: Colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  checkInButtonDisabled: {
    backgroundColor: '#8a8a8a',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkInButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  checkInButtonText: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.light,
    textAlign: 'center',
  },
  helperText: (isDark) => ({
    marginTop: 20,
    maxWidth: 320,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: isDark ? Colors.light + '99' : Colors.beta + '99',
  }),
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.alpha,
  },
  reminderBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.beta,
    lineHeight: 20,
  },
  networkBannerRestricted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 152, 0, 0.92)',
  },
  networkBannerUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(80, 80, 80, 0.92)',
  },
  networkBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light,
    lineHeight: 18,
  },
  networkBannerAction: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  networkBannerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light,
  },
  networkBannerOk: (isDark) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: isDark ? Colors.dark_gray : Colors.light,
    borderWidth: 1,
    borderColor: Colors.good + '55',
  }),
  networkBannerOkText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.good,
  },
  centered: (isDark) => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: isDark ? Colors.dark : Colors.light,
  }),
  title: (isDark) => ({
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    color: isDark ? Colors.light : Colors.beta,
    textAlign: 'center',
  }),
  subtitle: (isDark) => ({
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: isDark ? Colors.light + '99' : Colors.beta + '99',
    textAlign: 'center',
  }),
  secondaryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.alpha,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.alpha,
  },
});
