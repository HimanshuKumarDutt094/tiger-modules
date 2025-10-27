/**
 * Generated TypeScript bindings for NativeLocalStorageModule
 * DO NOT EDIT - This file is auto-generated
 */

export interface NativeLocalStorageModuleInterface {
  setStorageItem(key: string, value: string): void;
  getStorageItem(key: string, callback: (value: string | null) => void): void;
  clearStorage(): void;
}

// Export for use in Lynx applications
export { NativeLocalStorageModuleInterface as NativeLocalStorageModule };