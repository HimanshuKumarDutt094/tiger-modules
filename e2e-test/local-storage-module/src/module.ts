// NativeLocalStorage module interface
import { TigerModule } from "tiger-module/runtime";
export interface NativeLocalStorageModule extends TigerModule {
  setStorageItem(key: string, value: string): void;
  getStorageItem(key: string, callback: (value: string | null) => void): void;
  clearStorage(): void;
}

export const NativeLocalStorage = TigerModule<NativeLocalStorageModule>(
  "NativeLocalStorageModule",
);
