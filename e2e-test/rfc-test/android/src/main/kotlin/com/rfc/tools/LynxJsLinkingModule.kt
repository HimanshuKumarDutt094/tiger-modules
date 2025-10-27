package com.rfc.tools

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.core.content.FileProvider
import com.rfc.tools.generated.LynxJsLinkingModuleSpec
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import com.tigermodule.autolink.LynxNativeModule
import java.io.File
import java.net.URLConnection

/**
 * Implementation of LynxJsLinkingModule
 * Extend the generated base class and implement your logic
 */
@LynxNativeModule(name = "LynxJsLinkingModule")
class LynxJsLinkingModule(context: Context) : LynxJsLinkingModuleSpec(context) {

  override fun openURL(url: String, callback: Callback) {
    try {
      val uri = Uri.parse(url)
      val intent = Intent(Intent.ACTION_VIEW, uri)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      getContext().startActivity(intent)
      callback.invoke(null)
    } catch (e: Exception) {
      callback.invoke("Failed to open URL: ${e.message}")
    }
  }

  override fun openSettings(callback: Callback) {
    try {
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
      val uri = Uri.fromParts("package", getContext().packageName, null)
      intent.data = uri
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      getContext().startActivity(intent)
      callback.invoke(null)
    } catch (e: Exception) {
      callback.invoke("Failed to open settings: ${e.message}")
    }
  }

  override fun share(content: String, options: ReadableMap?, callback: Callback?) {
    try {
      val intent = Intent(Intent.ACTION_SEND)
      intent.putExtra(Intent.EXTRA_TEXT, content)
      intent.type = "text/plain"
      
      val chooser = Intent.createChooser(intent, "Share")
      chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      getContext().startActivity(chooser)
      callback?.invoke(null)
    } catch (e: Exception) {
      callback?.invoke("Failed to share: ${e.message}")
    }
  }
}