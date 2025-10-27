import type { Logger } from "../logger.js";

export type LoggerFunction = (message?: string | undefined, ...args: unknown[]) => void;

// Defines the context for an action execution
export interface ActionContext {
  [key: string]: unknown; // Allow for additional context properties
  devMode: boolean;
  environment: "development" | "production";
  logger: Logger;
  projectRoot: string;
  spinner?: {
    message: (msg?: string | undefined) => void;
    start: (msg?: string | undefined) => void;
    stop: (msg?: string | undefined, code?: number | undefined) => void;
  };
}

// Defines the result of an action execution
export interface ActionResult {
  crucialOutputPaths?: string[]; // Optional: paths to the essential output artifacts, which will be shown in the output
  outputPaths?: string[]; // Optional: paths to the output artifacts
  result?: Record<string, unknown>;
}

// Defines the interface for an action
export interface Action {
  description?: string;
  execute(context: ActionContext, previousResult?: ActionResult): Promise<ActionResult>;
  name: string;
}