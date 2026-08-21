import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import OffRampMonitor from "../../modules/off-ramp-monitor/src/OffRampMonitorModule";

export interface PermissionState {
  usageAccess: boolean;
  accessibility: boolean;
  notifications: boolean;
}

export interface UsePermissionsResult extends PermissionState {
  isLoading: boolean;
  allGranted: boolean;
  refresh: () => void;
}

/**
 * Usage Access and Accessibility can only be granted from their respective system Settings
 * screens (Android has no in-app runtime-permission dialog for either). This hook re-checks
 * status whenever the app returns to the foreground, so PermissionsScreen reflects a grant made
 * while the user was away in Settings without requiring a manual refresh.
 */
export function usePermissions(): UsePermissionsResult {
  const [state, setState] = useState<PermissionState | null>(null);

  const refresh = useCallback(() => {
    setState({
      usageAccess: OffRampMonitor.hasUsageAccessPermission(),
      accessibility: OffRampMonitor.hasAccessibilityPermission(),
      notifications: OffRampMonitor.hasNotificationPermission(),
    });
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const resolved = state ?? { usageAccess: false, accessibility: false, notifications: false };

  return {
    ...resolved,
    isLoading: state === null,
    allGranted: resolved.usageAccess && resolved.accessibility,
    refresh,
  };
}
