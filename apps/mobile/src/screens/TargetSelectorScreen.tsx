import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DomainUtils, Target } from "@off-ramp/core";

import { useOffRampConfig } from "../hooks/useOffRampConfig";
import { Button, Card, ScreenTitle, TargetTypeTag } from "../components/ui";
import { Screen } from "../components/Screen";
import { colors, fontSize, radius, spacing } from "../theme";
import OffRampMonitor from "../../modules/off-ramp-monitor/src/OffRampMonitorModule";
import { InstalledAppInfo } from "../../modules/off-ramp-monitor/src/OffRampMonitor.types";

function makeTargetId(prefix: string): string {
  return `target-${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export default function TargetSelectorScreen() {
  const { config, saveConfig, isLoading } = useOffRampConfig();

  const [installedApps, setInstalledApps] = useState<InstalledAppInfo[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appSearch, setAppSearch] = useState("");

  const [websiteName, setWebsiteName] = useState("");
  const [websiteDomain, setWebsiteDomain] = useState("");
  const [isAddingWebsite, setIsAddingWebsite] = useState(false);

  useEffect(() => {
    let cancelled = false;
    OffRampMonitor.getInstalledLaunchableApps()
      .then((apps) => {
        if (!cancelled) setInstalledApps(apps);
      })
      .catch(() => {
        if (!cancelled) setInstalledApps([]);
      })
      .finally(() => {
        if (!cancelled) setAppsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addedIdentifiers = useMemo(
    () => new Set((config?.targets ?? []).map((t) => t.identifier)),
    [config]
  );

  const filteredApps = useMemo(() => {
    const query = appSearch.trim().toLowerCase();
    const apps = query
      ? installedApps.filter((app) => app.appName.toLowerCase().includes(query))
      : installedApps;
    return apps.filter((app) => !addedIdentifiers.has(app.packageName));
  }, [installedApps, appSearch, addedIdentifiers]);

  if (isLoading || !config) {
    return (
      <Screen testID="targets-screen">
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>Loading…</Text>
        </View>
      </Screen>
    );
  }

  const addTarget = async (target: Target) => {
    await saveConfig({
      ...config,
      targets: [...config.targets, target],
      updatedAt: new Date().toISOString(),
    });
  };

  const removeTarget = async (targetId: string) => {
    await saveConfig({
      ...config,
      targets: config.targets.filter((t) => t.id !== targetId),
      rules: config.rules.map((r) => ({
        ...r,
        targetIds: r.targetIds.filter((id) => id !== targetId),
      })),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddApp = (app: InstalledAppInfo) => {
    addTarget({
      id: makeTargetId("app"),
      name: app.appName,
      identifier: app.packageName,
      type: "app",
    });
  };

  const handleAddWebsite = async () => {
    if (!websiteName.trim() || !websiteDomain.trim()) return;
    await addTarget({
      id: makeTargetId("site"),
      name: websiteName.trim(),
      identifier: DomainUtils.normalizeDomain(websiteDomain.trim()),
      type: "website",
    });
    setWebsiteName("");
    setWebsiteDomain("");
    setIsAddingWebsite(false);
  };

  return (
    <Screen scroll testID="targets-screen">
      <ScreenTitle subtitle="Choose which apps and websites Off-Ramp should monitor.">
        Apps & Websites
      </ScreenTitle>

      {config.targets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitored</Text>
          {config.targets.map((target) => (
            <Card key={target.id} style={styles.monitoredCard}>
              <View style={styles.monitoredInfo}>
                <View style={styles.monitoredNameRow}>
                  <Text style={styles.monitoredName}>{target.name}</Text>
                  <TargetTypeTag type={target.type} />
                </View>
                <Text style={styles.monitoredIdentifier}>{target.identifier}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${target.name}`}
                onPress={() => removeTarget(target.id)}
                hitSlop={8}
              >
                <Text style={styles.removeIcon}>✕</Text>
              </Pressable>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add a Website</Text>
        {isAddingWebsite ? (
          <Card>
            <TextInput
              value={websiteName}
              onChangeText={setWebsiteName}
              placeholder="Website name (e.g. YouTube)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.inputSpaced]}
            />
            <TextInput
              value={websiteDomain}
              onChangeText={setWebsiteDomain}
              placeholder="Domain (e.g. youtube.com)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, styles.inputSpacedLarge]}
            />
            <View style={styles.buttonRow}>
              <View style={styles.buttonHalf}>
                <Button label="Add Website" onPress={handleAddWebsite} />
              </View>
              <View style={styles.buttonHalf}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setIsAddingWebsite(false)}
                />
              </View>
            </View>
          </Card>
        ) : (
          <Button
            label="+ Add Website Target"
            variant="secondary"
            onPress={() => setIsAddingWebsite(true)}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add an Installed App</Text>
        <TextInput
          value={appSearch}
          onChangeText={setAppSearch}
          placeholder="Search installed apps"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.searchInput]}
        />
        {appsLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : filteredApps.length === 0 ? (
          <Text style={styles.mutedTextSmall}>No matching apps.</Text>
        ) : (
          filteredApps.map((app) => (
            <Pressable
              key={app.packageName}
              onPress={() => handleAddApp(app)}
              accessibilityRole="button"
              style={styles.appRow}
            >
              {app.icon ? (
                <Image source={{ uri: app.icon }} style={styles.appIcon} />
              ) : (
                <View style={[styles.appIcon, styles.appIconPlaceholder]} />
              )}
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.appName}</Text>
                <Text style={styles.appPackage}>{app.packageName}</Text>
              </View>
              <Text style={styles.addIcon}>+</Text>
            </Pressable>
          ))
        )}
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
  mutedTextSmall: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.textLight,
    fontWeight: "700",
    fontSize: fontSize.base,
    marginBottom: spacing.md - 2,
  },
  monitoredCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md - 2,
  },
  monitoredInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  monitoredNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  monitoredName: {
    color: colors.textLight,
    fontWeight: "600",
    fontSize: fontSize.sm,
  },
  monitoredIdentifier: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  removeIcon: {
    color: colors.danger,
    fontSize: fontSize.lg,
    fontWeight: "700",
    paddingHorizontal: spacing.xs,
  },
  input: {
    color: colors.textLight,
    backgroundColor: colors.backgroundDark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputSpaced: {
    marginBottom: spacing.md - 2,
  },
  inputSpacedLarge: {
    marginBottom: spacing.lg,
  },
  searchInput: {
    backgroundColor: colors.cardDark,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  buttonHalf: {
    flex: 1,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardDark,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.6)",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    marginRight: spacing.md,
  },
  appIconPlaceholder: {
    backgroundColor: colors.border,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    color: colors.textLight,
    fontWeight: "600",
    fontSize: fontSize.sm,
  },
  appPackage: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  addIcon: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: "700",
    paddingHorizontal: spacing.xs,
  },
});
