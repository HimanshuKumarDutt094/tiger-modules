// LynxjsLinking module interface
import { TigerModule } from "tiger-module/runtime";
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
export const LynxjsLinkingModule = TigerModule<LynxjsLinkingModule>(
  "LynxjsLinkingModule",
);
