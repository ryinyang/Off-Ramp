import { useCallback, useEffect, useState } from "react";
import { ConfigManager, UserConfig } from "@off-ramp/core";

import { MobileStorage } from "../adapters/MobileStorage";
import { STORAGE_KEYS } from "../background/monitorLoop";

const storage = new MobileStorage();
const configManager = new ConfigManager();

export interface UseOffRampConfigResult {
  config: UserConfig | null;
  isLoading: boolean;
  saveConfig: (next: UserConfig) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Loads/persists the shared `off_ramp_config` record used by the background monitor loop
 * (see src/background/monitorLoop.ts). Mirrors the load/save pattern the browser extension's
 * Options page uses directly against `ExtensionStorage` (apps/extension/src/options/index.tsx),
 * kept as plain component state rather than the core Zustand store so config writes always go
 * through the same persisted-storage path the background monitor reads from.
 */
export function useOffRampConfig(): UseOffRampConfigResult {
  const [config, setConfig] = useState<UserConfig | null>(null);

  const reload = useCallback(async () => {
    const storedJson = await storage.load(STORAGE_KEYS.config);
    if (storedJson) {
      try {
        setConfig(configManager.parseConfig(storedJson));
        return;
      } catch (e) {
        console.error("[Off-Ramp] Config parse error:", e);
      }
    }
    const defaultConfig = ConfigManager.createDefaultConfig();
    await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(defaultConfig));
    setConfig(defaultConfig);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveConfig = useCallback(async (next: UserConfig) => {
    setConfig(next);
    await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(next));
  }, []);

  return { config, isLoading: config === null, saveConfig, reload };
}
