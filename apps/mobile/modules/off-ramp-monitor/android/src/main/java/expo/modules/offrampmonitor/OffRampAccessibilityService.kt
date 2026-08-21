package expo.modules.offrampmonitor

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.net.Uri
import android.view.accessibility.AccessibilityEvent

/**
 * Off-Ramp does not use this service to inspect what the user is doing — foreground-app
 * detection is handled separately via UsageStatsManager (see [OffRampMonitorModule]). This
 * service exists purely so Android grants it the "active accessibility service" exemption to
 * the background-activity-launch restriction introduced in Android 10, which is what lets
 * [fireBreakActivity] forcibly pull focus to the break screen the instant a rule limit is
 * reached — matching the mitigation documented in architecture_and_risks.md under
 * "Android Focus-Switch Mechanism".
 */
class OffRampAccessibilityService : AccessibilityService() {

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

  override fun onInterrupt() = Unit

  override fun onUnbind(intent: Intent?): Boolean {
    if (instance === this) {
      instance = null
    }
    return super.onUnbind(intent)
  }

  fun fireBreakActivity(durationSeconds: Int, message: String) {
    val uri =
      Uri.parse("offramp://break")
        .buildUpon()
        .appendQueryParameter("duration", durationSeconds.toString())
        .appendQueryParameter("message", message)
        .build()
    val intent =
      Intent(Intent.ACTION_VIEW, uri).apply {
        setPackage(packageName)
        addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        )
      }
    startActivity(intent)
  }

  companion object {
    @Volatile var instance: OffRampAccessibilityService? = null
      private set

    val isRunning: Boolean
      get() = instance != null
  }
}
