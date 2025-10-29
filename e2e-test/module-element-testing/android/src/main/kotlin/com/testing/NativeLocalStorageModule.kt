package com.testing

import android.content.Context
import com.testing.generated.NativeLocalStorageModuleSpec
import com.lynx.react.bridge.Callback
import com.tigermodule.processor.LynxNativeModule
import com.lynx.tasm.behavior.LynxContext

/**
 * Implementation of NativeLocalStorageModule
 * Extend the generated base class and implement your logic
 */
@LynxNativeModule(name = "NativeLocalStorageModule")
class NativeLocalStorageModule(context: Context) : NativeLocalStorageModuleSpec(context) {

  private val PREF_NAME = "MyLocalStorage"
  
  override fun setStorageItem(key: String, value: String) {
    val sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    val editor = sharedPreferences.edit()
    editor.putString(key, value)
    editor.apply()
  }

  override fun getStorageItem(key: String, callback: Callback) {
    val sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    callback.invoke(sharedPreferences.getString(key, null))
  }

  override fun clearStorage() {
    val sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    val editor = sharedPreferences.edit()
    editor.clear()
    editor.apply()
  }
}