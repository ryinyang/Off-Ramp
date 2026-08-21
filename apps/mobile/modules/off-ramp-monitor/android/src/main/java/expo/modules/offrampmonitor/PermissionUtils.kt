package expo.modules.offrampmonitor

import android.accessibilityservice.AccessibilityServiceInfo
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Process
import android.provider.Settings
import android.view.accessibility.AccessibilityManager

object PermissionUtils {
  fun hasUsageAccessPermission(context: Context): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode =
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName,
      )
    return mode == AppOpsManager.MODE_ALLOWED
  }

  fun openUsageAccessSettings(context: Context) {
    val intent =
      Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
    runCatching { context.startActivity(intent) }
      .onFailure {
        context.startActivity(
          Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      }
  }

  fun hasAccessibilityPermission(context: Context): Boolean {
    val accessibilityManager =
      context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
        ?: return false
    val enabledServices =
      accessibilityManager.getEnabledAccessibilityServiceList(
        AccessibilityServiceInfo.FEEDBACK_ALL_MASK
      )
    return enabledServices.any {
      it.resolveInfo.serviceInfo.packageName == context.packageName &&
        it.resolveInfo.serviceInfo.name == OffRampAccessibilityService::class.java.name
    }
  }

  fun openAccessibilitySettings(context: Context) {
    val intent =
      Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
    context.startActivity(intent)
  }

  fun openAppSettings(context: Context) {
    val intent =
      Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
    context.startActivity(intent)
  }
}
