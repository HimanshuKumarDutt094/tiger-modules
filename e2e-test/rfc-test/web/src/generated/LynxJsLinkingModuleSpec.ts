/**
 * Generated base class for LynxJsLinkingModule
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
export abstract class LynxJsLinkingModuleSpec {
  abstract openURL(url: string, callback: (err?: string) => void): void;

  abstract openSettings(callback: (err?: string) => void): void;

  abstract share(content: string, options?: { mimeType?: string; dialogTitle?: string }, callback?: (err?: string) => void): void;
}