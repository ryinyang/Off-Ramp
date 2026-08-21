import React from "react";
import { ScrollView, StyleSheet, View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "../theme";

interface ScreenProps extends ViewProps {
  scroll?: boolean;
}

/** Shared full-bleed dark background wrapper used by every route. */
export function Screen({ children, style, scroll = false, ...rest }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      {scroll ? (
        <ScrollView
          style={[styles.content, style]}
          contentContainerStyle={styles.scrollContent}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, style]} {...rest}>
          {children}
        </View>
      )}
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
    paddingHorizontal: spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});
