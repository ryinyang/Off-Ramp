import { IPlatformTrigger } from "@off-ramp/core";

import OffRampMonitor from "../../modules/off-ramp-monitor/src/OffRampMonitorModule";

/**
 * Backs `IPlatformTrigger` via Android's Accessibility Service, which fires a forced
 * `startActivity()` launch intent targeting Off-Ramp's break screen
 * (see OffRampAccessibilityService.kt, `fireBreakActivity`).
 */
export class AndroidFocusSwitchTrigger implements IPlatformTrigger {
  public async fireInterruption(durationSeconds: number, message: string): Promise<void> {
    OffRampMonitor.requestFocusSwitch(durationSeconds, message);
  }
}
