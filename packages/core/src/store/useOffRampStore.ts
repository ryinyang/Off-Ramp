import { create } from "zustand";
import { UserConfig, Target, Schedule, Rule } from "../types/config.js";
import { ConfigManager } from "../services/ConfigManager.js";

export interface OffRampState {
  config: UserConfig;
  isMonitoringEnabled: boolean;

  // Actions
  setConfig: (config: UserConfig) => void;
  toggleMonitoring: () => void;
  addTarget: (target: Target) => void;
  removeTarget: (targetId: string) => void;
  addSchedule: (schedule: Schedule) => void;
  addRule: (rule: Rule) => void;
  exportConfigJson: () => string;
  importConfigJson: (jsonString: string) => void;
}

const configManager = new ConfigManager();

export const useOffRampStore = create<OffRampState>((set, get) => ({
  config: ConfigManager.createDefaultConfig(),
  isMonitoringEnabled: true,

  setConfig: (config: UserConfig) => set({ config }),

  toggleMonitoring: () => set((state) => ({ isMonitoringEnabled: !state.isMonitoringEnabled })),

  addTarget: (target: Target) =>
    set((state) => ({
      config: {
        ...state.config,
        targets: [...state.config.targets, target],
        updatedAt: new Date().toISOString(),
      },
    })),

  removeTarget: (targetId: string) =>
    set((state) => ({
      config: {
        ...state.config,
        targets: state.config.targets.filter((t) => t.id !== targetId),
        rules: state.config.rules.map((r) => ({
          ...r,
          targetIds: r.targetIds.filter((id) => id !== targetId),
        })),
        updatedAt: new Date().toISOString(),
      },
    })),

  addSchedule: (schedule: Schedule) =>
    set((state) => ({
      config: {
        ...state.config,
        schedules: [...state.config.schedules, schedule],
        updatedAt: new Date().toISOString(),
      },
    })),

  addRule: (rule: Rule) =>
    set((state) => ({
      config: {
        ...state.config,
        rules: [...state.config.rules, rule],
        updatedAt: new Date().toISOString(),
      },
    })),

  exportConfigJson: () => configManager.serializeConfig(get().config),

  importConfigJson: (jsonString: string) => {
    const parsed = configManager.parseConfig(jsonString);
    set({ config: parsed });
  },
}));
