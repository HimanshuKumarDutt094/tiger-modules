/// <reference types="@lynx-js/rspeedy/client" />
/// <reference types="module-element-testing/types" />

// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.



import * as ReactLynx from "@lynx-js/react";
import * as Lynx from "@lynx-js/types";

declare module "@lynx-js/types" {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "explorer-input": {
      bindinput?: (e: Lynx.BaseEvent<"input", { value: string }>) => void;
      className?: string;
      id?: string;
      style?: string | Lynx.CSSProperties;
      value?: string | undefined;
      maxlines?: number;
      placeholder?: string;
    };
  }
}
