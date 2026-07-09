import API from '@/api';
import { getUserRolesNormalized } from '@/components/helpers/helpers';

export const STAFF_ROLES = ['admin', 'super_admin', 'coach', 'moderateur', 'studio_responsable'];

export const NETWORK_RESTRICTED_FALLBACK =
  "You're not on school WiFi. Connect to school WiFi to check in.";
export const CHECKIN_RESTRICTED_FALLBACK = 'Connect to school WiFi to check in, then try again.';
export const CHECKIN_UNAVAILABLE_TITLE = 'Check-In Unavailable';
export const CHECKIN_UNAVAILABLE_MESSAGE =
  'Attendance check-in is temporarily unavailable. Please contact a staff member.';
export const CHECKIN_UNAVAILABLE_BANNER =
  'Attendance check-in is temporarily unavailable. Contact staff.';

export const SLOT_ACTION_LABELS = {
  morning: 'Morning attendance',
  lunch: 'Mark post-coffee-break attendance',
  evening: 'Lunch attendance',
};

export const SLOT_SHORT_LABELS = {
  morning: 'Morning',
  lunch: 'Coffee break',
  evening: 'Lunch',
};

export function getApiMessage(error, fallback) {
  const message = error?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

export function isStaffUser(user) {
  const roles = getUserRolesNormalized(user);
  return roles.some((role) => STAFF_ROLES.includes(role));
}

export function isStudentUser(user) {
  return Boolean(user && !isStaffUser(user));
}

export function getSlotActionLabel(slot) {
  if (!slot) return 'Mark attendance';
  return SLOT_ACTION_LABELS[slot] ?? 'Mark attendance';
}

export function getSlotShortLabel(slot) {
  if (!slot) return 'Attendance';
  return SLOT_SHORT_LABELS[slot] ?? String(slot);
}

export const PRESENT_WINDOW_MINUTES = 15;

export function getReminderSlotKey(slotStatus) {
  const slot = slotStatus?.current_slot;
  const day = slotStatus?.attendance_day;
  if (!slot || !day) return null;
  return `${slot}-${day}`;
}

/** Present vs late sub-phase within an active slot (derived from minutes_into_slot). */
export function getAttendanceReminderPhase(slotStatus) {
  const { minutes_into_slot } = slotStatus ?? {};
  if (typeof minutes_into_slot !== 'number' || minutes_into_slot < 0) return null;
  return minutes_into_slot < PRESENT_WINDOW_MINUTES ? 'present' : 'late';
}

/** Per-slot-per-phase dismiss key, e.g. morning-2026-07-01-present. */
export function getReminderDismissKey(slotStatus) {
  const slotKey = getReminderSlotKey(slotStatus);
  const phase = getAttendanceReminderPhase(slotStatus);
  if (!slotKey || !phase) return null;
  return `${slotKey}-${phase}`;
}

/** Single source of truth for reminder banner visibility (full active slot, unmarked). */
export function shouldShowAttendanceReminder(slotStatus) {
  if (!slotStatus) return false;

  const { phase, current_slot, already_marked_slots = [] } = slotStatus;
  const normalizedPhase = String(phase ?? '').replace(/-/g, '_');
  if (normalizedPhase !== 'active' || !current_slot) return false;

  const marked = Array.isArray(already_marked_slots) ? already_marked_slots : [];
  if (marked.includes(current_slot)) return false;

  return getAttendanceReminderPhase(slotStatus) != null;
}

export function shouldShowReminderBanner(slotStatus, dismissedDismissKey) {
  if (!shouldShowAttendanceReminder(slotStatus)) return false;
  const dismissKey = getReminderDismissKey(slotStatus);
  if (!dismissKey || dismissedDismissKey === dismissKey) return false;
  return true;
}

export function getAttendanceReminderBannerText(slotStatus) {
  const slot = slotStatus?.current_slot;
  if (!slot) return '';

  const label = getSlotShortLabel(slot);
  const reminderPhase = getAttendanceReminderPhase(slotStatus);

  if (reminderPhase === 'present') {
    return `${label} attendance is open — tap to mark your presence.`;
  }
  if (reminderPhase === 'late') {
    return `You're late for ${label} — tap to mark before the window closes.`;
  }
  return '';
}

export function deriveButtonUi(slotStatus) {
  if (!slotStatus) {
    return {
      label: 'Loading…',
      disabled: true,
      showReminderBanner: false,
      reminderBannerText: '',
      actionable: false,
    };
  }

  const {
    phase,
    current_slot,
    next_slot,
    upcoming_slot,
    already_marked_slots = [],
  } = slotStatus;
  const normalizedPhase = String(phase ?? '').replace(/-/g, '_');
  const marked = Array.isArray(already_marked_slots) ? already_marked_slots : [];
  const currentMarked = current_slot && marked.includes(current_slot);
  const upcomingSlot = next_slot ?? upcoming_slot;

  if (normalizedPhase === 'out_of_hours') {
    return {
      label: 'No attendance to mark right now',
      disabled: true,
      showReminderBanner: false,
      reminderBannerText: '',
      actionable: false,
    };
  }

  if (normalizedPhase === 'gap') {
    return {
      label: getSlotActionLabel(upcomingSlot),
      disabled: true,
      showReminderBanner: false,
      reminderBannerText: '',
      actionable: false,
    };
  }

  if (normalizedPhase === 'active' && current_slot) {
    if (currentMarked) {
      return {
        label: `${getSlotShortLabel(current_slot)} Marked ✓`,
        disabled: true,
        showReminderBanner: false,
        reminderBannerText: '',
        actionable: false,
      };
    }

    const showReminderBanner = shouldShowAttendanceReminder(slotStatus);

    return {
      label: getSlotActionLabel(current_slot),
      disabled: false,
      showReminderBanner,
      reminderBannerText: showReminderBanner ? getAttendanceReminderBannerText(slotStatus) : '',
      actionable: true,
    };
  }

  return {
    label: 'No attendance to mark right now',
    disabled: true,
    showReminderBanner: false,
    reminderBannerText: '',
    actionable: false,
  };
}

export function formatCheckInSuccessMessage(data) {
  const slot = data?.slot ?? data?.current_slot;
  const status = data?.status;
  const slotName = getSlotShortLabel(slot);
  const statusWord =
    status === 'present' ? 'Present' : status === 'late' ? 'Late' : status === 'absent' ? 'Absent' : null;

  if (statusWord && slotName) {
    return `You have been marked as ${statusWord} for the ${slotName} period.`;
  }
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  return 'Your attendance has been marked successfully.';
}

export async function fetchSlotStatus(token, formationId) {
  const response = await API.getWithAuth(
    `mobile/attendance/slot-status?formation_id=${encodeURIComponent(String(formationId))}`,
    token,
  );
  return response?.data ?? null;
}

export async function submitCheckIn(token, { formation_id, attendance_day }) {
  const response = await API.postWithAuth(
    'mobile/attendance/check-in',
    { formation_id, attendance_day },
    token,
  );
  return response?.data ?? null;
}

export async function checkAttendanceNetwork(token) {
  await API.getWithAuth('mobile/attendance/network-check', token);
}
