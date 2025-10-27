type Platform = "kotlin" | "swift" | "java";

const primitiveMap: Record<string, Record<Platform, string>> = {
  null: { kotlin: "Any", swift: "Any", java: "Object" },
  undefined: { kotlin: "Any", swift: "Any", java: "Object" },
  boolean: { kotlin: "Boolean", swift: "Bool", java: "Boolean" },
  number: { kotlin: "Double", swift: "Double", java: "Double" },
  string: { kotlin: "String", swift: "String", java: "String" },
  BigInt: { kotlin: "Long", swift: "String", java: "Long" },
  ArrayBuffer: { kotlin: "ByteArray", swift: "Data", java: "byte[]" },
};

// Utility function to convert a Typescript type string to platform type
export function convertType(tsType: string, platform: Platform): string {
  if (!tsType) {
    if (platform === "kotlin") return "Unit";
    if (platform === "java") return "void";
    return "Void";
  }
  tsType = tsType.trim();

  // void/Promise<void>
  if (tsType === "void" || tsType === "Promise<void>") {
    if (platform === "kotlin") return "Unit";
    if (platform === "java") return "void";
    return "Void";
  }

  // function / callback -> use bridge Callback on Kotlin/Java, closure on Swift
  if (
    tsType.includes("=>") ||
    /callback/i.test(tsType) ||
    /\(.*\)\s*=>/.test(tsType)
  ) {
    if (platform === "kotlin" || platform === "java") return "Callback";
    return "(Any) -> Void";
  }

  // Generic Array<T> or T[] -> bridge array types
  const genericArray = tsType.match(/^Array<\s*(.+)\s*>$/);
  if (genericArray) {
    // represent as ReadableArray on Android, NSArray on iOS
    if (platform === "kotlin" || platform === "java") return "ReadableArray";
    return "NSArray";
  }
  const arrayMatch = tsType.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    if (platform === "kotlin" || platform === "java") return "ReadableArray";
    return "NSArray";
  }

  // Object literal or Record-like types -> ReadableMap/NSDictionary
  if (tsType.startsWith("{") && tsType.endsWith("}")) {
    if (platform === "kotlin" || platform === "java") return "ReadableMap";
    return "NSDictionary";
  }

  // Known primitives
  const lower = tsType.replace(/\s/g, "");
  if (primitiveMap[lower]) return primitiveMap[lower][platform];

  // Fallback: treat unknown object types as Any/Object
  if (/^\w+$/.test(tsType)) {
    if (platform === "kotlin") return "Any";
    if (platform === "java") return "Object";
    return "Any";
  }

  if (platform === "kotlin") return "Any";
  if (platform === "java") return "Object";
  return "Any";
}
