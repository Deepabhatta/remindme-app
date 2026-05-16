import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radii } from '../utils/theme';
import {
  requestNotificationPermissions,
  sendImmediateNotification,
  scheduleReminderNotification,
  saveReminder,
  generateId,
} from '../services/notificationService';
import { Reminder } from '../types';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function CreateReminderScreen() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [statusText, setStatusText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // Pulse glow on input focus
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Request permissions on mount
    (async () => {
      const granted = await requestNotificationPermissions();
      setHasPermission(granted);
    })();
  }, []);

  const handleMessageChange = (text: string) => {
    setMessage(text);
    setCharCount(text.length);
    if (status === 'error') setStatus('idle');
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const showSuccess = () => {
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(successAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const handleSetReminder = async () => {
    if (!message.trim()) {
      setStatus('error');
      setStatusText('Please enter a reminder message first.');
      Vibration.vibrate(200);
      return;
    }

    if (!hasPermission) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        setStatus('error');
        setStatusText('Notification permission is required. Please enable it in Settings.');
        return;
      }
      setHasPermission(true);
    }

    animateButton();
    setStatus('loading');
    setStatusText('Setting your reminder…');

    try {
      const id = generateId();
      const now = Date.now();
      const trimmedMessage = message.trim();

      // 1. Fire immediate "Reminder Set" notification
      await sendImmediateNotification(trimmedMessage);

      // 2. Schedule 30-second reminder notification
      const scheduledNotifId = await scheduleReminderNotification(id, trimmedMessage, 30);

      // 3. Persist to local storage
      const reminder: Reminder = {
        id,
        message: trimmedMessage,
        createdAt: now,
        scheduledAt: now + 30_000,
        notificationId: scheduledNotifId,
        status: 'pending',
      };
      await saveReminder(reminder);

      setStatus('success');
      setStatusText('Reminder set! You\'ll be notified in 30 seconds.');
      setMessage('');
      setCharCount(0);
      Vibration.vibrate([0, 100, 50, 100]);
      showSuccess();
    } catch (err: any) {
      console.error('Failed to set reminder:', err);
      setStatus('error');
      setStatusText('Failed to set reminder. Please try again.');
    }
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.iconGlow, { opacity: glowOpacity }]} />
            <Text style={styles.icon}>🔔</Text>
          </View>
          <Text style={styles.title}>Set a Reminder</Text>
          <Text style={styles.subtitle}>
            Enter your message and we'll notify you in 30 seconds — even if the app is closed.
          </Text>
        </Animated.View>

        {/* Permission Warning */}
        {!hasPermission && (
          <Animated.View style={[styles.warningBanner, { opacity: fadeAnim }]}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Notification permission required. Tap "Set Reminder" to grant access.
            </Text>
          </Animated.View>
        )}

        {/* Card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Input Label */}
          <Text style={styles.label}>Reminder Message</Text>

          {/* Text Input */}
          <View style={[styles.inputWrapper, status === 'error' && styles.inputWrapperError]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Call mom, Take medicine, Meeting at 3pm…"
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={handleMessageChange}
              multiline
              maxLength={280}
              returnKeyType="done"
              blurOnSubmit
              textAlignVertical="top"
              selectionColor={Colors.primary}
            />
            <Text style={styles.charCount}>{charCount}/280</Text>
          </View>

          {/* Status message */}
          {status === 'error' && (
            <View style={styles.errorRow}>
              <Text style={styles.errorIcon}>✕</Text>
              <Text style={styles.errorText}>{statusText}</Text>
            </View>
          )}

          {/* Set Reminder Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.button, status === 'loading' && styles.buttonLoading]}
              onPress={handleSetReminder}
              activeOpacity={0.85}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <ActivityIndicator color={Colors.textOnPrimary} size="small" />
              ) : (
                <>
                  <Text style={styles.buttonIcon}>⏰</Text>
                  <Text style={styles.buttonText}>Set Reminder</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Success Banner */}
        <Animated.View style={[styles.successBanner, { opacity: successAnim }]}>
          <View style={styles.successInner}>
            <Text style={styles.successIcon}>✅</Text>
            <View>
              <Text style={styles.successTitle}>Reminder Set!</Text>
              <Text style={styles.successBody}>
                You'll receive a notification in 30 seconds.{'\n'}
                You can close the app — it will still fire.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* How it works */}
        <Animated.View style={[styles.howItWorksCard, { opacity: fadeAnim }]}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={i} style={styles.howStep}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HOW_IT_WORKS = [
  'Type your reminder message above.',
  'Tap "Set Reminder" — an immediate notification confirms it\'s been set.',
  'Close or kill the app completely.',
  'After 30 seconds, a notification appears on your device.',
  'Tap the notification to reopen the app and view your reminder.',
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
  },
  icon: {
    fontSize: 52,
    zIndex: 1,
  },
  title: {
    fontSize: Fonts.sizes['3xl'],
    fontWeight: Fonts.weights.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },

  // Warning
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2A1F00',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  warningIcon: { fontSize: 18 },
  warningText: {
    flex: 1,
    color: Colors.warning,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  input: {
    color: Colors.textPrimary,
    fontSize: Fonts.sizes.md,
    lineHeight: 24,
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    marginTop: Spacing.xs,
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  errorIcon: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: Fonts.weights.bold,
  },
  errorText: {
    color: Colors.error,
    fontSize: Fonts.sizes.sm,
    flex: 1,
  },

  // Button
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    color: Colors.textOnPrimary,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.3,
  },

  // Success Banner
  successBanner: {
    marginBottom: Spacing.lg,
  },
  successInner: {
    backgroundColor: '#0D2A1A',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.accentGreen,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  successIcon: { fontSize: 28 },
  successTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.accentGreen,
    marginBottom: 4,
  },
  successBody: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
  },

  // How It Works
  howItWorksCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  howItWorksTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  howStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumText: {
    color: Colors.primaryLight,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  stepText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
  },
});
