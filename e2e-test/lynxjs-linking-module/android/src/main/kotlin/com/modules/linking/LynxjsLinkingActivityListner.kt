package com.modules.linking

import android.app.Activity
import android.app.Application
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log

/**
 * LynxLinkingActivityListener uses Android's Application.ActivityLifecycleCallbacks
 * to capture initial deep link URIs when activities are created or resumed.
 * This avoids any dependency on Expo and follows the Lynx native module patterns.
 */
class LynxjsLinkingActivityListener : Application.ActivityLifecycleCallbacks {
  private val TAG = "LynxjsLinkingActivityListener"

  override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
    onReceiveURL(activity.intent)
  }

  override fun onActivityStarted(activity: Activity) {}
  override fun onActivityResumed(activity: Activity) {
    // If an activity receives a new intent via onNewIntent and updates its intent,
    // we can capture it here when the activity is resumed.
    onReceiveURL(activity.intent)
  }

  override fun onActivityPaused(activity: Activity) {}
  override fun onActivityStopped(activity: Activity) {}
  override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
  override fun onActivityDestroyed(activity: Activity) {}

  private fun onReceiveURL(intent: Intent?) {
    try {
      val data: Uri? = intent?.data
      if (data != null) {
        LynxjsLinkingModule.initialUrl = data.toString()
        Log.d(TAG, "Captured initial URL: ${data}")
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error capturing URL from intent", e)
    }
  }
}