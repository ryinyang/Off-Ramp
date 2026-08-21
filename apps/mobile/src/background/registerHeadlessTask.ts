import { AppRegistry } from "react-native";

import { createMonitorContext, MonitorContext, runEvaluationTick } from "./monitorLoop";

const TASK_NAME = "OffRampMonitorTask";

let sharedContext: MonitorContext | null = null;

function getSharedContext(): MonitorContext {
  if (!sharedContext) {
    sharedContext = createMonitorContext();
  }
  return sharedContext;
}

/**
 * Registered as a Headless JS task so `OffRampForegroundService` (Kotlin) can drive one
 * `runEvaluationTick` roughly every 3 seconds while the app is backgrounded, without needing any
 * visible Activity. The task resolves immediately after each tick; the native service is
 * responsible for re-invoking it on its own schedule (see OffRampForegroundService.kt).
 */
AppRegistry.registerHeadlessTask(TASK_NAME, () => async () => {
  try {
    await runEvaluationTick(getSharedContext());
  } catch (e) {
    console.error("[Off-Ramp] Headless monitor tick failed:", e);
  }
});
