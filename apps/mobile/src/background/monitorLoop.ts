import { ConfigManager, InterruptionEngine, UserConfig } from "@off-ramp/core";

import { AndroidFocusSwitchTrigger } from "../adapters/AndroidFocusSwitchTrigger";
import { AndroidUsageMonitor } from "../adapters/AndroidUsageMonitor";
import { MobileStorage } from "../adapters/MobileStorage";

export const STORAGE_KEYS = {
  config: "off_ramp_config",
  accumulators: "off_ramp_accumulators",
  paused: "off_ramp_paused",
} as const;

export interface MonitorContext {
  storage: MobileStorage;
  monitor: AndroidUsageMonitor;
  trigger: AndroidFocusSwitchTrigger;
  engine: InterruptionEngine;
  configManager: ConfigManager;
  currentConfig: UserConfig;
  hydrated: boolean;
}

export function createMonitorContext(): MonitorContext {
  const storage = new MobileStorage();
  const monitor = new AndroidUsageMonitor();
  const trigger = new AndroidFocusSwitchTrigger();
  const engine = new InterruptionEngine(monitor, trigger);
  const configManager = new ConfigManager();

  return {
    storage,
    monitor,
    trigger,
    engine,
    configManager,
    currentConfig: ConfigManager.createDefaultConfig(),
    hydrated: false,
  };
}

export async function hydrateAccumulatorsFromStorage(ctx: MonitorContext): Promise<void> {
  const savedAccJson = await ctx.storage.load(STORAGE_KEYS.accumulators);
  if (savedAccJson) {
    try {
      const accObj = JSON.parse(savedAccJson);
      if (accObj && typeof accObj === "object") {
        ctx.engine.getTimerService().hydrateAccumulators(accObj as Record<string, number>);
      }
    } catch (e) {
      console.error("[Off-Ramp] Failed to hydrate accumulators from storage:", e);
    }
  }
  ctx.hydrated = true;
}

/**
 * Reloads the latest config from storage so target/rule/schedule edits made from the RulesScreen
 * and TargetSelectorScreen take effect on the very next tick — matching the browser extension's
 * `reloadConfig()` in apps/extension/src/background/index.ts. If a rule's allowed time limit was
 * increased beyond the currently accumulated screen time, any active break cooldown is cleared.
 */
export async function reloadConfig(ctx: MonitorContext): Promise<void> {
  const storedConfigJson = await ctx.storage.load(STORAGE_KEYS.config);
  if (!storedConfigJson) {
    ctx.currentConfig = ConfigManager.createDefaultConfig();
    await ctx.storage.save(STORAGE_KEYS.config, ctx.configManager.serializeConfig(ctx.currentConfig));
    return;
  }

  try {
    const parsedConfig = ctx.configManager.parseConfig(storedConfigJson);

    if (ctx.engine.getActiveBreakUntil() !== null) {
      let allRulesWithinLimits = true;
      for (const rule of parsedConfig.rules) {
        if (!rule.enabled) continue;
        const accSecs = ctx.engine.getTimerService().getAccumulatedSeconds(rule.id);
        const allowedSecs = rule.allowedMinutes * 60;
        if (accSecs >= allowedSecs) {
          allRulesWithinLimits = false;
          break;
        }
      }
      if (allRulesWithinLimits) {
        console.log("[Off-Ramp] Rule limits updated — clearing active break cooldown.");
        ctx.engine.clearActiveBreak();
      }
    }

    ctx.currentConfig = parsedConfig;
  } catch (e) {
    console.error("[Off-Ramp] Failed to parse config from storage:", e);
  }
}

/**
 * Runs a single evaluation tick: reload config, evaluate the InterruptionEngine against the
 * current foreground app, and persist accumulated screen time. Mirrors one call to
 * `runEvaluation()` in the browser extension's background worker.
 */
export async function runEvaluationTick(
  ctx: MonitorContext,
  now: Date = new Date()
): Promise<boolean> {
  if (!ctx.hydrated) {
    await hydrateAccumulatorsFromStorage(ctx);
  }

  await reloadConfig(ctx);

  const isPaused = (await ctx.storage.load(STORAGE_KEYS.paused)) === "true";
  if (isPaused) {
    ctx.engine.getTimerService().tick(null, now.getTime());
    await ctx.storage.save(
      STORAGE_KEYS.accumulators,
      JSON.stringify(ctx.engine.getTimerService().getAllAccumulators())
    );
    return false;
  }

  const evaluated = await ctx.engine.evaluate(ctx.currentConfig, now);
  await ctx.storage.save(
    STORAGE_KEYS.accumulators,
    JSON.stringify(ctx.engine.getTimerService().getAllAccumulators())
  );

  return evaluated;
}
