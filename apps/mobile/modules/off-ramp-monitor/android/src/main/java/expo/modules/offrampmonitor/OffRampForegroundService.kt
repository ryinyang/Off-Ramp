package expo.modules.offrampmonitor

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Keeps Off-Ramp's screen-time evaluation loop (packages/core InterruptionEngine, driven from
 * JS) alive while the app is backgrounded. A persistent foreground notification exempts this
 * service from Android's background execution limits; every [TICK_INTERVAL_MS] it starts a
 * short-lived Headless JS task ("OffRampMonitorTask", registered in
 * src/background/registerHeadlessTask.ts) that mirrors one `runEvaluation()` tick of the browser
 * extension's background worker (see apps/extension/src/background/index.ts).
 */
class OffRampForegroundService : HeadlessJsTaskService() {
  private val handler = Handler(Looper.getMainLooper())
  private var tickRunnable: Runnable? = null

  override fun onCreate() {
    super.onCreate()
    isRunning = true
    startForegroundNotification()
    scheduleNextTick()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    super.onStartCommand(intent, flags, startId)
    return START_STICKY
  }

  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig =
    HeadlessJsTaskConfig(TASK_KEY, Arguments.createMap(), TASK_TIMEOUT_MS, true)

  /**
   * Deliberately does not call super. [HeadlessJsTaskService]'s base implementation calls
   * `stopSelf()` once the active-task count reaches zero — appropriate for a service that runs
   * one long task, but fatal here: each evaluation tick is a short-lived task that resolves
   * within milliseconds, so the base behavior would kill this service after its very first tick.
   * This service's lifecycle is owned entirely by [scheduleNextTick] and [stop].
   */
  override fun onHeadlessJsTaskFinish(taskId: Int) = Unit

  private fun scheduleNextTick() {
    val runnable =
      Runnable {
        startTask(getTaskConfig(null))
        scheduleNextTick()
      }
    tickRunnable = runnable
    handler.postDelayed(runnable, TICK_INTERVAL_MS)
  }

  private fun startForegroundNotification() {
    val manager = NotificationManagerCompat.from(this)
    val channel =
      NotificationChannelCompat.Builder(CHANNEL_ID, NotificationManagerCompat.IMPORTANCE_MIN)
        .setName(getString(R.string.monitor_notification_channel_name))
        .setShowBadge(false)
        .build()
    manager.createNotificationChannel(channel)

    val contentIntent =
      packageManager.getLaunchIntentForPackage(packageName)?.let {
        PendingIntent.getActivity(
          this,
          0,
          it,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
      }

    val notification: Notification =
      NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_menu_recent_history)
        .setContentTitle(getString(R.string.monitor_notification_title))
        .setContentText(getString(R.string.monitor_notification_text))
        .setOngoing(true)
        .setPriority(NotificationCompat.PRIORITY_MIN)
        .setContentIntent(contentIntent)
        .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  override fun onDestroy() {
    tickRunnable?.let { handler.removeCallbacks(it) }
    isRunning = false
    stopForeground(STOP_FOREGROUND_REMOVE)
    super.onDestroy()
  }

  override fun onBind(intent: Intent): IBinder? = null

  companion object {
    private const val TASK_KEY = "OffRampMonitorTask"
    private const val TICK_INTERVAL_MS = 3000L
    private const val TASK_TIMEOUT_MS = 10_000L
    private const val NOTIFICATION_ID = 4271
    private const val CHANNEL_ID = "off_ramp_monitoring"

    @Volatile var isRunning: Boolean = false
      private set

    fun start(context: Context) {
      val intent = Intent(context, OffRampForegroundService::class.java)
      context.startForegroundService(intent)
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, OffRampForegroundService::class.java))
    }
  }
}
