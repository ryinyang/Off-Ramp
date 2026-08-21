package expo.modules.offrampmonitor

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.util.Base64
import androidx.core.graphics.drawable.toBitmap
import java.io.ByteArrayOutputStream

data class InstalledAppInfo(val packageName: String, val appName: String, val iconDataUri: String?)

/**
 * Lists launchable apps for the TargetSelectorScreen app picker using the Android 11+
 * package-visibility `<queries>` declaration (see the module's AndroidManifest.xml) instead of
 * the Play-Store-restricted QUERY_ALL_PACKAGES permission.
 */
object InstalledAppsHelper {
  private const val ICON_SIZE_PX = 96

  fun queryLaunchableApps(context: Context): List<InstalledAppInfo> {
    val packageManager = context.packageManager
    val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val resolveInfos =
      packageManager.queryIntentActivities(launcherIntent, PackageManager.MATCH_ALL)

    return resolveInfos
      .asSequence()
      .map { it.activityInfo.packageName }
      .distinct()
      .filter { it != context.packageName }
      .mapNotNull { packageName ->
        runCatching {
          val appInfo = packageManager.getApplicationInfo(packageName, 0)
          val appName = packageManager.getApplicationLabel(appInfo).toString()
          val iconDataUri =
            runCatching { encodeIcon(packageManager.getApplicationIcon(appInfo)) }.getOrNull()
          InstalledAppInfo(packageName, appName, iconDataUri)
        }.getOrNull()
      }
      .sortedBy { it.appName.lowercase() }
      .toList()
  }

  private fun encodeIcon(drawable: android.graphics.drawable.Drawable): String {
    val bitmap = drawable.toBitmap(width = ICON_SIZE_PX, height = ICON_SIZE_PX)
    val output = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
    val base64 = Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
    return "data:image/png;base64,$base64"
  }
}
