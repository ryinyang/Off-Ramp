import { describe, it, expect, vi } from "vitest";
import { InterruptionEngine } from "../src/services/InterruptionEngine.js";
import { ConfigManager } from "../src/services/ConfigManager.js";
import { IPlatformMonitor } from "../src/adapters/IPlatformMonitor.js";
import { IPlatformTrigger } from "../src/adapters/IPlatformTrigger.js";

describe("InterruptionEngine", () => {
  it("triggers focus-switch interruption when time limit is exceeded", async () => {
    const mockActivity: string | null = "com.zhiliaoapp.musically";

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

  it("accumulates screen time at the rule level across multiple targeted websites", async () => {
    let currentDomain: string | null = "reddit.com";

    const mockMonitor: IPlatformMonitor = {
      getCurrentActivity: vi.fn(async () => currentDomain),
    };

    const mockTrigger: IPlatformTrigger = {
      fireInterruption: vi.fn(async () => {}),
    };

    const engine = new InterruptionEngine(mockMonitor, mockTrigger);
    const config = ConfigManager.createDefaultConfig();

    // Rule 0 targets both reddit.com and com.zhiliaoapp.musically with a 2-minute limit (120s)
    config.rules[0].allowedMinutes = 2;
    config.rules[0].targetIds = ["target-reddit", "target-tiktok"];

    const startTime = new Date("2026-07-27T10:00:00Z");

    // Spend 45 seconds on Reddit
    await engine.evaluate(config, startTime);
    await engine.evaluate(config, new Date(startTime.getTime() + 45000));
    expect(engine.getTimerService().getAccumulatedSeconds(config.rules[0].id)).toBe(45);

    // Switch to TikTok and spend 80 seconds on TikTok (45s Reddit + 80s TikTok = 125s total > 120s limit)
    currentDomain = "com.zhiliaoapp.musically";
    await engine.evaluate(config, new Date(startTime.getTime() + 45000));
    const fired = await engine.evaluate(config, new Date(startTime.getTime() + 125000));

    expect(fired).toBe(true);
    expect(mockTrigger.fireInterruption).toHaveBeenCalledWith(
      config.rules[0].interruptionSeconds,
      config.rules[0].message
    );
  });
});
