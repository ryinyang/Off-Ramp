import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { usePermissions } from "../hooks/usePermissions";
import { Button, Card, ScreenTitle } from "../components/ui";
import { Screen } from "../components/Screen";
import { colors, fontSize, radius, spacing } from "../theme";
import OffRampMonitor from "../../modules/off-ramp-monitor/src/OffRampMonitorModule";

interface PermissionRowProps {
  title: string;
  description: string;
  granted: boolean;
  actionLabel: string;
  onPress: () => void;
  optional?: boolean;
}

function PermissionRow({
  title,
  description,
  granted,
  actionLabel,
  onPress,
  optional,
}: PermissionRowProps) {
  return (
    <Card style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>{title}</Text>
        <View style={[styles.badge, granted ? styles.badgeGranted : styles.badgeDefault]}>
          <Text style={[styles.badgeText, granted ? styles.badgeTextGranted : styles.badgeTextDefault]}>
            {granted ? "Granted" : optional ? "Optional" : "Required"}
          </Text>
        </View>
      </View>
      <Text style={styles.rowDescription}>{description}</Text>
      {!granted && <Button label={actionLabel} onPress={onPress} variant="secondary" />}
    </Card>
  );
}

export default function PermissionsScreen() {
  const { usageAccess, accessibility, notifications, allGranted, refresh } = usePermissions();

  const handleContinue = useCallback(() => {
    OffRampMonitor.startMonitoringService();
    router.replace("/");
  }, []);

  const handleRequestNotifications = useCallback(async () => {
    await OffRampMonitor.requestNotificationPermission();
    refresh();
  }, [refresh]);

  return (
    <Screen scroll testID="permissions-screen">
      <ScreenTitle subtitle="Off-Ramp needs two Android permissions to forcibly pull your focus back when you hit a limit.">
        Set up Off-Ramp
      </ScreenTitle>

      <PermissionRow
        title="Usage Access"
        description="Lets Off-Ramp see which app is currently in the foreground, so it can measure screen time against your rules."
        granted={usageAccess}
        actionLabel="Open Usage Access Settings"
        onPress={() => OffRampMonitor.openUsageAccessSettings()}
      />

      <PermissionRow
        title="Accessibility Service"
        description="Lets Off-Ramp forcibly switch your focus to the break screen the instant a limit is reached. Off-Ramp never reads your screen content."
        granted={accessibility}
        actionLabel="Open Accessibility Settings"
        onPress={() => OffRampMonitor.openAccessibilitySettings()}
      />

      <PermissionRow
        title="Notifications"
        description="Shows a persistent notification while Off-Ramp is monitoring in the background."
        granted={notifications}
        actionLabel="Allow Notifications"
        onPress={handleRequestNotifications}
        optional
      />

      <View style={styles.continueWrap}>
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!allGranted}
          testID="permissions-continue"
        />
        {!allGranted && (
          <Text style={styles.hintText}>
            Usage Access and the Accessibility Service are both required to continue.
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.lg,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  rowTitle: {
    color: colors.textLight,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs,
  },
  badgeGranted: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  badgeDefault: {
    backgroundColor: "rgba(71, 85, 105, 0.4)",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  badgeTextGranted: {
    color: colors.success,
  },
  badgeTextDefault: {
    color: colors.textMuted,
  },
  rowDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md + 2,
  },
  continueWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.md - 1,
  },
});
