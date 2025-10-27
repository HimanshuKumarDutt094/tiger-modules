package com.modules.localstorage.generated;

import android.content.Context;
import com.lynx.jsbridge.LynxModule;
import com.lynx.jsbridge.LynxMethod;
import com.lynx.tasm.behavior.LynxContext;
import com.lynx.react.bridge.Callback;
import com.lynx.react.bridge.ReadableArray;
import com.lynx.react.bridge.ReadableMap;

/**
 * Generated base class for NativeLocalStorageModule
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
public abstract class NativeLocalStorageModuleSpec extends LynxModule {
  public NativeLocalStorageModuleSpec(Context context) {
    super(context);
  }

  protected Context getContext() {
    LynxContext lynxContext = (LynxContext) mContext;
    return lynxContext.getContext();
  }

  @LynxMethod
  public abstract void setStorageItem(String key, String value);

  @LynxMethod
  public abstract void getStorageItem(String key, Callback callback);

  @LynxMethod
  public abstract void clearStorage();
}