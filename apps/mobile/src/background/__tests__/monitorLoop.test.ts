import { ConfigManager, UserConfig } from "@off-ramp/core";
import AsyncStorage from "@react-native-async-storage/async-storage";

import mockOffRampMonitor from "../../testing/mockOffRampMonitor";
import { MobileStorage } from "../../adapters/MobileStorage";
import { createMonitorContext, MonitorContext, runEvaluationTick, STORAGE_KEYS } from "../monitorLoop";

const configManager = new ConfigManager();

function baseConfig(overrides: Partial<UserConfig> = {}): UserConfig {
  return {
    version: 1,
    targets: [{ id: "target-tiktok", name: "TikTok", identifier: "com.tiktok", type: "app" }],
    schedules: [
      {
        id: "sched-all-day",
        name: "All Day",
        activeDays: [1, 2, 3, 4, 5, 6, 7],
        startTime: "00:00",
        endTime: "23:59",
        enabled: true,
      },
    ],
    rules: [
      {
        id: "rule-1",
        allowedMinutes: 1,
        interruptionSeconds: 30,
        message: "Take a break!",
        targetIds: ["target-tiktok"],
        scheduleId: "sched-all-day",
        enabled: true,
      },
    ],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

async function seedConfig(config: UserConfig) {
  const storage = new MobileStorage();
  await storage.save(STORAGE_KEYS.config, configManager.serializeConfig(config));
}

describe("monitorLoop", () => {
  let ctx: MonitorContext;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    ctx = createMonitorContext();
  });

  it("accumulates screen time across ticks while the target app stays foreground", async () => {
    await seedConfig(baseConfig());
    mockOffRampMonitor.getForegroundPackageName.mockResolvedValue("com.tiktok");

    const start = new Date(2026, 0, 1, 9, 0, 0);
    await runEvaluationTick(ctx, start);
    await runEvaluationTick(ctx, new Date(start.getTime() + 20_000));

    expect(ctx.engine.getTimerService().getAccumulatedSeconds("rule-1")).toBe(20);
    expect(mockOffRampMonitor.requestFocusSwitch).not.toHaveBeenCalled();
  });

  it("fires the focus-switch trigger once accumulated time reaches the rule's allowed minutes", async () => {
    await seedConfig(baseConfig());
    mockOffRampMonitor.getForegroundPackageName.mockResolvedValue("com.tiktok");

    const start = new Date(2026, 0, 1, 9, 0, 0);
    await runEvaluationTick(ctx, start);
    // 60s later crosses the 1-minute allowed limit.
    await runEvaluationTick(ctx, new Date(start.getTime() + 60_000));

    expect(mockOffRampMonitor.requestFocusSwitch).toHaveBeenCalledWith(30, "Take a break!");
  });

  it("persists accumulators to storage after every tick", async () => {
    await seedConfig(baseConfig());
    mockOffRampMonitor.getForegroundPackageName.mockResolvedValue("com.tiktok");

    const start = new Date(2026, 0, 1, 9, 0, 0);
    await runEvaluationTick(ctx, start);
    await runEvaluationTick(ctx, new Date(start.getTime() + 10_000));

    const storage = new MobileStorage();
    const stored = JSON.parse((await storage.load(STORAGE_KEYS.accumulators)) ?? "{}");
    expect(stored["rule-1"]).toBe(10);
  });

  it("hydrates accumulators saved by a previous process on the first tick", async () => {
    await seedConfig(baseConfig());
    const storage = new MobileStorage();
    await storage.save(STORAGE_KEYS.accumulators, JSON.stringify({ "rule-1": 45 }));
    mockOffRampMonitor.getForegroundPackageName.mockResolvedValue(null);

    await runEvaluationTick(ctx, new Date(2026, 0, 1, 9, 0, 0));

    expect(ctx.engine.getTimerService().getAccumulatedSeconds("rule-1")).toBe(45);
  });

  it("picks up a newly added target on the very next tick without restarting", async () => {
    await seedConfig(baseConfig());
    mockOffRampMonitor.getForegroundPackageName.mockResolvedValue("com.reddit");

    const start = new Date(2026, 0, 1, 9, 0, 0);
    await runEvaluationTick(ctx, start);
    expect(ctx.engine.getTimerService().getAccumulatedSeconds("rule-1")).toBe(0);

    const updated = baseConfig();
    updated.targets.push({ id: "target-reddit", name: "Reddit", identifier: "com.reddit", type: "app" });
    updated.rules[0].targetIds.push("target-reddit");
    await seedConfig(updated);

    await runEvaluationTick(ctx, new Date(start.getTime() + 5_000));
    await runEvaluationTick(ctx, new Date(start.getTime() + 15_000));

    expect(ctx.engine.getTimerService().getAccumulatedSeconds("rule-1")).toBe(10);
  });

  it("clears an active break cooldown once a rule's limit is increased above the accumulated time", async () => {
    await seedConfig(baseConfig());
    mockOffRampMonitor.getForegroundPackageName.mockResolvedValue("com.tiktok");

    const start = new Date(2026, 0, 1, 9, 0, 0);
    await runEvaluationTick(ctx, start);
    await runEvaluationTick(ctx, new Date(start.getTime() + 60_000));
    expect(ctx.engine.getActiveBreakUntil()).not.toBeNull();

    const increasedLimit = baseConfig();
    increasedLimit.rules[0].allowedMinutes = 10;
    await seedConfig(increasedLimit);

    await runEvaluationTick(ctx, new Date(start.getTime() + 61_000));
    expect(ctx.engine.getActiveBreakUntil()).toBeNull();
  });

  it("freezes accumulation while paused and resumes once unpaused", async () => {
    await seedConfig(baseConfig());
    mockOffRampMonitor.getForegroundPackageName.mockResolvedValue("com.tiktok");
    const storage = new MobileStorage();
    await storage.save(STORAGE_KEYS.paused, "true");

    const start = new Date(2026, 0, 1, 9, 0, 0);
    await runEvaluationTick(ctx, start);
    await runEvaluationTick(ctx, new Date(start.getTime() + 30_000));
    expect(ctx.engine.getTimerService().getAccumulatedSeconds("rule-1")).toBe(0);

    await storage.save(STORAGE_KEYS.paused, "false");
    await runEvaluationTick(ctx, new Date(start.getTime() + 30_000));
    await runEvaluationTick(ctx, new Date(start.getTime() + 40_000));
    expect(ctx.engine.getTimerService().getAccumulatedSeconds("rule-1")).toBe(10);
  });
});
