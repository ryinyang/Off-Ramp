import { describe, it, expect } from "vitest";
import { TimeUtils } from "../src/index.js";

describe("TimeUtils", () => {
  it("converts seconds to minutes accurately", () => {
    expect(TimeUtils.secondsToMinutes(90)).toBe(1.5);
    expect(TimeUtils.secondsToMinutes(0)).toBe(0);
    expect(TimeUtils.secondsToMinutes(600)).toBe(10);
  });

  it("calculates rule time status, remaining minutes, percentage, and limit triggers", () => {
    // 15 min limit, 3 min used (180s)
    const calc1 = TimeUtils.calculateRuleTime(15, 180);
    expect(calc1.usedMinutes).toBe(3);
    expect(calc1.remainingMinutes).toBe(12);
    expect(calc1.percentUsed).toBe(20);
    expect(calc1.isNearLimit).toBe(false);
    expect(calc1.isLimitReached).toBe(false);

    // 10 min limit, 9 min used (540s -> 90% used)
    const calc2 = TimeUtils.calculateRuleTime(10, 540);
    expect(calc2.percentUsed).toBe(90);
    expect(calc2.isNearLimit).toBe(true);
    expect(calc2.isLimitReached).toBe(false);

    // 5 min limit, 5 min used (300s -> 100% used)
    const calc3 = TimeUtils.calculateRuleTime(5, 300);
    expect(calc3.remainingMinutes).toBe(0);
    expect(calc3.isLimitReached).toBe(true);
  });
});
