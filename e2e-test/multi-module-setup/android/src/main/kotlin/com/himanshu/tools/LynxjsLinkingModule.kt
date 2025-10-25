package com.himanshu.tools

import android.content.Context
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.tasm.behavior.LynxContext
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableMap

class LynxjsLinkingModule(context: Context) : LynxModule(context) {
  private fun getContext(): Context {
    val lynxContext = mContext as LynxContext
    return lynxContext.getContext()
  }

  @LynxMethod
  fun openURL(url: String, callback: Callback) {
    TODO()
  }

  @LynxMethod
  fun openSettings(callback: Callback) {
    TODO()
  }

  @LynxMethod
  fun sendIntent(action: String, extras: ReadableArray?, callback: Callback?) {
    TODO()
  }

  @LynxMethod
  fun share(content: String, options: ReadableMap?, callback: Callback?) {
    TODO()
  }
}