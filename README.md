# 🔔 RemindMe — Cross-Platform Reminder Application

A production-grade cross-platform reminder application built with **React Native (Expo)** that supports both **Android** and **iOS**. Demonstrates real device push notifications, background scheduling, app lifecycle handling, and deep linking navigation.

---

## 📱 Features

| Feature | Status |
|---|---|
| Create reminder with message input | ✅ |
| Immediate "Reminder Set" notification | ✅ |
| 30-second background notification (even when app is killed) | ✅ |
| Notification tap → opens correct screen with reminder | ✅ |
| Cold start deep linking (from killed state) | ✅ |
| Local persistence with AsyncStorage | ✅ |
| Android & iOS support | ✅ |
| Dark-mode polished UI | ✅ |

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| **React Native (Expo SDK 54)** | Cross-platform mobile framework |
| **expo-notifications** | Local & scheduled push notifications |
| **expo-task-manager** | Background task registration |
| **@react-navigation/native-stack** | Screen navigation & deep linking |
| **@react-native-async-storage** | Persistent reminder storage |
| **TypeScript** | Type safety throughout |

---

## 📂 Project Structure

```
remindme-app/
├── App.tsx                        # Root: notification listener + navigation bootstrap
├── app.json                       # Expo config, permissions, deep link scheme
├── src/
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces (Reminder, Nav params)
│   ├── services/
│   │   └── notificationService.ts # All notification & storage logic
│   ├── screens/
│   │   ├── CreateReminderScreen.tsx  # Page 1: input + set reminder
│   │   └── ReminderDetailsScreen.tsx # Page 2: opened from notification
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Native stack navigator
│   └── utils/
│       └── theme.ts               # Design tokens (colors, spacing, typography)
├── assets/                        # App icons, splash screen
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 or **yarn**
- **Expo Go** app (for quick testing on a physical device)
- **Android Studio** (for APK build) or **Xcode** (for iOS build, macOS only)
- **EAS CLI** (for production builds)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/remindme-app.git
cd remindme-app
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
# or
yarn install
```

### 3. Start Development Server

```bash
npx expo start
```

Then scan the QR code with **Expo Go** on your physical device.

> ⚠️ **Important**: Notifications require a **physical device**. They will not work in a simulator/emulator in most cases. Use a real Android or iOS device.

---

## 📦 Building the APK (Android)

### Option A — Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure the project (first time only)
eas build:configure

# Build APK for Android
eas build --platform android --profile preview
```

The APK download link will be provided after the build completes.

### Option B — Local Build (requires Android Studio)

```bash
# Pre-build native project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🍎 Building for iOS

```bash
# EAS Build (requires Apple Developer account)
eas build --platform ios --profile preview

# Or for simulator
eas build --platform ios --profile development
```

---

## 🔔 Notification Architecture

### How Background Notifications Work

The app uses **expo-notifications** with a **TimeInterval trigger** to schedule a local notification that fires 30 seconds after it's created. This trigger is handled entirely by the OS notification system, which means:

1. **The notification will fire even if the app is completely killed** — the OS queues it independently.
2. The app does not need to run any background process; the OS owns the scheduled alarm.

```
User taps "Set Reminder"
        │
        ▼
sendImmediateNotification()  → fires instantly → "Reminder Set" notification
        │
scheduleReminderNotification() → OS queues alarm for T+30s
        │
saveReminder() → persists to AsyncStorage
        │
User kills app
        │
T+30s → OS fires "You have a reminder" notification
        │
User taps notification
        │
OS relaunches app with notification data
        │
App.tsx: getLastNotificationResponseAsync()
        │
handleNotificationResponse() → navigation.navigate('ReminderDetails', { reminderId })
        │
ReminderDetailsScreen: loads from AsyncStorage → displays message
```

### Android Channel Configuration

```typescript
await Notifications.setNotificationChannelAsync('reminders', {
  name: 'Reminders',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#6C63FF',
  sound: 'default',
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
});
```

---

## 🔗 Deep Linking

The app is configured with the custom URL scheme `remindme://`. When a notification is tapped:

- **Foreground**: `addNotificationResponseReceivedListener` fires → navigates immediately.
- **Background / Killed**: `getLastNotificationResponseAsync()` is called on mount with a 500ms delay for navigator readiness → navigates to `ReminderDetails`.

Notification data payload:

```json
{
  "type": "reminder",
  "reminderId": "reminder_1716023456789_abc123",
  "screen": "ReminderDetails"
}
```

---

## ⚙️ Permissions Required

### Android

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### iOS

The app requests notification permission at runtime. The `NSUserNotificationUsageDescription` key is set in `app.json`:

> "RemindMe uses notifications to alert you when your reminder is due, even when the app is closed."

---

## 🎬 Demo Walkthrough

1. **Open app** → You see the "Set a Reminder" screen.
2. **Enter a reminder message** → e.g., "Take medicine".
3. **Tap "Set Reminder"** → An immediate notification appears: *"✅ Reminder Set — you'll be reminded in 30 seconds."*
4. **Completely close/kill the app** (swipe away from recent apps).
5. **Wait 30 seconds** → A notification appears: *"🔔 You have a reminder — Click to view it."*
6. **Tap the notification** → App reopens directly on the **Reminder Details** screen.
7. The **exact message** you entered on Page 1 is displayed on Page 2.

---

## 🧪 Testing Notes

- Always test on a **physical device** — simulators may suppress local notifications.
- On **Android 12+**, `SCHEDULE_EXACT_ALARM` may need to be manually granted in Settings → Apps → RemindMe → Permissions.
- On **iOS**, ensure notifications are enabled in Settings → Notifications → RemindMe.
- The 30-second timer uses `TimeInterval` trigger which is OS-managed — no background fetch or keep-alive is required.

---

## 📋 Submission Checklist

- [x] Source code with TypeScript
- [x] Android APK (build via EAS or local)
- [x] Both screens implemented
- [x] Immediate "Reminder Set" notification
- [x] 30-second scheduled notification (fires when app is killed)
- [x] Notification tap → deep links to Reminder Details screen
- [x] Reminder message persisted and displayed on Page 2
- [x] README with setup instructions

---

## 🛠️ Troubleshooting

| Issue | Solution |
|---|---|
| Notifications not showing | Ensure physical device, grant permission in Settings |
| Android 12+ alarm not firing | Go to Settings → Apps → RemindMe → Alarms & Reminders → Allow |
| App not navigating on notification tap | Check that `scheme: "remindme"` is in app.json and run `expo prebuild` |
| AsyncStorage data missing | Data is per-app; ensure you're running the same build |

---

## 👤 Author

Built as part of a technical assessment demonstrating cross-platform mobile development, real device push notifications, background scheduling, and navigation deep linking.

---

## 📄 License

MIT
