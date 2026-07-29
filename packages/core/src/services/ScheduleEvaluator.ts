import { Schedule } from "../types/config.js";

export class ScheduleEvaluator {
  /**
   * Determines if monitoring is active given a Schedule and a target Date.
   * Day numbers: 1 = Mon, 2 = Tue, ..., 7 = Sun (ISO day-of-week).
   */
  public isMonitoringActive(schedule: Schedule, now: Date = new Date()): boolean {
    if (!schedule.enabled) {
      return false;
    }

    // Convert JS Date day (0 = Sun, 1 = Mon, ..., 6 = Sat) to ISO day (1 = Mon, ..., 7 = Sun)
    const jsDay = now.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;

    if (!schedule.activeDays.includes(isoDay)) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;

    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Standard daytime window (e.g. 09:00 - 17:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight window (e.g. 22:00 - 06:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }
}
