import type * as Lynx from "@lynx-js/types";
import { TigerModule } from "tiger/runtime";

// NativeLocalStorage module interface
interface NativeLocalStorageModule extends TigerModule {
  setStorageItem(key: string, value: string): void;
  getStorageItem(key: string, callback: (value: string | null) => void): void;
  clearStorage(): void;
}
export const NativeLocalStorageModule = TigerModule<NativeLocalStorageModule>(
  "NativeLocalStorageModule"
);

// ExplorerInput element interface
export interface ExplorerInputProps {
  bindinput?: (e: Lynx.BaseEvent<"input", { value: string }>) => void;
  className?: string;
  id?: string;
  style?: string | Lynx.CSSProperties;
  value?: string | undefined;
  maxlines?: number;
  placeholder?: string;
}
