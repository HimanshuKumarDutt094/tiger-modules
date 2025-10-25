import type { BaseEvent, CSSProperties } from "@lynx-js/types";
import { TigerModule } from "tiger-module/runtime";

// LynxJsLinking module interface
export interface LynxJsLinkingModule extends TigerModule {
  openURL(url: string, callback: (err?: string) => void): void;
  openSettings(callback: (err?: string) => void): void;
  sendIntent(
    action: string,
    extras?: Array<{ key: string; value: any }>,
    callback?: (err?: string) => void
  ): void;
  share(
    content: string,
    options?: { mimeType?: string; dialogTitle?: string },
    callback?: (err?: string) => void
  ): void;
}
export const LynxjsLinkingModule = TigerModule<LynxJsLinkingModule>(
  "LynxjsLinkingModule"
);

/**
 * ExplorerInput element interface
 */
export interface ExplorerInputProps {
  // Define your element props here
  bindinput?: (e: BaseEvent<"input", { value: string }>) => void;
  className?: string;
  id?: string;
  style?: string | CSSProperties;
  value?: string | undefined;
  maxlines?: number;
  placeholder?: string;
}
