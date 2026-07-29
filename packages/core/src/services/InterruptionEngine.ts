import { UserConfig } from "../types/config.js";
import { IPlatformMonitor } from "../adapters/IPlatformMonitor.js";
import { IPlatformTrigger } from "../adapters/IPlatformTrigger.js";
import { ScheduleEvaluator } from "./ScheduleEvaluator.js";
import { TimerService } from "./TimerService.js";

export class InterruptionEngine {
  private monitor: IPlatformMonitor;
  private trigger: IPlatformTrigger;
  private timerService: TimerService;
  private scheduleEvaluator: ScheduleEvaluator;
  private isInterruptionActive = false;

  constructor(
    monitor: IPlatformMonitor,
    trigger: IPlatformTrigger,
    timerService: TimerService = new TimerService(),
    scheduleEvaluator: ScheduleEvaluator = new ScheduleEvaluator()
  ) {
    this.monitor = monitor;
    this.trigger = trigger;
    this.timerService = timerService;
    this.scheduleEvaluator = scheduleEvaluator;
  }

  /**
   * Main evaluation loop step. Wakes up, checks current activity, increments timers,
   * and fires interruption trigger if limits are exceeded.
   */
  public async evaluate(config: UserConfig, now: Date = new Date()): Promise<boolean> {
    if (this.isInterruptionActive) {
      return false; // Already handling an active break interruption
    }

    const currentActivity = await this.monitor.getCurrentActivity();

    if (!currentActivity) {
      this.timerService.tick(null, now.getTime());
      return false;
    }

    const currentLower = currentActivity.toLowerCase();

    // Find target matching current activity (checking exact match or domain suffixes)
    const matchingTarget = config.targets.find((t) => {
      const targetLower = t.identifier.toLowerCase();
      return (
        currentLower === targetLower ||
        currentLower.endsWith("." + targetLower) ||
        targetLower.endsWith("." + currentLower)
      );
    });

    // Accumulate time under matchingTarget.identifier if matched, otherwise raw currentActivity
    const activeKey = matchingTarget ? matchingTarget.identifier : currentActivity;
    this.timerService.tick(activeKey, now.getTime());

    if (!matchingTarget) {
      return false;
    }

    // Find rules applying to this target
    const applicableRules = config.rules.filter(
      (r) => r.enabled && r.targetIds.includes(matchingTarget.id)
    );

    for (const rule of applicableRules) {
      const schedule = config.schedules.find((s) => s.id === rule.scheduleId);
      if (!schedule) continue;

      const isActive = this.scheduleEvaluator.isMonitoringActive(schedule, now);
      if (!isActive) continue;

      const accumulatedSeconds = this.timerService.getAccumulatedSeconds(matchingTarget.identifier);
      const allowedSeconds = rule.allowedMinutes * 60;

      if (accumulatedSeconds >= allowedSeconds) {
        // Trigger Interruption!
        this.isInterruptionActive = true;
        await this.trigger.fireInterruption(rule.interruptionSeconds, rule.message);
        
        // Reset timer bucket after interruption handles focus switch
        this.timerService.resetAccumulator(matchingTarget.identifier);
        
        // Auto unlock after duration
        setTimeout(() => {
          this.isInterruptionActive = false;
        }, rule.interruptionSeconds * 1000);

        return true;
      }
    }

    return false;
  }

  public getTimerService(): TimerService {
    return this.timerService;
  }
}
