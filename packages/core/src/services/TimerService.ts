export class TimerService {
  private activeTargetIdentifier: string | null = null;
  private lastTickTimestamp: number | null = null;
  private accumulators: Map<string, number> = new Map(); // identifier -> accumulated seconds

  /**
   * Called when active target changes or ticks.
   * Calculates elapsed seconds since last timestamp and accumulates time.
   */
  public tick(currentIdentifier: string | null, nowTimestamp: number = Date.now()): void {
    if (this.activeTargetIdentifier && this.activeTargetIdentifier === currentIdentifier) {
      if (this.lastTickTimestamp !== null) {
        const elapsedSeconds = (nowTimestamp - this.lastTickTimestamp) / 1000;
        if (elapsedSeconds > 0) {
          const currentTotal = this.accumulators.get(this.activeTargetIdentifier) || 0;
          this.accumulators.set(this.activeTargetIdentifier, currentTotal + elapsedSeconds);
        }
      }
    } else {
      // Switched targets
      this.activeTargetIdentifier = currentIdentifier;
    }

    this.lastTickTimestamp = nowTimestamp;
  }

  /**
   * Returns accumulated screen time in seconds for a target identifier.
   */
  public getAccumulatedSeconds(identifier: string): number {
    return this.accumulators.get(identifier) || 0;
  }

  /**
   * Resets accumulated screen time for a target identifier to zero.
   */
  public resetAccumulator(identifier: string): void {
    this.accumulators.set(identifier, 0);
  }

  /**
   * Clears all accumulators.
   */
  public resetAll(): void {
    this.accumulators.clear();
    this.activeTargetIdentifier = null;
    this.lastTickTimestamp = null;
  }
}
