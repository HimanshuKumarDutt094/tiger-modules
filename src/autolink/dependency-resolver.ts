/**
 * Dependency resolution system for LynxJS extensions
 * Builds dependency graphs, detects circular dependencies, and provides topological sorting
 */

import type { ExtensionInfo } from "./discovery.js";

/**
 * Dependency graph node
 */
interface DependencyNode {
  extension: ExtensionInfo;
  dependencies: Set<string>;
  dependents: Set<string>;
}

/**
 * Circular dependency information
 */
export interface CircularDependency {
  cycle: string[];
  message: string;
}

/**
 * Dependency resolution result
 */
export interface ResolutionResult {
  /** Extensions in load order (topologically sorted) */
  loadOrder: ExtensionInfo[];
  /** Detected circular dependencies */
  circularDependencies: CircularDependency[];
  /** Missing dependencies */
  missingDependencies: Map<string, string[]>;
}

/**
 * Dependency resolution error
 */
export class DependencyResolutionError extends Error {
  constructor(
    message: string,
    public circularDependencies?: CircularDependency[],
  ) {
    super(message);
    this.name = "DependencyResolutionError";
  }
}

/**
 * Dependency resolver for extensions
 */
export class DependencyResolver {
  private graph = new Map<string, DependencyNode>();

  /**
   * Builds dependency graph and resolves load order
   * @param extensions - List of discovered extensions
   * @returns Resolution result with load order and any issues
   */
  resolve(extensions: ExtensionInfo[]): ResolutionResult {
    // Build dependency graph
    this.buildGraph(extensions);

    // Detect circular dependencies
    const circularDependencies = this.detectCircularDependencies();

    // Find missing dependencies
    const missingDependencies = this.findMissingDependencies();

    // Perform topological sort to determine load order
    const loadOrder = this.topologicalSort();

    return {
      loadOrder,
      circularDependencies,
      missingDependencies,
    };
  }

  /**
   * Builds the dependency graph from extensions
   * @param extensions - List of extensions
   */
  private buildGraph(extensions: ExtensionInfo[]): void {
    this.graph.clear();

    // Create nodes for all extensions
    for (const extension of extensions) {
      this.graph.set(extension.name, {
        extension,
        dependencies: new Set(extension.dependencies),
        dependents: new Set(),
      });
    }

    // Build dependent relationships
    for (const [name, node] of this.graph) {
      for (const depName of node.dependencies) {
        const depNode = this.graph.get(depName);
        if (depNode) {
          depNode.dependents.add(name);
        }
      }
    }
  }

  /**
   * Detects circular dependencies in the graph
   * @returns List of circular dependencies found
   */
  private detectCircularDependencies(): CircularDependency[] {
    const circularDeps: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const pathStack: string[] = [];

    const dfs = (nodeName: string): boolean => {
      visited.add(nodeName);
      recursionStack.add(nodeName);
      pathStack.push(nodeName);

      const node = this.graph.get(nodeName);
      if (!node) return false;

      for (const depName of node.dependencies) {
        if (!this.graph.has(depName)) {
          // Skip missing dependencies (handled separately)
          continue;
        }

        if (!visited.has(depName)) {
          if (dfs(depName)) {
            return true;
          }
        } else if (recursionStack.has(depName)) {
          // Found a cycle
          const cycleStart = pathStack.indexOf(depName);
          const cycle = pathStack.slice(cycleStart);
          cycle.push(depName); // Complete the cycle

          circularDeps.push({
            cycle,
            message: `Circular dependency detected: ${cycle.join(" -> ")}`,
          });
          return true;
        }
      }

      pathStack.pop();
      recursionStack.delete(nodeName);
      return false;
    };

    // Check all nodes for cycles
    for (const nodeName of this.graph.keys()) {
      if (!visited.has(nodeName)) {
        dfs(nodeName);
      }
    }

    return circularDeps;
  }

  /**
   * Finds missing dependencies
   * @returns Map of extension names to their missing dependencies
   */
  private findMissingDependencies(): Map<string, string[]> {
    const missing = new Map<string, string[]>();

    for (const [name, node] of this.graph) {
      const missingDeps: string[] = [];

      for (const depName of node.dependencies) {
        if (!this.graph.has(depName)) {
          missingDeps.push(depName);
        }
      }

      if (missingDeps.length > 0) {
        missing.set(name, missingDeps);
      }
    }

    return missing;
  }

  /**
   * Performs topological sort using Kahn's algorithm
   * @returns Extensions in load order
   */
  private topologicalSort(): ExtensionInfo[] {
    const result: ExtensionInfo[] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Calculate in-degree for each node
    for (const [name, node] of this.graph) {
      inDegree.set(name, node.dependencies.size);
      if (node.dependencies.size === 0) {
        queue.push(name);
      }
    }

    // Process nodes with no dependencies
    while (queue.length > 0) {
      const nodeName = queue.shift()!;
      const node = this.graph.get(nodeName);

      if (node) {
        result.push(node.extension);

        // Reduce in-degree for dependents
        for (const dependentName of node.dependents) {
          const currentDegree = inDegree.get(dependentName) || 0;
          const newDegree = currentDegree - 1;
          inDegree.set(dependentName, newDegree);

          if (newDegree === 0) {
            queue.push(dependentName);
          }
        }
      }
    }

    // If result doesn't contain all nodes, there are circular dependencies
    // In this case, add remaining nodes in arbitrary order
    if (result.length < this.graph.size) {
      for (const [name, node] of this.graph) {
        if (!result.find((ext) => ext.name === name)) {
          result.push(node.extension);
        }
      }
    }

    return result;
  }

  /**
   * Validates that all dependencies can be resolved
   * @param extensions - List of extensions
   * @throws DependencyResolutionError if unresolvable dependencies exist
   */
  validateDependencies(extensions: ExtensionInfo[]): void {
    const result = this.resolve(extensions);

    const errors: string[] = [];

    // Check for circular dependencies
    if (result.circularDependencies.length > 0) {
      errors.push(
        "Circular dependencies detected:",
        ...result.circularDependencies.map((cd) => `  - ${cd.message}`),
      );
    }

    // Check for missing dependencies
    if (result.missingDependencies.size > 0) {
      errors.push("Missing dependencies:");
      for (const [extName, missing] of result.missingDependencies) {
        errors.push(`  - ${extName} requires: ${missing.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      throw new DependencyResolutionError(
        errors.join("\n"),
        result.circularDependencies,
      );
    }
  }

  /**
   * Gets the dependency chain for a specific extension
   * @param extensionName - Name of the extension
   * @param extensions - List of all extensions
   * @returns Ordered list of dependencies
   */
  getDependencyChain(
    extensionName: string,
    extensions: ExtensionInfo[],
  ): ExtensionInfo[] {
    this.buildGraph(extensions);

    const chain: ExtensionInfo[] = [];
    const visited = new Set<string>();

    const collectDependencies = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const node = this.graph.get(name);
      if (!node) return;

      // First collect dependencies
      for (const depName of node.dependencies) {
        collectDependencies(depName);
      }

      // Then add this extension
      chain.push(node.extension);
    };

    collectDependencies(extensionName);

    return chain;
  }
}
