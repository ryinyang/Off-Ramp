import React, { useEffect, useState } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../components/ui";
import { colors, fontSize, spacing } from "../theme";

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function BreakScreen() {
  const params = useLocalSearchParams<{ duration?: string; message?: string }>();
  const durationSeconds = Math.max(1, Number(params.duration) || 30);
  const message = params.message || "Time to take a break and give yourself an off-ramp.";

  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timeout = setTimeout(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(timeout);
  }, [timeLeft]);

  // Strict break enforcement: the hardware back button cannot dismiss the break early.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, []);

  const isActive = timeLeft > 0;

  return (
    <SafeAreaView style={styles.safeArea} testID="break-screen">
      <View style={styles.content}>
        <Text style={styles.eyebrow}>OFF-RAMP BREAK</Text>
        <Text style={styles.countdown} testID="break-countdown">
          {formatCountdown(timeLeft)}
        </Text>
        <Text style={styles.message}>{message}</Text>

        <Button
          label={isActive ? "Break in progress…" : "End Break & Return"}
          disabled={isActive}
          onPress={() => router.replace("/")}
          testID="break-return-button"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.md - 1,
  },
  countdown: {
    color: colors.textLight,
    fontSize: fontSize.huge,
    fontWeight: "800",
    marginBottom: spacing.xl + 1,
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.xxxl + 12,
  },
});
