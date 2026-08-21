import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConfigManager } from "@off-ramp/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { MobileStorage } from "../../adapters/MobileStorage";
import { STORAGE_KEYS } from "../../background/monitorLoop";
import RulesScreen from "../RulesScreen";

const configManager = new ConfigManager();

describe("RulesScreen", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("toggling a rule's enabled switch persists the change", async () => {
    const base = ConfigManager.createDefaultConfig();
    const storage = new MobileStorage();
    await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(base));

    await render(<RulesScreen />);
    await waitFor(() => expect(screen.getByText(/min allowed/)).toBeTruthy());

    const toggle = screen.getByTestId(`rule-toggle-${base.rules[0].id}`);
    await fireEvent(toggle, "valueChange", false);

    await waitFor(async () => {
      const stored = configManager.parseConfig((await storage.load(STORAGE_KEYS.config))!);
      expect(stored.rules[0].enabled).toBe(false);
    });
  });

  it("deleting a rule removes it and its unshared schedule", async () => {
    const base = ConfigManager.createDefaultConfig();
    const storage = new MobileStorage();
    await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(base));

    await render(<RulesScreen />);
    await waitFor(() => expect(screen.getByText("Delete")).toBeTruthy());

    await fireEvent.press(screen.getByText("Delete"));

    await waitFor(async () => {
      const stored = configManager.parseConfig((await storage.load(STORAGE_KEYS.config))!);
      expect(stored.rules).toHaveLength(0);
      expect(stored.schedules.find((s) => s.id === "sched-workdays")).toBeUndefined();
    });
  });

  it("creating a rule through the editor modal adds it to the list", async () => {
    const base = { ...ConfigManager.createDefaultConfig(), rules: [] };
    const storage = new MobileStorage();
    await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(base));

    await render(<RulesScreen />);
    await waitFor(() => expect(screen.getByTestId("create-rule-button")).toBeTruthy());

    await fireEvent.press(screen.getByTestId("create-rule-button"));
    await fireEvent.press(screen.getByTestId("rule-save-button"));

    await waitFor(async () => {
      const stored = configManager.parseConfig((await storage.load(STORAGE_KEYS.config))!);
      expect(stored.rules).toHaveLength(1);
      expect(stored.rules[0].allowedMinutes).toBe(15);
    });
  });
});
