import { IPlatformMonitor } from "@off-ramp/core";

import OffRampMonitor from "../../modules/off-ramp-monitor/src/OffRampMonitorModule";

/**
 * Backs `IPlatformMonitor` with Android's `UsageStatsManager`, polled through the
 * off-ramp-monitor native module (see ForegroundAppTracker.kt for how "current foreground app"
 * is derived from usage events).
 */
export class AndroidUsageMonitor implements IPlatformMonitor {
  public async getCurrentActivity(): Promise<string | null> {
    try {
      return await OffRampMonitor.getForegroundPackageName();
    } catch {
      return null;
    }
  }
}
