/**
 * Generated TypeScript module augmentation for ExplorerInput element
 * DO NOT EDIT - This file is auto-generated
 */

import type { BaseEvent, CSSProperties } from "@lynx-js/types";
import * as Lynx from "@lynx-js/types";

declare module "@lynx-js/types" {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "explorerinput": {
      bindinput?: (e: BaseEvent<"input", { value: string }>) => void;
      value?: string | undefined;
      maxlines?: number;
      placeholder?: string;
      className?: string;
      id?: string;
      style?: string | Lynx.CSSProperties;
    };
  }
}

// Export element interface for direct usage
export interface ExplorerInputProps {
  bindinput?: (e: BaseEvent<"input", { value: string }>) => void;
  value?: string | undefined;
  maxlines?: number;
  placeholder?: string;
  className?: string;
  id?: string;
  style?: string | Lynx.CSSProperties;
}