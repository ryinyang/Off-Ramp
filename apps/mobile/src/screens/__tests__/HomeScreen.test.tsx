import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConfigManager } from "@off-ramp/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import mockOffRampMonitor from "../../testing/mockOffRampMonitor";
import { MobileStorage } from "../../adapters/MobileStorage";
import { STORAGE_KEYS } from "../../background/monitorLoop";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = require("react-native");
    return <RNText testID="redirect">{href}</RNText>;
  },
}));

import HomeScreen from "../HomeScreen";

const configManager = new ConfigManager();

describe("HomeScreen", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockOffRampMonitor.hasUsageAccessPermission.mockReturnValue(true);
    mockOffRampMonitor.hasAccessibilityPermission.mockReturnValue(true);
  });

  it("redirects to onboarding when a required permission is missing", async () => {
    mockOffRampMonitor.hasAccessibilityPermission.mockReturnValue(false);
    await render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("redirect").props.children).toBe("/onboarding/permissions");
    });
  });

  it("renders the configured rules once permissions are granted", async () => {
    const config = ConfigManager.createDefaultConfig();
    const storage = new MobileStorage();
    await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(config));

    await render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("home-screen")).toBeTruthy();
    });
    expect(screen.getByText("TikTok")).toBeTruthy();
  });

  it("(re)starts the background monitoring service if it isn't already running", async () => {
    mockOffRampMonitor.isMonitoringServiceRunning.mockReturnValue(false);

    await render(<HomeScreen />);

    await waitFor(() => {
      expect(mockOffRampMonitor.startMonitoringService).toHaveBeenCalled();
    });
  });

  it("does not redundantly restart the service when it is already running", async () => {
    mockOffRampMonitor.isMonitoringServiceRunning.mockReturnValue(true);

    await render(<HomeScreen />);
    await waitFor(() => expect(screen.getByTestId("home-screen")).toBeTruthy());

    expect(mockOffRampMonitor.startMonitoringService).not.toHaveBeenCalled();
  });

  it("toggles the monitoring switch and persists the paused flag", async () => {
    const config = ConfigManager.createDefaultConfig();
    const storage = new MobileStorage();
    await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(config));

    await render(<HomeScreen />);
    await waitFor(() => expect(screen.getByTestId("monitoring-toggle")).toBeTruthy());

    await fireEvent(screen.getByTestId("monitoring-toggle"), "valueChange", false);

    await waitFor(async () => {
      expect(await storage.load(STORAGE_KEYS.paused)).toBe("true");
    });
  });
});
