package com.modules.localstorage;

import android.content.Context;
import android.content.SharedPreferences;

import com.lynx.jsbridge.LynxMethod;
import com.lynx.jsbridge.LynxModule;
import com.lynx.tasm.behavior.LynxContext;
import com.lynx.react.bridge.Callback;

public class NativeLocalStorageModule extends LynxModule {
  private static final String PREF_NAME = "MyLocalStorage";
  public NativeLocalStorageModule(Context context) {
    super(context);
  }

  Context getContext() {
    LynxContext lynxContext = (LynxContext) mContext;
    return lynxContext.getContext();
  }

  @LynxMethod
  public void setStorageItem(String key, String value) {
    SharedPreferences sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    SharedPreferences.Editor editor = sharedPreferences.edit();
    editor.putString(key, value);
    editor.apply();
  }

  @LynxMethod
  public void getStorageItem(String key, Callback callback) {
    SharedPreferences sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    String value = sharedPreferences.getString(key, null);
    callback.invoke(value);
  }

  @LynxMethod
  public void clearStorage() {
    SharedPreferences sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    SharedPreferences.Editor editor = sharedPreferences.edit();
    editor.clear();
    editor.apply();
  }
}
