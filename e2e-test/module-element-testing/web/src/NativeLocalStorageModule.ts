import { NativeLocalStorageModuleSpec } from "./generated/NativeLocalStorageModuleSpec.js";

/** @lynxnativemodule name:NativeLocalStorageModule */
export class NativeLocalStorageModule extends NativeLocalStorageModuleSpec {
  setStorageItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("Failed to set storage item:", error);
    }
  }

  getStorageItem(key: string, callback: (value: string | null) => void): void {
    try {
      const value = localStorage.getItem(key);
      callback(value);
    } catch (error) {
      console.error("Failed to get storage item:", error);
      callback(null);
    }
  }

  clearStorage(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }
}
