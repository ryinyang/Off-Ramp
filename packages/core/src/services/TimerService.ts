export class TimerService {
  private ruleLastTickTimestamps: Map<string, number> = new Map(); // key -> lastTick timestamp
  private accumulators: Map<string, number> = new Map(); // key -> accumulated seconds

  /**
   * Called on evaluation step with array of active keys (e.g. active rule IDs).
   * Calculates elapsed seconds for each active key and accumulates screen time.
   */
  public tickRules(activeKeys: string[], nowTimestamp: number = Date.now()): void {
    const activeSet = new Set(activeKeys);

    for (const key of activeKeys) {
      const lastTick = this.ruleLastTickTimestamps.get(key);
      if (lastTick !== undefined) {
        const elapsedSeconds = (nowTimestamp - lastTick) / 1000;
        if (elapsedSeconds > 0) {
          const currentTotal = this.accumulators.get(key) || 0;
          this.accumulators.set(key, currentTotal + elapsedSeconds);
        }
      }
      this.ruleLastTickTimestamps.set(key, nowTimestamp);
    }

    // For keys no longer active, delete lastTick timestamp so time spent paused is not accumulated
    for (const [key] of this.ruleLastTickTimestamps.entries()) {
      if (!activeSet.has(key)) {
        this.ruleLastTickTimestamps.delete(key);
      }
    }
  }

  /**
   * Legacy single-key tick wrapper for backward compatibility.
   */
  public tick(currentKey: string | null, nowTimestamp: number = Date.now()): void {
    if (currentKey) {
      this.tickRules([currentKey], nowTimestamp);
    } else {
      this.tickRules([], nowTimestamp);
    }
  }

  /**
   * Returns accumulated screen time in seconds for a key (e.g. rule ID).
   */
  public getAccumulatedSeconds(key: string): number {
    return this.accumulators.get(key) || 0;
  }

  /**
   * Returns a plain record object of all accumulated seconds.
   */
  public getAllAccumulators(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.accumulators.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Resets accumulated screen time for a key to zero.
   */
  public resetAccumulator(key: string): void {
    this.accumulators.set(key, 0);
    this.ruleLastTickTimestamps.delete(key);
  }

  /**
   * Clears all accumulators and timestamps.
   */
  public resetAll(): void {
    this.accumulators.clear();
    this.ruleLastTickTimestamps.clear();
  }
}
