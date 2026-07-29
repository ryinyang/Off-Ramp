export interface IPlatformTrigger {
  /**
   * Fires the Opal-style focus-switch interruption.
   * Forcibly shields or redirects focus off the target application/website for durationSeconds.
   */
  fireInterruption(durationSeconds: number, message: string): Promise<void>;
}
