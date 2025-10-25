package com.modules.linking

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import androidx.core.content.FileProvider
import java.io.File
import java.net.URLConnection
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableMap

class LynxjsLinkingModule(context: Context) : LynxModule(context) {

  companion object {
    var initialUrl: String? = null
    private var installed = false
    private var callbacks: Application.ActivityLifecycleCallbacks? = null
    private const val TAG = "LynxjsLinkingModule"
  }

  /**
   * Initialize the module with Application context to register lifecycle callbacks.
   * This method is automatically called by the autolink system when the module is registered.
   */
  fun init(ctx: Context) {
    if (installed) return
    
    val app = (ctx.applicationContext as? Application)
      ?: throw IllegalArgumentException("Context must be Application or provide applicationContext")
    
    if (callbacks == null) {
      callbacks = object : Application.ActivityLifecycleCallbacks {
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
      }
    }
    
    // Unregister first to avoid duplicate registrations
    app.unregisterActivityLifecycleCallbacks(callbacks!!)
    app.registerActivityLifecycleCallbacks(callbacks!!)
    installed = true
    Log.d(TAG, "LynxjsLinkingModule initialized with lifecycle callbacks")
  }

  private fun onReceiveURL(intent: Intent?) {
    try {
      val data: Uri? = intent?.data
      if (data != null) {
        initialUrl = data.toString()
        Log.d(TAG, "Captured initial URL: ${data}")
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error capturing URL from intent", e)
    }
  }

  private fun getContext(): Context {
    return when (mContext) {
      is com.lynx.tasm.behavior.LynxContext -> (mContext as com.lynx.tasm.behavior.LynxContext).context
      is Context -> mContext as Context
      else -> throw IllegalStateException("Unable to get Android Context from Lynx context")
    }
  }

  @LynxMethod
  fun openURL(url: String, callback: Callback) {
    try {
      val intent = Intent(Intent.ACTION_VIEW)
      intent.data = Uri.parse(url)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  getContext().startActivity(intent)
      callback.invoke(null)
    } catch (e: Exception) {
      callback.invoke(e.message)
    }
  }

  @LynxMethod
  fun canOpenURL(url: String, callback: Callback) {
    try {
      val uri = Uri.parse(url)
      val intent = Intent(Intent.ACTION_VIEW, uri)
  val pm = getContext().packageManager
      val resolved = intent.resolveActivity(pm) != null
      callback.invoke(null, resolved)
    } catch (e: Exception) {
      callback.invoke(e.message, false)
    }
  }

  @LynxMethod
  fun getInitialURL(callback: Callback) {
    callback.invoke(initialUrl)
  }

  @LynxMethod
  fun openSettings(callback: Callback) {
    try {
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
  val uri = Uri.fromParts("package", getContext().packageName, null)
      intent.data = uri
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  getContext().startActivity(intent)
      callback.invoke(null)
    } catch (e: Exception) {
      callback.invoke(e.message)
    }
  }

  @LynxMethod
  fun sendIntent(action: String, extras: ReadableArray?, callback: Callback) {
    try {
      val intent = Intent(action)
      if (extras != null) {
        for (i in 0 until extras.size()) {
          val map = extras.getMap(i)
          val key = map?.getString("key") ?: continue
          val valueType = map.getType("value")
          when (valueType) {
            com.lynx.react.bridge.ReadableType.Number -> {
              // Lynx bridge uses Double for numbers
              val number = map.getDouble("value")
              // Try to put as Int if it's integral
              if (number == number.toInt().toDouble()) intent.putExtra(key, number.toInt())
              else intent.putExtra(key, number)
            }
            com.lynx.react.bridge.ReadableType.String -> intent.putExtra(key, map.getString("value"))
            com.lynx.react.bridge.ReadableType.Boolean -> intent.putExtra(key, map.getBoolean("value"))
            else -> {}
          }
        }
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  getContext().startActivity(intent)
      callback.invoke(null)
    } catch (e: Exception) {
      callback.invoke(e.message)
    }
  }

  /**
   * Share a text or local file using Android chooser.
   * content: string (text or file://...)
   * options: map with optional keys: "mimeType" (string), "dialogTitle" (string)
   */
  @LynxMethod
  fun share(content: String?, options: ReadableMap?, callback: Callback) {
    try {
      if (content == null) {
        callback.invoke("Content cannot be null")
        return
      }

  val mimeType = options?.getString("mimeType")
  val dialogTitle = options?.getString("dialogTitle")

      val intent = Intent(Intent.ACTION_SEND)

      // If a dialogTitle (title) is provided, include it as the subject so receiving apps
      // (email, messaging apps) can display it. We'll also prepend it to plain text shares
      // so apps that only read EXTRA_TEXT see the title as well.
      if (dialogTitle != null) {
        intent.putExtra(Intent.EXTRA_SUBJECT, dialogTitle)
      }

      if (content.startsWith("file://") || content.startsWith("/")) {
        // local file
        val filePath = if (content.startsWith("file://")) Uri.parse(content).path else content
        val file = File(filePath)
        if (!file.exists()) {
          callback.invoke("File does not exist: $filePath")
          return
        }

  val authority = getContext().packageName + ".fileprovider"
  val contentUri = FileProvider.getUriForFile(getContext(), authority, file)
  intent.putExtra(Intent.EXTRA_STREAM, contentUri)
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)

        val resolvedMime = mimeType ?: URLConnection.guessContentTypeFromName(file.name) ?: "*/*"
        intent.type = resolvedMime
      } else {
        // treat as plain text or URL
  // For plain text/URL shares, include the dialogTitle in the text body when present
  val textBody = if (dialogTitle != null) "$dialogTitle\n$content" else content
  intent.putExtra(Intent.EXTRA_TEXT, textBody)
  intent.type = mimeType ?: "text/plain"
      }

      val chooser = Intent.createChooser(intent, dialogTitle ?: "Share")
      chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  getContext().startActivity(chooser)
      callback.invoke(null)
    } catch (e: Exception) {
      callback.invoke(e.message)
    }
  }
}
