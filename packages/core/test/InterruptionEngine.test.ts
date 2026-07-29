import { describe, it, expect, vi } from "vitest";
import { InterruptionEngine } from "../src/services/InterruptionEngine.js";
import { ConfigManager } from "../src/services/ConfigManager.js";
import { IPlatformMonitor } from "../src/adapters/IPlatformMonitor.js";
import { IPlatformTrigger } from "../src/adapters/IPlatformTrigger.js";

describe("InterruptionEngine", () => {
  it("triggers focus-switch interruption when time limit is exceeded", async () => {
    let mockActivity: string | null = "com.zhiliaoapp.musically";

    const mockMonitor: IPlatformMonitor = {
      getCurrentActivity: vi.fn(async () => mockActivity),
    };

    const mockTrigger: IPlatformTrigger = {
      fireInterruption: vi.fn(async () => {}),
    };

    const engine = new InterruptionEngine(mockMonitor, mockTrigger);
    const config = ConfigManager.createDefaultConfig();

    // Set rule allowed minutes to 1 min (60 seconds) for easy testing
    config.rules[0].allowedMinutes = 1;
    config.rules[0].interruptionSeconds = 30;

    // Active monday morning
    const testDate = new Date("2026-07-27T10:00:00Z");
    testDate.setHours(10, 0, 0, 0);

    // Initial tick (0s)
    let fired = await engine.evaluate(config, testDate);
    expect(fired).toBe(false);
    expect(mockTrigger.fireInterruption).not.toHaveBeenCalled();

    // Advance time by 61 seconds
    const futureDate = new Date(testDate.getTime() + 61000);
    futureDate.setHours(10, 1, 1, 0);

    fired = await engine.evaluate(config, futureDate);
    expect(fired).toBe(true);
    expect(mockTrigger.fireInterruption).toHaveBeenCalledWith(30, config.rules[0].message);
  });
});
