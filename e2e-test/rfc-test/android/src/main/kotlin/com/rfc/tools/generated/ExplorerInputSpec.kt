package com.rfc.tools.generated

import android.content.Context
import  androidx.appcompat.widget.AppCompatEditText
import android.text.InputType
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.event.LynxCustomEvent
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap

/**
 * Generated base class for ExplorerInput element
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
abstract class ExplorerInputSpec(context: LynxContext) : LynxUI<AppCompatEditText>(context) {

  // Abstract method to create the native view
  abstract override fun createView(context: Context): AppCompatEditText

  // Property handlers
  @LynxProp(name = "bindinput")
  abstract fun setBindinput(bindinput: Callback?)

  @LynxProp(name = "className")
  abstract fun setClassName(className: String?)

  @LynxProp(name = "id")
  abstract fun setId(id: String?)

  @LynxProp(name = "style")
  abstract fun setStyle(style: Any?)

  @LynxProp(name = "value")
  abstract fun setValue(value: Any?)

  @LynxProp(name = "maxlines")
  abstract fun setMaxlines(maxlines: Double?)

  @LynxProp(name = "placeholder")
  abstract fun setPlaceholder(placeholder: String?)

  // Helper method for event emission
  protected fun emitEvent(name: String, value: Map<String, Any>?) {
    val detail = LynxCustomEvent(sign, name)
    value?.forEach { (key, v) ->
      detail.addDetail(key, v)
    }
    lynxContext.eventEmitter.sendCustomEvent(detail)
  }
}