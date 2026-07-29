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
  private activeBreakUntil: number | null = null;
  private activeBreakMessage: string = "";

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
   * enforces active break cooldowns, and fires interruption trigger if limits are exceeded.
   */
  public async evaluate(config: UserConfig, now: Date = new Date()): Promise<boolean> {
    const nowMs = now.getTime();

    // Check if an active break cooldown is currently running
    if (this.activeBreakUntil !== null) {
      if (nowMs < this.activeBreakUntil) {
        const currentActivity = await this.monitor.getCurrentActivity();
        if (currentActivity) {
          const currentLower = currentActivity.toLowerCase();

          // Check if current activity matches ANY target in config
          const isTargeted = config.targets.some((t) => {
            const targetLower = t.identifier.toLowerCase();
            return (
              currentLower === targetLower ||
              currentLower.endsWith("." + targetLower) ||
              targetLower.endsWith("." + currentLower)
            );
          });

          if (isTargeted) {
            const remainingSeconds = Math.ceil((this.activeBreakUntil - nowMs) / 1000);
            if (remainingSeconds > 0) {
              await this.trigger.fireInterruption(remainingSeconds, this.activeBreakMessage);
              return true;
            }
          }
        }
        return false;
      } else {
        // Break cooldown expired, clear active break state
        this.activeBreakUntil = null;
        this.activeBreakMessage = "";
      }
    }

    const currentActivity = await this.monitor.getCurrentActivity();

    if (!currentActivity) {
      this.timerService.tick(null, nowMs);
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
    this.timerService.tick(activeKey, nowMs);

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
        this.activeBreakUntil = nowMs + rule.interruptionSeconds * 1000;
        this.activeBreakMessage = rule.message;

        await this.trigger.fireInterruption(rule.interruptionSeconds, rule.message);

        // Reset timer bucket after interruption handles focus switch
        this.timerService.resetAccumulator(matchingTarget.identifier);

        return true;
      }
    }

    return false;
  }

  public getTimerService(): TimerService {
    return this.timerService;
  }

  public getActiveBreakUntil(): number | null {
    return this.activeBreakUntil;
  }
}
