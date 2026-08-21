import { registerWebModule, NativeModule } from "expo";

import { OffRampMonitorNativeApi } from "./OffRampMonitor.types";

/**
 * Off-Ramp's forced focus-switch mechanism is Android-only (see architecture_and_risks.md).
 * The web stub lets the app run in `expo start --web` for UI iteration without crashing;
 * every capability reports itself as unavailable rather than throwing.
 */
class OffRampMonitorModule extends NativeModule implements OffRampMonitorNativeApi {
  hasUsageAccessPermission = () => false;
  openUsageAccessSettings = () => {};
  hasAccessibilityPermission = () => false;
  openAccessibilitySettings = () => {};
  openAppSettings = () => {};
  hasNotificationPermission = () => false;
  requestNotificationPermission = async () => false;
  getForegroundPackageName = async () => null;
  requestFocusSwitch = () => {};
  startMonitoringService = () => {};
  stopMonitoringService = () => {};
  isMonitoringServiceRunning = () => false;
  getInstalledLaunchableApps = async () => [];
}

export default registerWebModule(OffRampMonitorModule, "OffRampMonitorModule");
