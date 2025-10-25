package com.rfc.tools

import android.content.Context
import  androidx.appcompat.widget.AppCompatEditText
import android.text.InputType
import com.lynx.tasm.behavior.LynxContext
import com.rfc.tools.generated.ExplorerInputSpec
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import com.tigermodule.autolink.LynxElement

/**
 * Implementation of ExplorerInput element using AppCompatEditText
 * Extend the generated base class and implement your logic
 */
@LynxElement(name = "explorerinput")
class ExplorerInput(context: LynxContext) : ExplorerInputSpec(context) {

  override fun createView(context: Context): AppCompatEditText {
    return AppCompatEditText(context).apply {

    }
  }

  override fun setBindinput(bindinput: Callback?) {
    // TODO: Update AppCompatEditText with bindinput
    // Example: view.bindinput = bindinput
  }

  override fun setClassName(className: String?) {
    // TODO: Update AppCompatEditText with className
    // Example: view.className = className
  }

  override fun setId(id: String?) {
    // TODO: Update AppCompatEditText with id
    // Example: view.id = id
  }

  override fun setStyle(style: Any?) {
    // TODO: Update AppCompatEditText with style
    // Example: view.style = style
  }

  override fun setValue(value: Any?) {
    // Update EditText value
    view.setText(value)
  }

  override fun setMaxlines(maxlines: Double?) {
    // TODO: Update AppCompatEditText with maxlines
    // Example: view.maxlines = maxlines
  }

  override fun setPlaceholder(placeholder: String?) {
    // Update EditText placeholder
    view.hint = placeholder
  }
}