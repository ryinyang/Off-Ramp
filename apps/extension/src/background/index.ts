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
  await reloadConfig();

  // Set up periodic evaluation timer tick every 3 seconds
  setInterval(runEvaluation, 3000);
}

async function reloadConfig() {
  const storedConfigJson = await storage.load("off_ramp_config");
  if (storedConfigJson) {
    try {
      currentConfig = configManager.parseConfig(storedConfigJson);
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
    if (isPaused) {
      engine.getTimerService().tick(null);
      const accumulators = engine.getTimerService().getAllAccumulators();
      await storage.save("off_ramp_accumulators", JSON.stringify(accumulators));
      console.log("[Off-Ramp] Monitoring is PAUSED - screen time frozen.");
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
      try {
        currentConfig = configManager.parseConfig(changes.off_ramp_config.newValue);
        console.log("[Off-Ramp] Real-time config update received from storage event.");
      } catch (err) {
        console.error("[Off-Ramp] Failed to parse updated config from storage event:", err);
      }
    }
  });
} else if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.off_ramp_config?.newValue) {
      try {
        currentConfig = configManager.parseConfig(changes.off_ramp_config.newValue);
        console.log("[Off-Ramp] Real-time config update received from storage event.");
      } catch (err) {
        console.error("[Off-Ramp] Failed to parse updated config from storage event:", err);
      }
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
