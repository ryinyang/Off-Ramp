import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConfigManager } from "@off-ramp/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import mockOffRampMonitor from "../../testing/mockOffRampMonitor";
import { MobileStorage } from "../../adapters/MobileStorage";
import { STORAGE_KEYS } from "../../background/monitorLoop";
import TargetSelectorScreen from "../TargetSelectorScreen";

const configManager = new ConfigManager();

async function seedEmptyConfig() {
  const storage = new MobileStorage();
  const config = { ...ConfigManager.createDefaultConfig(), targets: [], rules: [] };
  await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(config));
  return config;
}

describe("TargetSelectorScreen", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockOffRampMonitor.getInstalledLaunchableApps.mockResolvedValue([
      { packageName: "com.instagram.android", appName: "Instagram", icon: null },
      { packageName: "com.zhiliaoapp.musically", appName: "TikTok", icon: null },
    ]);
  });

  it("lists installed apps that are not already monitored", async () => {
    await seedEmptyConfig();
    await render(<TargetSelectorScreen />);

    await waitFor(() => expect(screen.getByText("Instagram")).toBeTruthy());
    expect(screen.getByText("TikTok")).toBeTruthy();
  });

  it("adding an installed app persists it as a monitored target and removes it from the picker", async () => {
    await seedEmptyConfig();
    await render(<TargetSelectorScreen />);

    await waitFor(() => expect(screen.getByText("Instagram")).toBeTruthy());
    await fireEvent.press(screen.getByText("Instagram"));

    const storage = new MobileStorage();
    await waitFor(async () => {
      const stored = configManager.parseConfig((await storage.load(STORAGE_KEYS.config))!);
      expect(stored.targets.some((t) => t.identifier === "com.instagram.android")).toBe(true);
    });
  });

  it("adding a website normalizes the domain before saving", async () => {
    await seedEmptyConfig();
    await render(<TargetSelectorScreen />);

    await fireEvent.press(await screen.findByText("+ Add Website Target"));
    await fireEvent.changeText(
      screen.getByPlaceholderText("Website name (e.g. YouTube)"),
      "Reddit"
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Domain (e.g. youtube.com)"),
      "https://www.reddit.com/r/all"
    );
    await fireEvent.press(screen.getByText("Add Website"));

    const storage = new MobileStorage();
    await waitFor(async () => {
      const stored = configManager.parseConfig((await storage.load(STORAGE_KEYS.config))!);
      expect(stored.targets.find((t) => t.name === "Reddit")?.identifier).toBe("reddit.com");
    });
  });

  it("tags a same-named app and website target so they are never ambiguous", async () => {
    const base = ConfigManager.createDefaultConfig();
    const config = {
      ...base,
      targets: [
        { id: "target-youtube-app", name: "YouTube", identifier: "com.google.android.youtube", type: "app" as const },
        { id: "target-youtube-site", name: "YouTube", identifier: "youtube.com", type: "website" as const },
      ],
      rules: [],
    };
    const storage = new MobileStorage();
    await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(config));

    await render(<TargetSelectorScreen />);

    await waitFor(() => expect(screen.getAllByText("YouTube")).toHaveLength(2));
    expect(screen.getByText("APP")).toBeTruthy();
    expect(screen.getByText("SITE")).toBeTruthy();
  });

  it("removing a monitored target also removes it from any rule that referenced it", async () => {
    const base = ConfigManager.createDefaultConfig();
    const storage = new MobileStorage();
    await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(base));

    await render(<TargetSelectorScreen />);
    await waitFor(() => expect(screen.getByText("TikTok")).toBeTruthy());

    await fireEvent.press(screen.getByLabelText("Remove TikTok"));

    await waitFor(async () => {
      const stored = configManager.parseConfig((await storage.load(STORAGE_KEYS.config))!);
      expect(stored.targets.some((t) => t.name === "TikTok")).toBe(false);
      expect(stored.rules[0].targetIds).not.toContain("target-tiktok");
    });
  });
});
