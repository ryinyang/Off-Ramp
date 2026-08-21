/**
 * Test double for the off-ramp-monitor Expo native module (see jest.config.js
 * moduleNameMapper). The real module only exists once compiled into a native Android build, so
 * every test that touches an adapter or screen depending on it imports this instead. Import it
 * directly in a test to override a method's return value with `.mockReturnValue`/`.mockResolvedValue`.
 */
const mockOffRampMonitor = {
  hasUsageAccessPermission: jest.fn(() => false),
  openUsageAccessSettings: jest.fn(),
  hasAccessibilityPermission: jest.fn(() => false),
  openAccessibilitySettings: jest.fn(),
  openAppSettings: jest.fn(),
  hasNotificationPermission: jest.fn(() => false),
  requestNotificationPermission: jest.fn(async () => false),
  getForegroundPackageName: jest.fn(async (): Promise<string | null> => null),
  requestFocusSwitch: jest.fn(),
  startMonitoringService: jest.fn(),
  stopMonitoringService: jest.fn(),
  isMonitoringServiceRunning: jest.fn(() => false),
  getInstalledLaunchableApps: jest.fn(async () => [] as { packageName: string; appName: string; icon: string | null }[]),
};

export default mockOffRampMonitor;
