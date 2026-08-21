import { useCallback, useEffect, useState } from "react";
import { Target, TimeCalculation, TimeUtils, UserConfig } from "@off-ramp/core";

import { MobileStorage } from "../adapters/MobileStorage";
import { STORAGE_KEYS } from "../background/monitorLoop";

const storage = new MobileStorage();
const POLL_INTERVAL_MS = 1000;

export interface RuleStatus {
  ruleId: string;
  targets: Target[];
  time: TimeCalculation;
  isActiveNow: boolean;
}

export interface UseMonitoringStatusResult {
  isPaused: boolean;
  isLoading: boolean;
  ruleStatuses: RuleStatus[];
  togglePaused: () => Promise<void>;
}

/**
 * Read-only dashboard view over the state the background monitor loop writes to storage
 * (src/background/monitorLoop.ts). Polling — rather than a storage change listener — mirrors
 * how the browser extension popup treats accumulated screen time as state to re-read on a
 * cadence rather than push-subscribe to (AsyncStorage has no `onChanged` primitive on mobile).
 */
export function useMonitoringStatus(config: UserConfig | null): UseMonitoringStatusResult {
  const [isPaused, setIsPaused] = useState(false);
  const [accumulators, setAccumulators] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const poll = useCallback(async () => {
    const [pausedValue, accumulatorsJson] = await Promise.all([
      storage.load(STORAGE_KEYS.paused),
      storage.load(STORAGE_KEYS.accumulators),
    ]);
    setIsPaused(pausedValue === "true");
    if (accumulatorsJson) {
      try {
        setAccumulators(JSON.parse(accumulatorsJson));
      } catch {
        setAccumulators({});
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  const togglePaused = useCallback(async () => {
    const next = !isPaused;
    setIsPaused(next);
    await storage.save(STORAGE_KEYS.paused, next ? "true" : "false");
  }, [isPaused]);

  const ruleStatuses: RuleStatus[] = (config?.rules ?? []).map((rule) => {
    const accumulatedSeconds = accumulators[rule.id] ?? 0;
    const targets = rule.targetIds
      .map((id) => config?.targets.find((t) => t.id === id))
      .filter((target): target is Target => Boolean(target));

    return {
      ruleId: rule.id,
      targets,
      time: TimeUtils.calculateRuleTime(rule.allowedMinutes, accumulatedSeconds),
      isActiveNow: rule.enabled,
    };
  });

  return { isPaused, isLoading, ruleStatuses, togglePaused };
}
