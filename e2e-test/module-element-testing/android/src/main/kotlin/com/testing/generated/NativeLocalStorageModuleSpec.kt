package com.testing.generated

import android.content.Context
import com.lynx.jsbridge.LynxModule
import com.lynx.jsbridge.LynxMethod
import com.lynx.tasm.behavior.LynxContext
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableMap

/**
 * Generated base class for NativeLocalStorageModule
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
open class NativeLocalStorageModuleSpec(context: Context) : LynxModule(context) {
  protected fun getContext(): Context {
    val lynxContext = mContext as LynxContext
    return lynxContext.getContext()
  }

  @LynxMethod
  open fun setStorageItem(key: String, value: String) {
    throw NotImplementedError("setStorageItem must be implemented")
  }

  @LynxMethod
  open fun getStorageItem(key: String, callback: Callback) {
    throw NotImplementedError("getStorageItem must be implemented")
  }

  @LynxMethod
  open fun clearStorage() {
    throw NotImplementedError("clearStorage must be implemented")
  }
}