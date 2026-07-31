export interface IPlatformTrigger {
  /**
   * Fires the forced focus-switch break interruption.
   * Forcibly shields or redirects focus off the target application/website for durationSeconds.
   */
  fireInterruption(durationSeconds: number, message: string): Promise<void>;
}
