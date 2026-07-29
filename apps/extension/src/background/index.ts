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
    } catch (e) {
      console.error("[Off-Ramp] Failed to load stored config, using defaults:", e);
    }
  } else {
    await storage.save("off_ramp_config", configManager.serializeConfig(currentConfig));
  }

  // Set up periodic evaluation timer tick every 3 seconds
  setInterval(runEvaluation, 3000);
}

async function runEvaluation() {
  try {
    await engine.evaluate(currentConfig);
  } catch (err) {
    console.error("[Off-Ramp] Evaluation error:", err);
  }
}

// Event Listeners for Tab Switches and URL Navigation
if (typeof chrome !== "undefined" && chrome.tabs) {
  chrome.tabs.onActivated.addListener(() => {
    runEvaluation();
  });
  chrome.tabs.onUpdated.addListener((_, changeInfo) => {
    if (changeInfo.status === "complete" || changeInfo.url) {
      runEvaluation();
    }
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.off_ramp_config) {
      try {
        currentConfig = configManager.parseConfig(changes.off_ramp_config.newValue);
        console.log("[Off-Ramp] Background config updated live");
      } catch (e) {
        console.error("[Off-Ramp] Live config parse failed:", e);
      }
    }
  });
}

initBackground();
