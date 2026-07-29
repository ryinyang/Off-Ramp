import {
  ConfigManager,
  InterruptionEngine,
  UserConfig,
} from "@off-ramp/core";
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
  const storedConfigJson = await storage.load("off_ramp_config");
  if (storedConfigJson) {
    try {
      currentConfig = configManager.parseConfig(storedConfigJson);
      console.log("[Off-Ramp] Loaded saved config from storage");
    } catch (e) {
      console.error("[Off-Ramp] Failed to load stored config, using defaults:", e);
    }
  } else {
    console.log("[Off-Ramp] No config found in storage, saving defaults");
    await storage.save("off_ramp_config", configManager.serializeConfig(currentConfig));
  }

  // Set up periodic evaluation timer tick every 3 seconds
  setInterval(runEvaluation, 3000);
}

async function runEvaluation() {
  try {
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

    const accumulated = currentActivity
      ? engine.getTimerService().getAccumulatedSeconds(currentActivity)
      : 0;

    console.log(
      `[Off-Ramp] Tick | Activity: "${currentActivity ?? "none"}" | Accumulated: ${accumulated.toFixed(1)}s | Triggered: ${evaluated}`
    );
  } catch (err) {
    console.error("[Off-Ramp] Evaluation error:", err);
  }
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
