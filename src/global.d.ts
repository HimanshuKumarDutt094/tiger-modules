// lynxjs-module global declarations
/// <reference types="@lynx-js/types" />

declare global {
  // Make TigerModule available globally so users can access their modules directly
  const TigerModule: <T extends import('./index').TigerModule>() => T;
}

export {};
