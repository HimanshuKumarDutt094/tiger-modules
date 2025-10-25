// Combined modules interface for himanshu-tools
import { TigerModule } from "tiger-module/runtime";

// NativeLocalStorage module interface
export interface NativeLocalStorageModule extends TigerModule {
  setStorageItem(key: string, value: string): void;
  getStorageItem(key: string, callback: (value: string | null) => void): void;
  clearStorage(): void;
}

// LynxjsLinking module interface
export interface LynxjsLinkingModule extends TigerModule {
  openURL(url: string, callback: (err?: string) => void): void;
  openSettings(callback: (err?: string) => void): void;
  sendIntent(
    action: string,
    extras?: Array<{ key: string; value: any }>,
    callback?: (err?: string) => void,
  ): void;
  share(
    content: string,
    options?: { mimeType?: string; dialogTitle?: string },
    callback?: (err?: string) => void,
  ): void;
}

// Export module instances
export const NativeLocalStorage = TigerModule<NativeLocalStorageModule>(
  "NativeLocalStorageModule",
);

export const LynxjsLinking = TigerModule<LynxjsLinkingModule>(
  "LynxjsLinkingModule",
);