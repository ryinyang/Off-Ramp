export interface InstalledAppInfo {
  packageName: string;
  appName: string;
  /** `data:image/png;base64,...` URI, or null if the icon could not be decoded. */
  icon: string | null;
}

export interface OffRampMonitorNativeApi {
  hasUsageAccessPermission(): boolean;
  openUsageAccessSettings(): void;
  hasAccessibilityPermission(): boolean;
  openAccessibilitySettings(): void;
  openAppSettings(): void;
  hasNotificationPermission(): boolean;
  requestNotificationPermission(): Promise<boolean>;
  getForegroundPackageName(): Promise<string | null>;
  requestFocusSwitch(durationSeconds: number, message: string): void;
  startMonitoringService(): void;
  stopMonitoringService(): void;
  isMonitoringServiceRunning(): boolean;
  getInstalledLaunchableApps(): Promise<InstalledAppInfo[]>;
}
