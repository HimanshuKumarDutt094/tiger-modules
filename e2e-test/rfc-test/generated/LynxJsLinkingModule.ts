/**
 * Generated TypeScript bindings for LynxJsLinkingModule
 * DO NOT EDIT - This file is auto-generated
 */

export interface LynxJsLinkingModuleInterface {
  openURL(url: string, callback: (err?: string) => void): void;
  openSettings(callback: (err?: string) => void): void;
  sendIntent(action: string, extras?: Array<{ key: string; value: any }>, callback?: (err?: string) => void): void;
  share(content: string, options?: { mimeType?: string; dialogTitle?: string }, callback?: (err?: string) => void): void;
}

// Export for use in Lynx applications
export { LynxJsLinkingModuleInterface as LynxJsLinkingModule };