import { NativeModule, requireNativeModule } from "expo";

import { OffRampMonitorNativeApi } from "./OffRampMonitor.types";

declare class OffRampMonitorModule extends NativeModule implements OffRampMonitorNativeApi {
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
  getInstalledLaunchableApps(): Promise<
    { packageName: string; appName: string; icon: string | null }[]
  >;
}

export default requireNativeModule<OffRampMonitorModule>("OffRampMonitor");
