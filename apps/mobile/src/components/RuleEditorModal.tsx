import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Rule, Schedule, Target } from "@off-ramp/core";

import { Button, Card, TargetTypeTag } from "./ui";
import { colors, fontSize, radius, spacing } from "../theme";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_LABELS: { day: number; label: string }[] = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 7, label: "Sun" },
];

export interface RuleEditorModalProps {
  visible: boolean;
  isCreating: boolean;
  initialRule: Rule;
  initialSchedule: Schedule;
  targets: Target[];
  onCancel: () => void;
  onSave: (rule: Rule, schedule: Schedule) => void;
}

export function RuleEditorModal({
  visible,
  isCreating,
  initialRule,
  initialSchedule,
  targets,
  onCancel,
  onSave,
}: RuleEditorModalProps) {
  const [allowedMinutesText, setAllowedMinutesText] = useState(String(initialRule.allowedMinutes));
  const [interruptionSecondsText, setInterruptionSecondsText] = useState(
    String(initialRule.interruptionSeconds)
  );
  const [message, setMessage] = useState(initialRule.message);
  const [targetIds, setTargetIds] = useState<string[]>(initialRule.targetIds);
  const [activeDays, setActiveDays] = useState<number[]>(initialSchedule.activeDays);
  const [startTime, setStartTime] = useState(initialSchedule.startTime);
  const [endTime, setEndTime] = useState(initialSchedule.endTime);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setAllowedMinutesText(String(initialRule.allowedMinutes));
    setInterruptionSecondsText(String(initialRule.interruptionSeconds));
    setMessage(initialRule.message);
    setTargetIds(initialRule.targetIds);
    setActiveDays(initialSchedule.activeDays);
    setStartTime(initialSchedule.startTime);
    setEndTime(initialSchedule.endTime);
    setError(null);
  }, [visible, initialRule, initialSchedule]);

  const toggleDay = (day: number) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const toggleTarget = (targetId: string) => {
    setTargetIds((prev) =>
      prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId]
    );
  };

  const handleSave = () => {
    const allowedMinutes = Number(allowedMinutesText);
    const interruptionSeconds = Number(interruptionSecondsText);

    if (!Number.isFinite(allowedMinutes) || allowedMinutes <= 0) {
      setError("Allowed screen time must be a positive number of minutes.");
      return;
    }
    if (!Number.isFinite(interruptionSeconds) || interruptionSeconds <= 0) {
      setError("Break duration must be a positive number of seconds.");
      return;
    }
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      setError("Start and end time must be in 24-hour HH:mm format (e.g. 09:00).");
      return;
    }
    if (activeDays.length === 0) {
      setError("Select at least one active day.");
      return;
    }
    if (!message.trim()) {
      setError("Enter a reflection message.");
      return;
    }

    setError(null);
    onSave(
      { ...initialRule, allowedMinutes, interruptionSeconds, message: message.trim(), targetIds },
      { ...initialSchedule, activeDays, startTime, endTime }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent}>
            <Text style={styles.title}>{isCreating ? "Create Rule" : "Edit Rule"}</Text>

            {error && (
              <Card style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </Card>
            )}

            <Text style={styles.label}>ALLOWED SCREEN TIME (MINUTES)</Text>
            <TextInput
              value={allowedMinutesText}
              onChangeText={setAllowedMinutesText}
              keyboardType="number-pad"
              testID="rule-allowed-minutes-input"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>BREAK DURATION (SECONDS)</Text>
            <TextInput
              value={interruptionSecondsText}
              onChangeText={setInterruptionSecondsText}
              keyboardType="number-pad"
              testID="rule-break-seconds-input"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>REFLECTION MESSAGE</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              testID="rule-message-input"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>ACTIVE DAYS</Text>
            <View style={styles.dayRow}>
              {DAY_LABELS.map(({ day, label }) => {
                const isActive = activeDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleDay(day)}
                    testID={`rule-day-${day}`}
                    style={[styles.dayChip, isActive && styles.dayChipActive]}
                  >
                    <Text style={isActive ? styles.dayChipTextActive : styles.dayChipText}>
                      {label[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>START (HH:mm)</Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor={colors.textMuted}
                  testID="rule-start-time-input"
                  style={styles.input}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.label}>END (HH:mm)</Text>
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="17:00"
                  placeholderTextColor={colors.textMuted}
                  testID="rule-end-time-input"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>TARGETS INCLUDED</Text>
            <View style={styles.targetsList}>
              {targets.length === 0 ? (
                <Text style={styles.emptyTargetsText}>
                  No targets yet — add apps or websites first.
                </Text>
              ) : (
                targets.map((target) => {
                  const isChecked = targetIds.includes(target.id);
                  return (
                    <Pressable
                      key={target.id}
                      onPress={() => toggleTarget(target.id)}
                      style={styles.targetRow}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.targetName}>{target.name}</Text>
                      <View style={styles.targetTypeTagSpacer}>
                        <TargetTypeTag type={target.type} />
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>

            <View style={styles.actionRow}>
              <View style={styles.actionButton}>
                <Button label="Save Rule" onPress={handleSave} testID="rule-save-button" />
              </View>
              <View style={styles.actionButton}>
                <Button label="Cancel" variant="secondary" onPress={onCancel} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: radius.xl + 5,
    borderTopRightRadius: radius.xl + 5,
    maxHeight: "92%",
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  sheetContent: {
    paddingBottom: spacing.xxxl,
  },
  title: {
    color: colors.textLight,
    fontSize: fontSize.xl,
    fontWeight: "800",
    marginBottom: spacing.xl,
  },
  errorCard: {
    marginBottom: spacing.lg,
    borderColor: "rgba(239, 68, 68, 0.6)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: "600",
    marginBottom: spacing.sm - 2,
  },
  input: {
    color: colors.textLight,
    backgroundColor: colors.cardDark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg,
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    color: colors.textMuted,
  },
  dayChipTextActive: {
    color: colors.textLight,
    fontWeight: "700",
  },
  timeRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timeField: {
    flex: 1,
  },
  targetsList: {
    marginBottom: spacing.sm,
  },
  emptyTargetsText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    fontStyle: "italic",
    marginBottom: spacing.lg,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  targetTypeTagSpacer: {
    marginLeft: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm - 1,
    marginRight: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textLight,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  targetName: {
    flex: 1,
    color: colors.textLight,
    fontSize: fontSize.base,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
