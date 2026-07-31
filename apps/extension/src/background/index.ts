import { ConfigManager, InterruptionEngine, UserConfig } from "@off-ramp/core";
import { ExtensionStorage } from "../adapters/ExtensionStorage";
import { WebTabMonitor } from "../adapters/WebTabMonitor";
import { WebTabRedirectTrigger } from "../adapters/WebTabRedirectTrigger";

export {};

const storage = new ExtensionStorage();
const monitor = new WebTabMonitor();
const trigger = new WebTabRedirectTrigger();
const engine = new InterruptionEngine(monitor, trigger);
const configManager = new ConfigManager();

let currentConfig: UserConfig = ConfigManager.createDefaultConfig();

async function initBackground() {
  console.log("[Off-Ramp] Background Service Worker Initialized");
  await hydrateAccumulatorsFromStorage();
  await reloadConfig();

  // Set up periodic evaluation timer tick every 3 seconds
  setInterval(runEvaluation, 3000);
}

async function hydrateAccumulatorsFromStorage() {
  const savedAccJson = await storage.load("off_ramp_accumulators");
  if (savedAccJson) {
    try {
      const accObj = JSON.parse(savedAccJson);
      if (accObj && typeof accObj === "object") {
        engine.getTimerService().hydrateAccumulators(accObj as Record<string, number>);
      }
    } catch (e) {
      console.error("[Off-Ramp] Failed to hydrate accumulators from storage:", e);
    }
  }
}

async function reloadConfig() {
  const storedConfigJson = await storage.load("off_ramp_config");
  if (storedConfigJson) {
    try {
      const parsedConfig = configManager.parseConfig(storedConfigJson);

      // If user updated rule limits and current accumulators are within new limits, clear old active break cooldown
      if (engine.getActiveBreakUntil() !== null) {
        let allRulesWithinLimits = true;
        for (const newRule of parsedConfig.rules) {
          if (newRule.enabled) {
            const accSecs = engine.getTimerService().getAccumulatedSeconds(newRule.id);
            const allowedSecs = newRule.allowedMinutes * 60;
            if (accSecs >= allowedSecs) {
              allRulesWithinLimits = false;
              break;
            }
          }
        }
        if (allRulesWithinLimits) {
          console.log("[Off-Ramp] Rule limits updated — clearing active break cooldown.");
          engine.clearActiveBreak();
        }
      }

      currentConfig = parsedConfig;
    } catch (e) {
      console.error("[Off-Ramp] Failed to parse config from storage:", e);
    }
  } else {
    console.log("[Off-Ramp] No config found in storage, saving defaults");
    await storage.save("off_ramp_config", configManager.serializeConfig(currentConfig));
  }
}

async function runEvaluation() {
  try {
    // Always reload latest configuration to pick up dynamic target/rule edits in real time
    await reloadConfig();

    const isPaused = (await storage.load("off_ramp_paused")) === "true";
    const pausedUntilStr = await storage.load("off_ramp_paused_until");

    if (isPaused && pausedUntilStr) {
      const pausedUntilMs = parseInt(pausedUntilStr, 10);
      if (!isNaN(pausedUntilMs) && Date.now() >= pausedUntilMs) {
        await storage.save("off_ramp_paused", "false");
        await storage.save("off_ramp_paused_until", "");
        console.log("[Off-Ramp] Session pause expired — monitoring resumed automatically.");
      }
    }

    const currentPausedState = (await storage.load("off_ramp_paused")) === "true";
    if (currentPausedState) {
      engine.getTimerService().tick(null);
      const accumulators = engine.getTimerService().getAllAccumulators();
      await storage.save("off_ramp_accumulators", JSON.stringify(accumulators));
      console.log("[Off-Ramp] Monitoring is PAUSED — screen time frozen.");
      return;
    }

    const currentActivity = await monitor.getCurrentActivity();
    const evaluated = await engine.evaluate(currentConfig);
    const accumulators = engine.getTimerService().getAllAccumulators();
    await storage.save("off_ramp_accumulators", JSON.stringify(accumulators));

    const ruleLogs = currentConfig.rules
      .map((r) => {
        const acc = accumulators[r.id] || 0;
        const limitSecs = r.allowedMinutes * 60;
        return `${r.id}: ${acc.toFixed(1)}s/${limitSecs}s`;
      })
      .join(" | ");

    console.log(
      `[Off-Ramp] Tick | Activity: "${currentActivity ?? "none"}" | Rule Accumulators: [ ${ruleLogs} ] | Triggered: ${evaluated}`
    );
  } catch (err) {
    console.error("[Off-Ramp] Evaluation error:", err);
  }
}

// Storage Change Listener for Real-Time Config Updates
if (typeof browser !== "undefined" && browser.storage && browser.storage.onChanged) {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.off_ramp_config?.newValue) {
      reloadConfig();
    }
  });
} else if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.off_ramp_config?.newValue) {
      reloadConfig();
    }
  });
}

// Event Listeners for Tab Switches and URL Navigation
if (typeof browser !== "undefined" && browser.tabs) {
  browser.tabs.onActivated.addListener(() => runEvaluation());
  browser.tabs.onUpdated.addListener((_, changeInfo) => {
    if (changeInfo.status === "complete" || changeInfo.url) {
      runEvaluation();
    }
  });
} else if (typeof chrome !== "undefined" && chrome.tabs) {
  chrome.tabs.onActivated.addListener(() => runEvaluation());
  chrome.tabs.onUpdated.addListener((_, changeInfo) => {
    if (changeInfo.status === "complete" || changeInfo.url) {
      runEvaluation();
    }
  });
}

initBackground();
