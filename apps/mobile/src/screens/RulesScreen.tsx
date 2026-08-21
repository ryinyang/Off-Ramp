import React, { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Rule, Schedule, Target } from "@off-ramp/core";

import { useOffRampConfig } from "../hooks/useOffRampConfig";
import { Button, Card, Pill, ScreenTitle } from "../components/ui";
import { Screen } from "../components/Screen";
import { RuleEditorModal } from "../components/RuleEditorModal";
import { colors, fontSize, spacing } from "../theme";

const DAY_ABBREVIATIONS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function describeSchedule(schedule: Schedule | undefined): string {
  if (!schedule) return "No schedule";
  const days =
    schedule.activeDays.length === 7
      ? "Every day"
      : schedule.activeDays.map((d) => DAY_ABBREVIATIONS[d]).join(", ");
  return `${days} · ${schedule.startTime}–${schedule.endTime}`;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function buildDraftRule(): Rule {
  return {
    id: makeId("rule"),
    allowedMinutes: 15,
    interruptionSeconds: 30,
    message: "Hey! Time to take a break and give yourself an off-ramp.",
    targetIds: [],
    scheduleId: makeId("sched"),
    enabled: true,
  };
}

function buildDraftSchedule(scheduleId: string): Schedule {
  return {
    id: scheduleId,
    name: "Custom Schedule",
    activeDays: [1, 2, 3, 4, 5, 6, 7],
    startTime: "00:00",
    endTime: "23:59",
    enabled: true,
  };
}

export default function RulesScreen() {
  const { config, saveConfig, isLoading } = useOffRampConfig();
  const [editorState, setEditorState] = useState<{
    isCreating: boolean;
    rule: Rule;
    schedule: Schedule;
  } | null>(null);

  if (isLoading || !config) {
    return (
      <Screen testID="rules-screen">
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>Loading…</Text>
        </View>
      </Screen>
    );
  }

  const openCreateEditor = () => {
    const rule = buildDraftRule();
    setEditorState({ isCreating: true, rule, schedule: buildDraftSchedule(rule.scheduleId) });
  };

  const openEditEditor = (rule: Rule) => {
    const schedule = config.schedules.find((s) => s.id === rule.scheduleId);
    setEditorState({
      isCreating: false,
      rule,
      schedule: schedule ?? buildDraftSchedule(rule.scheduleId),
    });
  };

  const handleSave = async (rule: Rule, schedule: Schedule) => {
    const rules = editorState?.isCreating
      ? [...config.rules, rule]
      : config.rules.map((r) => (r.id === rule.id ? rule : r));
    const scheduleExists = config.schedules.some((s) => s.id === schedule.id);
    const schedules = scheduleExists
      ? config.schedules.map((s) => (s.id === schedule.id ? schedule : s))
      : [...config.schedules, schedule];

    await saveConfig({ ...config, rules, schedules, updatedAt: new Date().toISOString() });
    setEditorState(null);
  };

  const handleToggleRule = async (ruleId: string) => {
    await saveConfig({
      ...config,
      rules: config.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteRule = async (rule: Rule) => {
    const scheduleStillUsed = config.rules.some(
      (r) => r.id !== rule.id && r.scheduleId === rule.scheduleId
    );
    await saveConfig({
      ...config,
      rules: config.rules.filter((r) => r.id !== rule.id),
      schedules: scheduleStillUsed
        ? config.schedules
        : config.schedules.filter((s) => s.id !== rule.scheduleId),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Screen scroll testID="rules-screen">
      <ScreenTitle subtitle="Set your screen time limits, break duration, and active schedule.">
        Rules
      </ScreenTitle>

      <Button label="+ Create New Rule" onPress={openCreateEditor} testID="create-rule-button" />

      <View style={styles.list}>
        {config.rules.length === 0 ? (
          <Card>
            <Text style={styles.mutedText}>
              No rules yet. Create one to start monitoring your targets.
            </Text>
          </Card>
        ) : (
          config.rules.map((rule) => {
            const ruleTargets = rule.targetIds
              .map((id) => config.targets.find((t) => t.id === id))
              .filter((target): target is Target => Boolean(target));
            const schedule = config.schedules.find((s) => s.id === rule.scheduleId);

            return (
              <Card key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <Text
                    style={[styles.ruleTitle, !rule.enabled && styles.ruleTitleDisabled]}
                  >
                    {rule.allowedMinutes} min allowed · {rule.interruptionSeconds}s break
                  </Text>
                  <Switch
                    testID={`rule-toggle-${rule.id}`}
                    value={rule.enabled}
                    onValueChange={() => handleToggleRule(rule.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.textLight}
                  />
                </View>

                <Text style={styles.scheduleText}>{describeSchedule(schedule)}</Text>

                <Text style={styles.messageText} numberOfLines={2}>
                  "{rule.message}"
                </Text>

                <View style={styles.pillRow}>
                  {ruleTargets.length > 0 ? (
                    ruleTargets.map((target) => (
                      <Pill key={target.id} type={target.type}>
                        {target.name}
                      </Pill>
                    ))
                  ) : (
                    <Text style={styles.emptyPillText}>No targets assigned</Text>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <View style={styles.actionButton}>
                    <Button label="Edit" variant="secondary" onPress={() => openEditEditor(rule)} />
                  </View>
                  <View style={styles.actionButton}>
                    <Button
                      label="Delete"
                      variant="danger"
                      onPress={() => handleDeleteRule(rule)}
                    />
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </View>

      {editorState && (
        <RuleEditorModal
          visible
          isCreating={editorState.isCreating}
          initialRule={editorState.rule}
          initialSchedule={editorState.schedule}
          targets={config.targets}
          onCancel={() => setEditorState(null)}
          onSave={handleSave}
        />
      )}
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
  list: {
    marginTop: spacing.xl,
  },
  ruleCard: {
    marginBottom: spacing.lg - 2,
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  ruleTitle: {
    flex: 1,
    paddingRight: spacing.md,
    fontWeight: "700",
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  ruleTitleDisabled: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  scheduleText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontStyle: "italic",
    marginBottom: spacing.md - 2,
  },
  messageText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.md - 2,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  emptyPillText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
