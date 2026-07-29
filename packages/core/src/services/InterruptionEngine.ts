import { UserConfig } from "../types/config.js";
import { IPlatformMonitor } from "../adapters/IPlatformMonitor.js";
import { IPlatformTrigger } from "../adapters/IPlatformTrigger.js";
import { ScheduleEvaluator } from "./ScheduleEvaluator.js";
import { TimerService } from "./TimerService.js";
import { DomainUtils } from "../utils/DomainUtils.js";

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
   * Main evaluation loop step. Wakes up, checks current activity, increments rule-level timers,
   * enforces active break cooldowns, and fires interruption trigger if rule limits are exceeded.
   */
  public async evaluate(config: UserConfig, now: Date = new Date()): Promise<boolean> {
    const nowMs = now.getTime();

    // Check if an active break cooldown is currently running
    if (this.activeBreakUntil !== null) {
      if (nowMs < this.activeBreakUntil) {
        const currentActivity = await this.monitor.getCurrentActivity();
        if (currentActivity) {
          const isTargeted = config.targets.some((t) =>
            DomainUtils.isDomainMatch(currentActivity, t.identifier)
          );

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
      this.timerService.tickRules([], nowMs);
      return false;
    }

    // Find all targets matching current activity
    const matchingTargets = DomainUtils.getMatchingTargets(currentActivity, config.targets);

    if (matchingTargets.length === 0) {
      this.timerService.tickRules([], nowMs);
      return false;
    }

    const matchingTargetIds = new Set(matchingTargets.map((t) => t.id));

    // Find rules that cover any of the matching targets and are currently active on schedule
    const activeRuleIds: string[] = [];
    const applicableRules = config.rules.filter(
      (r) => r.enabled && r.targetIds.some((id) => matchingTargetIds.has(id))
    );

    for (const rule of applicableRules) {
      const schedule = config.schedules.find((s) => s.id === rule.scheduleId);
      if (!schedule) continue;

      const isActive = this.scheduleEvaluator.isMonitoringActive(schedule, now);
      if (isActive) {
        activeRuleIds.push(rule.id);
      }
    }

    // Accumulate screen time into matching rule buckets
    this.timerService.tickRules(activeRuleIds, nowMs);

    // Check if any rule's aggregated screen time reached its allowed limit
    for (const ruleId of activeRuleIds) {
      const rule = config.rules.find((r) => r.id === ruleId);
      if (!rule) continue;

      const accumulatedSeconds = this.timerService.getAccumulatedSeconds(rule.id);
      const allowedSeconds = rule.allowedMinutes * 60;

      if (accumulatedSeconds >= allowedSeconds) {
        // Trigger Interruption!
        this.activeBreakUntil = nowMs + rule.interruptionSeconds * 1000;
        this.activeBreakMessage = rule.message;

        await this.trigger.fireInterruption(rule.interruptionSeconds, rule.message);

        // Reset rule accumulator bucket after interruption triggers
        this.timerService.resetAccumulator(rule.id);

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
