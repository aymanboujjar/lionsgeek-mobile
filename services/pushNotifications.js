import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import API from '@/api';

/**
 * Remote push via expo-notifications was removed from Expo Go (Android) in SDK 53+.
 * Never import/require expo-notifications while running inside Expo Go.
 */
export function isPushNotificationsAvailable() {
  return Constants.appOwnership !== 'expo';
}

function loadNotifications() {
  if (!isPushNotificationsAvailable()) {
    return null;
  }
  // Lazy require so Expo Go never evaluates the native module at import time.
  // eslint-disable-next-line global-require
  return require('expo-notifications');
}

let notificationHandlerConfigured = false;

function ensureNotificationHandler(Notifications) {
  if (!Notifications || notificationHandlerConfigured) return;
  notificationHandlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions and get Expo push token.
 * Physical devices + development/production builds only (not Expo Go).
 */
export async function registerForPushNotificationsAsync() {
  const Notifications = loadNotifications();
  if (!Notifications) {
    return null;
  }

  ensureNotificationHandler(Notifications);
  let token = null;

  if (!Device.isDevice) {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification! Permission denied.');
      return null;
    }

    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId ??
      '0d0c0c8d-a116-439d-8892-5965ec3f1841';

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    token = tokenData.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      await Notifications.setNotificationChannelAsync('incoming-calls', {
        name: 'Incoming voice calls',
        description: 'Persistent ringing notifications for incoming calls.',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
        lightColor: '#22c55e',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        // Omit `sound` so Android uses the system default.
        // `sound: 'default'` is treated as a custom file and throws in SDK 57.
        enableVibrate: true,
        showBadge: false,
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Send Expo push token to backend
 */
export async function sendPushTokenToBackend(token, authToken) {
  if (!token || !authToken) {
    console.warn('Cannot send push token: missing token or auth token');
    return false;
  }

  try {
    const response = await API.post('mobile/push-token', {
      expo_push_token: token,
    }, authToken);

    return response?.data?.success === true;
  } catch (error) {
    if (__DEV__) {
      console.error('Error sending push token to backend:', error?.response?.data || error?.message);
    }
    return false;
  }
}

/**
 * Setup notification listeners (tap + cold start).
 * Navigation uses expo-router — no React Navigation ref required.
 */
export function setupNotificationListeners() {
  const Notifications = loadNotifications();
  if (!Notifications) {
    return {
      notificationListener: null,
      responseListener: null,
    };
  }

  ensureNotificationHandler(Notifications);
  const notificationListener = Notifications.addNotificationReceivedListener(() => {});

  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response?.notification?.request?.content?.data;
    if (data) {
      handleNotificationNavigation(data);
    }
  });

  // App opened from a killed state via notification tap.
  Notifications.getLastNotificationResponseAsync?.()
    .then((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data) {
        handleNotificationNavigation(data);
      }
    })
    .catch(() => {});

  return {
    notificationListener,
    responseListener,
  };
}

/**
 * Handle navigation based on notification data
 */
export function handleNotificationNavigation(data) {
  if (!data) return;

  try {
    import('expo-router').then(({ router }) => {
      const {
        type,
        link,
        mobile_link,
        post_id,
        project_id,
        sender_id,
        follower_id,
        conversation_id,
        other_user_id,
        user_id,
        event_id,
      } = data;

      const targetLink = mobile_link || link;

      if (typeof targetLink === 'string' && targetLink.length > 0) {
        if (targetLink.startsWith('/events/')) {
          const id = targetLink.split('/')[2];
          if (id) {
            router.push(`/(tabs)/events/${id}`);
            return;
          }
        }
        if (targetLink.startsWith('/posts/')) {
          router.push(`/(tabs)${targetLink}`);
          return;
        }
        if (targetLink.startsWith('/profile/')) {
          const id = targetLink.split('/')[2];
          if (id) {
            router.push({ pathname: '/(tabs)/profile', params: { userId: String(id) } });
            return;
          }
        }
        if (targetLink.includes('reservations') || targetLink.startsWith('/admin/reservations')) {
          router.push('/(tabs)/reservations');
          return;
        }
        if (targetLink.includes('appointments') || targetLink.startsWith('/admin/appointments')) {
          router.push('/(tabs)/reservations');
          return;
        }
      }

      switch (type) {
        case 'post_interaction':
          if (post_id) {
            router.push(`/(tabs)/posts/${post_id}`);
          } else {
            router.push('/(tabs)/home');
          }
          break;

        case 'follow': {
          const profileId = follower_id || user_id || sender_id;
          if (profileId) {
            router.push({ pathname: '/(tabs)/profile', params: { userId: String(profileId) } });
          } else {
            router.push('/(tabs)/profile');
          }
          break;
        }

        case 'project_status':
        case 'project_submission':
        case 'task_assignment':
        case 'project_message':
          router.push('/(tabs)/projects-hub');
          break;

        case 'chat_message': {
          const peerId = other_user_id || sender_id;
          if (peerId) {
            router.push(`/(tabs)/chat/${peerId}`);
          } else {
            router.push('/(tabs)/chat');
          }
          break;
        }

        case 'reservation':
        case 'appointment':
        case 'access_request_response':
          router.push('/(tabs)/reservations');
          break;

        case 'exercise_review':
          router.push('/(tabs)/training');
          break;

        case 'discipline_change':
          router.push('/(tabs)/profile');
          break;

        case 'announcement':
          router.push('/(tabs)/notifications');
          break;

        case 'attendance_reminder':
          router.push('/(tabs)/training/check-in');
          break;

        case 'event':
          if (event_id) {
            router.push(`/(tabs)/events/${event_id}`);
          } else {
            router.push('/(tabs)/events');
          }
          break;

        default:
          router.push('/(tabs)/notifications');
          break;
      }
    });
  } catch (error) {
    console.error('Error handling notification navigation:', error);
  }
}

/**
 * Remove notification listeners
 */
export function removeNotificationListeners(listeners) {
  if (listeners?.notificationListener) {
    listeners.notificationListener.remove();
  }
  if (listeners?.responseListener) {
    listeners.responseListener.remove();
  }
}
