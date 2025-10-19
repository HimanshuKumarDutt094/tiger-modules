type Platform = "kotlin" | "swift";

const typeMap: Record<string, Record<Platform, string>> = {
  null: { kotlin: "Any?", swift: "Any?" },
  undefined: { kotlin: "Any?", swift: "Any?" },
  boolean: { kotlin: "Boolean", swift: "Bool" },
  number: { kotlin: "Double", swift: "Double" },
  string: { kotlin: "String", swift: "String" },
  BigInt: { kotlin: "Long", swift: "String" },
  ArrayBuffer: { kotlin: "ByteArray", swift: "Data" },
  object: { kotlin: "Map<String, Any>", swift: "NSDictionary" },
  array: { kotlin: "List<Any>", swift: "NSArray" },
  function: { kotlin: "Callback", swift: "(NSString) -> Void" },
};

// Utility function
export function convertType(tsType: string, platform: Platform): string {
  tsType = tsType.trim();

  // Handle function type
  if (/^\([^\)]*\)\s*=>\s*void$/.test(tsType)) {
    return typeMap["function"][platform];
  }

  // Handle array (simple) e.g., string[], number[]
  const arrayMatch = tsType.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    const inner = convertType(arrayMatch[1], platform);
    if (platform === "kotlin") return `List<${inner}>`;
    if (platform === "swift") return "NSArray"; // Swift NSArray can hold anything
  }

  return typeMap[tsType] ? typeMap[tsType][platform] : tsType;
}
