package com.rfc.tools.generated

import android.content.Context
import com.lynx.jsbridge.LynxModule
import com.lynx.jsbridge.LynxMethod
import com.lynx.tasm.behavior.LynxContext
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableMap

/**
 * Generated base class for LynxJsLinkingModule
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
abstract class LynxJsLinkingModuleSpec(context: Context) : LynxModule(context) {
  protected fun getContext(): Context {
    val lynxContext = mContext as LynxContext
    return lynxContext.getContext()
  }

  @LynxMethod
  abstract fun openURL(url: String, callback: Callback)

  @LynxMethod
  abstract fun openSettings(callback: Callback)

  @LynxMethod
  abstract fun sendIntent(action: String, extras: ReadableArray?, callback: Callback?)

  @LynxMethod
  abstract fun share(content: String, options: ReadableMap?, callback: Callback?)
}