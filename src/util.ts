type Platform = "kotlin" | "swift";

const primitiveMap: Record<string, Record<Platform, string>> = {
  null: { kotlin: "Any", swift: "Any" },
  undefined: { kotlin: "Any", swift: "Any" },
  boolean: { kotlin: "Boolean", swift: "Bool" },
  number: { kotlin: "Double", swift: "Double" },
  string: { kotlin: "String", swift: "String" },
  BigInt: { kotlin: "Long", swift: "String" },
  ArrayBuffer: { kotlin: "ByteArray", swift: "Data" },
};

// Utility function to convert a Typescript type string to platform type
export function convertType(tsType: string, platform: Platform): string {
  if (!tsType) return platform === "kotlin" ? "Unit" : "Void";
  tsType = tsType.trim();

  // void/Promise<void>
  if (tsType === "void" || tsType === "Promise<void>") {
    return platform === "kotlin" ? "Unit" : "Void";
  }

  // function / callback -> use bridge Callback on Kotlin, closure on Swift
  if (
    tsType.includes("=>") ||
    /callback/i.test(tsType) ||
    /\(.*\)\s*=>/.test(tsType)
  ) {
    return platform === "kotlin" ? "Callback" : "(Any) -> Void";
  }

  // Generic Array<T> or T[] -> bridge array types
  const genericArray = tsType.match(/^Array<\s*(.+)\s*>$/);
  if (genericArray) {
    // represent as ReadableArray on Android, NSArray on iOS
    return platform === "kotlin" ? "ReadableArray" : "NSArray";
  }
  const arrayMatch = tsType.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    return platform === "kotlin" ? "ReadableArray" : "NSArray";
  }

  // Object literal or Record-like types -> ReadableMap/NSDictionary
  if (tsType.startsWith("{") && tsType.endsWith("}")) {
    return platform === "kotlin" ? "ReadableMap" : "NSDictionary";
  }

  // Known primitives
  const lower = tsType.replace(/\s/g, "");
  if (primitiveMap[lower]) return primitiveMap[lower][platform];

  // Fallback: treat unknown object types as Any
  if (/^\w+$/.test(tsType)) {
    return platform === "kotlin" ? "Any" : "Any";
  }

  return platform === "kotlin" ? "Any" : "Any";
}
