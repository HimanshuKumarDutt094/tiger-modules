package com.rfc.tools

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.widget.AppCompatEditText
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.behavior.LynxUIMethodConstants
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.event.LynxCustomEvent
import com.tigermodule.autolink.LynxElement

@LynxElement(name = "explorer-input-demo")
class ExplorerInput(context: LynxContext) : LynxUI<AppCompatEditText>(context) {

  private fun showSoftInput(): Boolean {
    val imm = lynxContext.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    return imm.showSoftInput(mView, InputMethodManager.SHOW_IMPLICIT, null)
  }

  @LynxUIMethod
  fun focus(params: ReadableMap, callback: Callback) {
    if (mView.requestFocus()) {
      if (showSoftInput()) {
        callback.invoke(LynxUIMethodConstants.SUCCESS)
      } else {
        callback.invoke(LynxUIMethodConstants.UNKNOWN, "fail to show keyboard")
      }
    } else {
      callback.invoke(LynxUIMethodConstants.UNKNOWN, "fail to focus")
    }
  }

  override fun createView(context: Context): AppCompatEditText {
    return AppCompatEditText(context).apply {
      addTextChangedListener(object : TextWatcher {
        override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

        override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

        override fun afterTextChanged(s: Editable?) {
          emitEvent("input", mapOf("value" to (s?.toString() ?: "")))
        }
      })
    }
  }

  private fun emitEvent(name: String, value: Map<String, Any>?) {
    val detail = LynxCustomEvent(sign, name)
    value?.forEach { (key, v) ->
      detail.addDetail(key, v)
    }
    lynxContext.eventEmitter.sendCustomEvent(detail)
  }

  override fun onLayoutUpdated() {
    super.onLayoutUpdated()
    val paddingTop = mPaddingTop + mBorderTopWidth
    val paddingBottom = mPaddingBottom + mBorderBottomWidth
    val paddingLeft = mPaddingLeft + mBorderLeftWidth
    val paddingRight = mPaddingRight + mBorderRightWidth
    mView.setPadding(paddingLeft, paddingTop, paddingRight, paddingBottom)
  }

  @LynxProp(name = "value")
  fun setValue(value: String?) {
    if (value != mView.text.toString()) {
      mView.setText(value)
    }
  }

  @LynxProp(name = "placeholder")
  fun setPlaceholder(placeholder: String?) {
    mView.hint = placeholder
  }

  @LynxProp(name = "maxlines")
  fun setMaxlines(maxlines: Double?) {
    maxlines?.let {
      mView.maxLines = it.toInt()
    }
  }
}