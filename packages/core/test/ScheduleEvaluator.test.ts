import { describe, it, expect } from "vitest";
import { ScheduleEvaluator } from "../src/services/ScheduleEvaluator.js";
import { Schedule } from "../src/types/config.js";

describe("ScheduleEvaluator", () => {
  const evaluator = new ScheduleEvaluator();

  const testSchedule: Schedule = {
    id: "sched-1",
    name: "Work Hours",
    activeDays: [1, 2, 3, 4, 5], // Mon - Fri
    startTime: "09:00",
    endTime: "17:00",
    enabled: true,
  };

  it("returns true when current time is inside active window and active day", () => {
    // Mon (ISO day 1) at 10:30 AM
    const mondayMorning = new Date("2026-07-27T10:30:00Z"); // 2026-07-27 is a Monday
    // Force local time interpretation for test
    mondayMorning.setHours(10, 30, 0, 0);

    const result = evaluator.isMonitoringActive(testSchedule, mondayMorning);
    expect(result).toBe(true);
  });

  it("returns false outside active time window", () => {
    const mondayEvening = new Date("2026-07-27T18:30:00Z");
    mondayEvening.setHours(18, 30, 0, 0);

    const result = evaluator.isMonitoringActive(testSchedule, mondayEvening);
    expect(result).toBe(false);
  });

  it("returns false on disabled days (e.g. Saturday)", () => {
    const saturdayNoon = new Date("2026-08-01T12:00:00Z"); // 2026-08-01 is a Saturday
    saturdayNoon.setHours(12, 0, 0, 0);

    const result = evaluator.isMonitoringActive(testSchedule, saturdayNoon);
    expect(result).toBe(false);
  });

  it("returns false when schedule is disabled", () => {
    const disabledSchedule: Schedule = { ...testSchedule, enabled: false };
    const mondayMorning = new Date("2026-07-27T10:30:00Z");
    mondayMorning.setHours(10, 30, 0, 0);

    expect(evaluator.isMonitoringActive(disabledSchedule, mondayMorning)).toBe(false);
  });
});
