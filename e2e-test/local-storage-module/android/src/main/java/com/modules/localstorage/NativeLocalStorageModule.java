package com.modules.localstorage;

import android.content.Context;
import android.content.SharedPreferences;
import com.modules.localstorage.generated.NativeLocalStorageModuleSpec;
import com.lynx.react.bridge.Callback;
import com.tigermodule.autolink.LynxNativeModule;

/**
 * Implementation of NativeLocalStorageModule
 * Extend the generated base class and implement your logic
 */
@LynxNativeModule(name = "NativeLocalStorageModule")
public class NativeLocalStorageModule extends NativeLocalStorageModuleSpec {
  private static final String PREF_NAME = "MyLocalStorage";
  
  public NativeLocalStorageModule(Context context) {
    super(context);
  }

  @Override
  public void setStorageItem(String key, String value) {
    SharedPreferences sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    SharedPreferences.Editor editor = sharedPreferences.edit();
    editor.putString(key, value);
    editor.apply();
  }

  @Override
  public void getStorageItem(String key, Callback callback) {
    SharedPreferences sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    String value = sharedPreferences.getString(key, null);
    callback.invoke(value);
  }

  @Override
  public void clearStorage() {
    SharedPreferences sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    SharedPreferences.Editor editor = sharedPreferences.edit();
    editor.clear();
    editor.apply();
  }
}
