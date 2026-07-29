export interface IPlatformMonitor {
  /**
   * Returns the identifier (app bundle ID or domain name) of the currently active foreground application/tab,
   * or null if no monitored activity is active.
   */
  getCurrentActivity(): Promise<string | null>;
}
