import React, { useEffect } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Redirect, router } from "expo-router";

import { usePermissions } from "../hooks/usePermissions";
import { useOffRampConfig } from "../hooks/useOffRampConfig";
import { useMonitoringStatus } from "../hooks/useMonitoringStatus";
import { Button, Card, Pill, ProgressBar, ScreenTitle } from "../components/ui";
import { Screen } from "../components/Screen";
import { colors, fontSize, spacing } from "../theme";
import OffRampMonitor from "../../modules/off-ramp-monitor/src/OffRampMonitorModule";

function formatMinutes(value: number): string {
  return value >= 10 ? Math.round(value).toString() : value.toFixed(1);
}

export default function HomeScreen() {
  const { allGranted, isLoading: permissionsLoading } = usePermissions();
  const { config, isLoading: configLoading } = useOffRampConfig();
  const { isPaused, ruleStatuses, togglePaused } = useMonitoringStatus(config);

  // Belt-and-suspenders: the background service is normally started once from the onboarding
  // Continue button, but Android can still kill it (or a future launch may skip onboarding
  // entirely because permissions are already granted). Re-assert it here so the app can never
  // get stuck with permissions granted but no monitoring actually running.
  useEffect(() => {
    if (allGranted && !OffRampMonitor.isMonitoringServiceRunning()) {
      OffRampMonitor.startMonitoringService();
    }
  }, [allGranted]);

  if (permissionsLoading || configLoading) {
    return (
      <Screen testID="home-screen">
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>Loading Off-Ramp…</Text>
        </View>
      </Screen>
    );
  }

  if (!allGranted) {
    return <Redirect href="/onboarding/permissions" />;
  }

  return (
    <Screen scroll testID="home-screen">
      <ScreenTitle subtitle="Your active focus limits, in real time.">Off-Ramp</ScreenTitle>

      <Card style={styles.monitoringCard}>
        <View style={styles.monitoringInfo}>
          <Text style={styles.monitoringTitle}>
            {isPaused ? "Monitoring Paused" : "Monitoring Active"}
          </Text>
          <Text style={styles.monitoringSubtitle}>
            {isPaused
              ? "Off-Ramp is not tracking screen time right now."
              : "Off-Ramp is watching your configured apps and websites."}
          </Text>
        </View>
        <Switch
          testID="monitoring-toggle"
          value={!isPaused}
          onValueChange={() => togglePaused()}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.textLight}
        />
      </Card>

      <Text style={styles.sectionTitle}>Active Timers</Text>

      {ruleStatuses.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.mutedText}>
            No rules configured yet. Add targets and create a rule to start monitoring.
          </Text>
        </Card>
      ) : (
        ruleStatuses.map((status) => (
          <Card key={status.ruleId} style={styles.ruleCard}>
            <View style={styles.pillRow}>
              {status.targets.length > 0 ? (
                status.targets.map((target) => (
                  <Pill key={target.id} type={target.type}>
                    {target.name}
                  </Pill>
                ))
              ) : (
                <Text style={styles.emptyPillText}>No targets assigned</Text>
              )}
            </View>
            <ProgressBar
              percent={status.time.percentUsed}
              isNearLimit={status.time.isNearLimit}
              isLimitReached={status.time.isLimitReached}
            />
            <View style={styles.progressLabelsRow}>
              <Text style={styles.mutedSmall}>{formatMinutes(status.time.usedMinutes)} min used</Text>
              <Text
                style={[
                  styles.remainingLabel,
                  status.time.isLimitReached && styles.limitReachedLabel,
                ]}
              >
                {status.time.isLimitReached
                  ? "Limit reached"
                  : `${formatMinutes(status.time.remainingMinutes)} min left`}
              </Text>
            </View>
          </Card>
        ))
      )}

      <View style={styles.navRow}>
        <View style={styles.navButton}>
          <Button
            label="Apps & Websites"
            onPress={() => router.push("/targets")}
            variant="secondary"
          />
        </View>
        <View style={styles.navButton}>
          <Button label="Rules" onPress={() => router.push("/rules")} variant="secondary" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mutedText: {
    color: colors.textMuted,
  },
  mutedSmall: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  monitoringCard: {
    marginBottom: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monitoringInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  monitoringTitle: {
    color: colors.textLight,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  monitoringSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.textLight,
    fontWeight: "700",
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
  },
  emptyCard: {
    marginBottom: spacing.lg,
  },
  ruleCard: {
    marginBottom: spacing.lg - 2,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md - 2,
  },
  emptyPillText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  progressLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  remainingLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  limitReachedLabel: {
    color: colors.danger,
  },
  navRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  navButton: {
    flex: 1,
  },
});
