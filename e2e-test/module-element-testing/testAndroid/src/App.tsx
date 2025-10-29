// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {NativeLocalStorageModule} from "module-element-testing"
import { useEffect, useState } from "@lynx-js/react";
import type { BaseEvent, Lynx } from "@lynx-js/types";

export function App() {
  const [storedValue, setStoredValue] = useState<string | null>(null);

  const setStorage = () => {
    NativeLocalStorageModule.setStorageItem(
      "testKey",
      "Hello, ReactLynx!",
    );
    getStorage();
  };

  const getStorage = () => {
    NativeLocalStorageModule.getStorageItem("testKey", (value) => {
      setStoredValue(value);
    });
  };

  const clearStorage = () => {
    NativeLocalStorageModule.clearStorage();
    setStoredValue(null);
  };

  useEffect(() => {
    getStorage();
  }, []);

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  } as const;

  const contentBoxStyle = {
    border: "1px solid #ccc",
    padding: "2px",
    marginBottom: "20px",
    borderRadius: "5px",
    width: "300px",
    textAlign: "center",
  } as const;

  const buttonContainerStyle = {
    display: "flex",
    flexDirection: "column",
    width: "max-content",
  } as const;

  const buttonStyle = {
    padding: "2px",
    margin: "5px",
    backgroundColor: "#ec644c",
    borderRadius: "5px",
    fontSize: "16px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    flexShrink: "0",
  };

  const textStyle = {
    fontSize: "18px",
    margin: "10px 0",
    color: "#333",
  };

  const buttonTextStyle = {
    fontSize: "18px",
    margin: "10px 0",
    color: "#fffffe",
    alignSelf: "center",
  };
  const [inputValue, setInputValue] = useState("");

  const handleInput = (e: BaseEvent<"input", { value: string }>) => {
    const currentValue = e.detail.value.trim();
    setInputValue(currentValue);
  };
  return (
    <view style={containerStyle}>
      <view style={contentBoxStyle}>
        <text style={textStyle}>
          Current stored value: {storedValue || "None"}
        </text>
      </view>
      <view style={buttonContainerStyle}>
        <view style={buttonStyle} bindtap={setStorage}>
          <text style={buttonTextStyle}>Set storage: Hello, ReactLynx!</text>
        </view>
        <view style={buttonStyle} bindtap={getStorage}>
          <text style={buttonTextStyle}>Read storage</text>
        </view>
        <view style={buttonStyle} bindtap={clearStorage}>
          <text style={buttonTextStyle}>Clear storage</text>
        </view>
      </view>
        <explorer-input
           id="input-id"
        className="input-box"
        bindinput={handleInput}
        value={inputValue}
        placeholder="Enter Card URL"
        />
    </view>
  );
}
