package expo.modules.offrampmonitor

import android.Manifest
import android.content.Context
import android.os.Build
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Bridges the Android-native pieces required by Milestone 3 into JS:
 * - Usage Access + Accessibility permission checks and OS settings deep links.
 * - Foreground-app polling (backs `AndroidUsageMonitor`, the `IPlatformMonitor` implementation).
 * - Forced focus-switch (backs `AndroidFocusSwitchTrigger`, the `IPlatformTrigger` implementation).
 * - Foreground service lifecycle for background monitoring (backs `ForegroundService` from the spec).
 * - Installed launchable app listing for TargetSelectorScreen.
 */
class OffRampMonitorModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("OffRampMonitor")

    Function("hasUsageAccessPermission") { PermissionUtils.hasUsageAccessPermission(context) }

    Function("openUsageAccessSettings") { PermissionUtils.openUsageAccessSettings(context) }

    Function("hasAccessibilityPermission") { PermissionUtils.hasAccessibilityPermission(context) }

    Function("openAccessibilitySettings") { PermissionUtils.openAccessibilitySettings(context) }

    Function("openAppSettings") { PermissionUtils.openAppSettings(context) }

    Function("hasNotificationPermission") { hasNotificationPermission() }

    AsyncFunction("requestNotificationPermission") { promise: expo.modules.kotlin.Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        promise.resolve(true)
        return@AsyncFunction
      }
      Permissions.askForPermissionsWithPermissionsManager(
        appContext.permissions,
        promise,
        Manifest.permission.POST_NOTIFICATIONS,
      )
    }

    AsyncFunction("getForegroundPackageName") {
      ForegroundAppTracker.getCurrentForegroundPackage(context)
    }

    Function("requestFocusSwitch") { durationSeconds: Int, message: String ->
      OffRampAccessibilityService.instance?.fireBreakActivity(durationSeconds, message)
    }

    Function("startMonitoringService") { OffRampForegroundService.start(context) }

    Function("stopMonitoringService") { OffRampForegroundService.stop(context) }

    Function("isMonitoringServiceRunning") { OffRampForegroundService.isRunning }

    AsyncFunction("getInstalledLaunchableApps") {
      InstalledAppsHelper.queryLaunchableApps(context).map { app ->
        mapOf("packageName" to app.packageName, "appName" to app.appName, "icon" to app.iconDataUri)
      }
    }
  }

  private fun hasNotificationPermission(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true
    return androidx.core.content.ContextCompat.checkSelfPermission(
      context,
      Manifest.permission.POST_NOTIFICATIONS,
    ) == android.content.pm.PackageManager.PERMISSION_GRANTED
  }
}
