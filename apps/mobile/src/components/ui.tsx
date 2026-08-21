import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, fontSize, radius, spacing } from "../theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        VARIANT_STYLES[variant],
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textLight} />
      ) : (
        <Text style={styles.buttonLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenTitle({ children, subtitle }: { children: string; subtitle?: string }) {
  return (
    <View style={styles.titleWrap}>
      <Text style={styles.titleText}>{children}</Text>
      {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
    </View>
  );
}

interface ProgressBarProps {
  percent: number;
  isNearLimit?: boolean;
  isLimitReached?: boolean;
}

export function ProgressBar({ percent, isNearLimit, isLimitReached }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const barColor = isLimitReached ? colors.danger : isNearLimit ? colors.warning : colors.primary;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamped}%`, backgroundColor: barColor }]} />
    </View>
  );
}

export type TargetType = "app" | "website";

const TARGET_TYPE_COLOR: Record<TargetType, string> = {
  app: colors.targetApp,
  website: colors.targetWebsite,
};

const TARGET_TYPE_LABEL: Record<TargetType, string> = {
  app: "APP",
  website: "SITE",
};

/**
 * Small "APP" / "SITE" badge shown next to a target's name wherever it appears, so a website
 * target and an app target that happen to share a display name (e.g. a "YouTube" app and a
 * "YouTube" website) are never ambiguous.
 */
export function TargetTypeTag({ type }: { type: TargetType }) {
  const tagColor = TARGET_TYPE_COLOR[type];
  return (
    <View style={[styles.typeTag, { backgroundColor: `${tagColor}26`, borderColor: `${tagColor}66` }]}>
      <Text style={[styles.typeTagText, { color: tagColor }]}>{TARGET_TYPE_LABEL[type]}</Text>
    </View>
  );
}

export function Pill({ children, type }: { children: string; type?: TargetType }) {
  return (
    <View style={styles.pill}>
      {type && <View style={[styles.pillDot, { backgroundColor: TARGET_TYPE_COLOR[type] }]} />}
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

const VARIANT_STYLES = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
});

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg - 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: colors.textLight,
    fontWeight: "600",
    fontSize: fontSize.lg,
  },
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.6)",
    padding: spacing.lg,
  },
  titleWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  titleText: {
    color: colors.textLight,
    fontSize: fontSize.xxl,
    fontWeight: "800",
  },
  subtitleText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 10,
    width: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm - 2,
    marginBottom: spacing.sm - 2,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  pillText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  typeTag: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
