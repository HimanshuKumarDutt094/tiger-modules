package com.himanshu.tools

import android.content.Context
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.tasm.behavior.LynxContext
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableMap

class NativeLocalStorageModule(context: Context) : LynxModule(context) {
  private fun getContext(): Context {
    val lynxContext = mContext as LynxContext
    return lynxContext.getContext()
  }

  @LynxMethod
  fun setStorageItem(key: String, value: String) {
    TODO()
  }

  @LynxMethod
  fun getStorageItem(key: String, callback: Callback) {
    TODO()
  }

  @LynxMethod
  fun clearStorage() {
    TODO()
  }
}