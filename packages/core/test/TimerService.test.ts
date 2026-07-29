import { describe, it, expect } from "vitest";
import { TimerService } from "../src/services/TimerService.js";

describe("TimerService", () => {
  it("accumulates screen time for active target across ticks", () => {
    const timer = new TimerService();
    const startTime = 1000000;

    // First tick on TikTok
    timer.tick("com.zhiliaoapp.musically", startTime);
    expect(timer.getAccumulatedSeconds("com.zhiliaoapp.musically")).toBe(0);

    // Tick 10 seconds later on TikTok
    timer.tick("com.zhiliaoapp.musically", startTime + 10000);
    expect(timer.getAccumulatedSeconds("com.zhiliaoapp.musically")).toBe(10);

    // Tick 20 seconds later on TikTok
    timer.tick("com.zhiliaoapp.musically", startTime + 30000);
    expect(timer.getAccumulatedSeconds("com.zhiliaoapp.musically")).toBe(30);
  });

  it("handles switching targets cleanly without cross-contaminating time", () => {
    const timer = new TimerService();
    const startTime = 1000000;

    timer.tick("com.zhiliaoapp.musically", startTime);
    timer.tick("com.zhiliaoapp.musically", startTime + 10000); // 10s TikTok

    // Switch to Reddit
    timer.tick("reddit.com", startTime + 10000);
    timer.tick("reddit.com", startTime + 25000); // 15s Reddit

    expect(timer.getAccumulatedSeconds("com.zhiliaoapp.musically")).toBe(10);
    expect(timer.getAccumulatedSeconds("reddit.com")).toBe(15);
  });

  it("resets accumulator for specific target", () => {
    const timer = new TimerService();
    const startTime = 1000000;

    timer.tick("reddit.com", startTime);
    timer.tick("reddit.com", startTime + 30000);
    expect(timer.getAccumulatedSeconds("reddit.com")).toBe(30);

    timer.resetAccumulator("reddit.com");
    expect(timer.getAccumulatedSeconds("reddit.com")).toBe(0);
  });

  it("hydrates accumulators from a plain record object", () => {
    const timer = new TimerService();
    timer.hydrateAccumulators({
      "rule-1": 120,
      "rule-2": 45,
    });

    expect(timer.getAccumulatedSeconds("rule-1")).toBe(120);
    expect(timer.getAccumulatedSeconds("rule-2")).toBe(45);
  });
});
