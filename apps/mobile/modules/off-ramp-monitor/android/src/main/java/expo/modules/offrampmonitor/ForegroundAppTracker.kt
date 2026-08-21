package expo.modules.offrampmonitor

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build

/**
 * Tracks the current foreground package incrementally. `UsageStatsManager.queryEvents` only
 * returns *transition* events, not continuous state, so a query scoped to a short recent window
 * would incorrectly return nothing (and thus "no foreground app") once the user has been sitting
 * on the same target app for longer than that window. Instead this caches the last-seen
 * foreground package and only queries the delta since the previous check, matching how the
 * browser extension's WebTabMonitor treats "currently active tab" as durable state rather than a
 * momentary event (see apps/extension/src/adapters/WebTabMonitor.ts).
 */
object ForegroundAppTracker {
  private const val INITIAL_LOOKBACK_MS = 60_000L

  @Volatile private var lastQueryEndTime: Long = 0L
  @Volatile private var cachedForegroundPackage: String? = null

  fun getCurrentForegroundPackage(context: Context): String? {
    val usageStatsManager =
      context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        ?: return cachedForegroundPackage

    val now = System.currentTimeMillis()
    val begin = if (lastQueryEndTime == 0L) now - INITIAL_LOOKBACK_MS else lastQueryEndTime

    val events = usageStatsManager.queryEvents(begin, now)
    val event = UsageEvents.Event()
    var latestResumeTime = -1L

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      if (isForegroundResumeEvent(event.eventType) && event.timeStamp >= latestResumeTime) {
        latestResumeTime = event.timeStamp
        cachedForegroundPackage = event.packageName
      }
    }

    lastQueryEndTime = now
    return cachedForegroundPackage
  }

  private fun isForegroundResumeEvent(eventType: Int): Boolean =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      eventType == UsageEvents.Event.ACTIVITY_RESUMED
    } else {
      @Suppress("DEPRECATION")
      eventType == UsageEvents.Event.MOVE_TO_FOREGROUND
    }

  /** Test/reset hook — not exposed to JS. */
  fun reset() {
    lastQueryEndTime = 0L
    cachedForegroundPackage = null
  }
}
