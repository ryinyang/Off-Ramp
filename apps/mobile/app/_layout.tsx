import "../src/background/registerHeadlessTask";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors } from "../src/theme";

const HEADER_OPTIONS = {
  headerStyle: { backgroundColor: colors.backgroundDark },
  headerTintColor: colors.textLight,
  headerTitleStyle: { fontWeight: "700" as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.backgroundDark },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={HEADER_OPTIONS}>
        <Stack.Screen name="index" options={{ title: "Off-Ramp" }} />
        <Stack.Screen name="onboarding/permissions" options={{ title: "Permissions" }} />
        <Stack.Screen name="targets" options={{ title: "Apps & Websites" }} />
        <Stack.Screen name="rules" options={{ title: "Rules" }} />
        <Stack.Screen name="break" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
