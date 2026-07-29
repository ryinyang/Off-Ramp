export interface TimeCalculation {
  usedMinutes: number;
  remainingMinutes: number;
  percentUsed: number;
  isNearLimit: boolean;
  isLimitReached: boolean;
}

export class TimeUtils {
  /**
   * Converts seconds to minutes rounded to 1 decimal place.
   */
  public static secondsToMinutes(seconds: number): number {
    return Math.max(0, seconds / 60);
  }

  /**
   * Calculates screen time used, remaining, percentage, and limit status for a given rule.
   */
  public static calculateRuleTime(
    allowedMinutes: number,
    accumulatedSeconds: number
  ): TimeCalculation {
    const usedMinutes = this.secondsToMinutes(accumulatedSeconds);
    const remainingMinutes = Math.max(0, allowedMinutes - usedMinutes);
    const percentUsed = Math.min(100, Math.max(0, (usedMinutes / allowedMinutes) * 100));

    return {
      usedMinutes,
      remainingMinutes,
      percentUsed,
      isNearLimit: percentUsed >= 85,
      isLimitReached: remainingMinutes === 0,
    };
  }
}
