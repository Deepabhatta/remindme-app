import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder } from '../types';

// ─── Storage Keys ──────────────────────────────────────────────────────────────
const REMINDERS_KEY = '@reminders';

// ─── Notification Handler Configuration ────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Permission Request ─────────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permission not granted.');
    return false;
  }

  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
      sound: 'default',
      showBadge: true,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  return true;
}

// ─── Immediate "Reminder Set" Notification ──────────────────────────────────────
export async function sendImmediateNotification(reminderMessage: string): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Reminder Set',
      body: `"${reminderMessage}" — you'll be reminded in 30 seconds.`,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { type: 'immediate' },
    },
    trigger: null, // Fire immediately
  });
  return notificationId;
}

// ─── Scheduled "You have a reminder" Notification ──────────────────────────────
export async function scheduleReminderNotification(
  reminderId: string,
  reminderMessage: string,
  delaySeconds: number = 30
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 You have a reminder',
      body: 'Click to view it.',
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        type: 'reminder',
        reminderId,
        message: reminderMessage,
        screen: 'ReminderDetails',
      },
      // Android-specific extras
      ...(Platform.OS === 'android' && {
        channelId: 'reminders',
        sticky: false,
        autoDismiss: true,
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      repeats: false,
    },
  });
  return notificationId;
}

// ─── Cancel a notification ──────────────────────────────────────────────────────
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// ─── Storage: Save Reminder ─────────────────────────────────────────────────────
export async function saveReminder(reminder: Reminder): Promise<void> {
  const existing = await getAllReminders();
  const updated = [...existing.filter((r) => r.id !== reminder.id), reminder];
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
}

// ─── Storage: Get all reminders ─────────────────────────────────────────────────
export async function getAllReminders(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Storage: Get reminder by ID ────────────────────────────────────────────────
export async function getReminderById(id: string): Promise<Reminder | null> {
  const reminders = await getAllReminders();
  return reminders.find((r) => r.id === id) ?? null;
}

// ─── Storage: Update reminder status ────────────────────────────────────────────
export async function updateReminderStatus(
  id: string,
  status: Reminder['status']
): Promise<void> {
  const reminders = await getAllReminders();
  const updated = reminders.map((r) => (r.id === id ? { ...r, status } : r));
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
}

// ─── Generate unique ID ──────────────────────────────────────────────────────────
export function generateId(): string {
  return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
