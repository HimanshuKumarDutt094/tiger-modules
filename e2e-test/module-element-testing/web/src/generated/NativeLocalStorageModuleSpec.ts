/**
 * Generated base class for NativeLocalStorageModule
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
export abstract class NativeLocalStorageModuleSpec {
  abstract setStorageItem(key: string, value: string): void;

  abstract getStorageItem(key: string, callback: (value: string | null) => void): void;

  abstract clearStorage(): void;
}