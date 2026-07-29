import { describe, it, expect, vi } from "vitest";
import { InterruptionEngine, ConfigManager, IPlatformMonitor, IPlatformTrigger } from "../src/index.js";

describe("ActiveBreakCooldown Enforcement", () => {
  it("enforces remaining break cooldown when opening another target website/app during active break", async () => {
    let mockActivity: string | null = "reddit.com";

    const mockMonitor: IPlatformMonitor = {
      getCurrentActivity: vi.fn(async () => mockActivity),
    };

    const mockTrigger: IPlatformTrigger = {
      fireInterruption: vi.fn(async () => {}),
    };

    const engine = new InterruptionEngine(mockMonitor, mockTrigger);
    const config = ConfigManager.createDefaultConfig();

    // 1 minute allowed (60s), 30s break duration
    config.rules[0].allowedMinutes = 1;
    config.rules[0].interruptionSeconds = 30;

    const baseTime = new Date("2026-07-27T10:00:00Z");
    baseTime.setHours(10, 0, 0, 0);

    // Initial tick (0s)
    await engine.evaluate(config, baseTime);

    // Advance 61 seconds on reddit.com -> limit reached, 30s break triggered
    const timeLimitReached = new Date(baseTime.getTime() + 61000);
    const firedFirst = await engine.evaluate(config, timeLimitReached);
    expect(firedFirst).toBe(true);
    expect(mockTrigger.fireInterruption).toHaveBeenLastCalledWith(30, config.rules[0].message);

    // 10 seconds later (T + 71s): User tries to open TikTok (another targeted app)
    mockActivity = "com.zhiliaoapp.musically";
    const timeAttemptTargetTwo = new Date(baseTime.getTime() + 71000);

    const firedSecond = await engine.evaluate(config, timeAttemptTargetTwo);
    expect(firedSecond).toBe(true);
    // Remaining break duration = 30s - 10s = 20s
    expect(mockTrigger.fireInterruption).toHaveBeenLastCalledWith(20, config.rules[0].message);

    // 15 seconds later (T + 76s): User opens GitHub (a non-targeted website)
    mockActivity = "github.com";
    const timeAttemptNonTarget = new Date(baseTime.getTime() + 76000);

    const firedThird = await engine.evaluate(config, timeAttemptNonTarget);
    expect(firedThird).toBe(false);

    // 35 seconds later (T + 96s): Break cooldown expired (30s passed)
    mockActivity = "reddit.com";
    const timeAfterBreakExpired = new Date(baseTime.getTime() + 96000);

    const firedFourth = await engine.evaluate(config, timeAfterBreakExpired);
    expect(firedFourth).toBe(false);
    expect(engine.getActiveBreakUntil()).toBeNull();
  });
});
