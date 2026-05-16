import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Share,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, Reminder } from '../types';
import { getReminderById, updateReminderStatus } from '../services/notificationService';
import { Colors, Fonts, Spacing, Radii } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReminderDetails'>;

export default function ReminderDetailsScreen({ route, navigation }: Props) {
  const { reminderId } = route.params;
  const insets = useSafeAreaInsets();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadReminder();
  }, [reminderId]);

  const loadReminder = async () => {
    setLoading(true);
    const r = await getReminderById(reminderId);
    setReminder(r);
    setLoading(false);

    if (r) {
      await updateReminderStatus(reminderId, 'viewed');
      startAnimations();
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();

    // Bell rotate animation
    Animated.sequence([
      Animated.delay(400),
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.delay(3000),
        ]),
        { iterations: 3 }
      ),
    ]).start();

    // Shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleShare = async () => {
    if (!reminder) return;
    try {
      await Share.share({
        message: `My reminder: "${reminder.message}"`,
        title: 'Reminder',
      });
    } catch (e) {
      console.warn('Share failed:', e);
    }
  };

  const bellRotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  const shimmerOpacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading reminder…</Text>
      </View>
    );
  }

  if (!reminder) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.notFoundTitle}>Reminder Not Found</Text>
        <Text style={styles.notFoundText}>
          The reminder may have been cleared. Go back to create a new one.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const createdAt = new Date(reminder.createdAt);
  const scheduledAt = new Date(reminder.scheduledAt);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification source badge */}
        <Animated.View style={[styles.sourceBadge, { opacity: fadeAnim }]}>
          <Text style={styles.sourceBadgeText}>📲  Opened from notification</Text>
        </Animated.View>

        {/* Big animated bell */}
        <Animated.View
          style={[
            styles.bellContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { rotate: bellRotation }],
            },
          ]}
        >
          <Animated.View style={[styles.bellGlow, { opacity: shimmerOpacity }]} />
          <Text style={styles.bellIcon}>🔔</Text>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          style={[styles.pageTitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          Your Reminder
        </Animated.Text>

        {/* Message Card */}
        <Animated.View
          style={[
            styles.messageCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.messageCardHeader}>
            <View style={styles.messageCardDot} />
            <Text style={styles.messageCardLabel}>REMINDER MESSAGE</Text>
          </View>
          <Text style={styles.messageText}>{reminder.message}</Text>
        </Animated.View>

        {/* Details Grid */}
        <Animated.View
          style={[styles.detailsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <DetailCell
            icon="🕐"
            label="Created"
            value={formatDateTime(createdAt)}
          />
          <DetailCell
            icon="⏰"
            label="Fired At"
            value={formatDateTime(scheduledAt)}
          />
          <DetailCell
            icon="📌"
            label="Status"
            value="Viewed"
            valueColor={Colors.accentGreen}
          />
          <DetailCell
            icon="🆔"
            label="ID"
            value={reminder.id.split('_').slice(-1)[0]}
          />
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[styles.actions, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnIcon}>↗</Text>
            <Text style={styles.shareBtnText}>Share Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => navigation.navigate('CreateReminder')}
            activeOpacity={0.8}
          >
            <Text style={styles.newBtnIcon}>＋</Text>
            <Text style={styles.newBtnText}>New Reminder</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────────
function DetailCell({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailCell}>
      <Text style={styles.detailCellIcon}>{icon}</Text>
      <Text style={styles.detailCellLabel}>{label}</Text>
      <Text style={[styles.detailCellValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Format Helpers ─────────────────────────────────────────────────────────────
function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: { color: Colors.textSecondary, fontSize: Fonts.sizes.md },

  // Source badge
  sourceBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  sourceBadgeText: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.xs,
    letterSpacing: 0.5,
  },

  // Bell
  bellContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  bellGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
  },
  bellIcon: { fontSize: 72, zIndex: 1 },

  // Title
  pageTitle: {
    fontSize: Fonts.sizes['3xl'],
    fontWeight: Fonts.weights.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.xl,
  },

  // Message card
  messageCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  messageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  messageCardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  messageCardLabel: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
    letterSpacing: 1.2,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.semibold,
    lineHeight: 32,
  },

  // Details grid
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  detailCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
  },
  detailCellIcon: { fontSize: 20, marginBottom: 4 },
  detailCellLabel: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  detailCellValue: {
    color: Colors.textPrimary,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
  },

  // Actions
  actions: { gap: Spacing.sm },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
  },
  shareBtnIcon: { color: Colors.textSecondary, fontSize: 18, fontWeight: Fonts.weights.bold },
  shareBtnText: { color: Colors.textSecondary, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },

  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  newBtnIcon: { color: Colors.textOnPrimary, fontSize: 20, fontWeight: Fonts.weights.bold },
  newBtnText: { color: Colors.textOnPrimary, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold },

  // Not found
  errorEmoji: { fontSize: 64, marginBottom: Spacing.md },
  notFoundTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  notFoundText: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
  },
  backBtnText: { color: Colors.textOnPrimary, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
