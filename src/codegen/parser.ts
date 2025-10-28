/**
 * TypeScript interface parsing logic
 * Handles parsing of TypeScript source files to extract interface information
 */

import { Project } from "ts-morph";
import path from "path";
import type {
  MethodInfo,
  PropertyInfo,
  MethodParam,
  InterfaceMethodsMap,
  ElementInfo,
} from "./types.js";
import type { ElementConfig } from "../autolink/config.js";

export function parseInterfaces(
  srcFile: string,
  nativeModules: string[],
  elements: string[],
  services: string[]
): InterfaceMethodsMap {
  // Load TS source
  const project = new Project();
  const srcPath = path.resolve(srcFile);
  const sourceFile = project.addSourceFileAtPath(srcPath);

  // Find ALL interfaces (TigerModule, Element props, Service interfaces)
  const allInterfaces = sourceFile.getInterfaces();

  // Separate different types of interfaces
  const moduleInterfaces = allInterfaces.filter((i) =>
    i.getExtends().some((e) => e.getText() === "TigerModule")
  );

  const elementInterfaces = allInterfaces.filter(
    (i) => i.getName().endsWith("Props") || elements.includes(i.getName())
  );

  const serviceInterfaces = allInterfaces.filter(
    (i) =>
      services.includes(i.getName()) ||
      (!i.getExtends().some((e) => e.getText() === "TigerModule") &&
        !i.getName().endsWith("Props"))
  );

  console.log(
    `📋 Found ${moduleInterfaces.length} module interface(s), ${elementInterfaces.length} element interface(s), ${serviceInterfaces.length} service interface(s)`
  );

  // Create a map of interface name to methods/properties for easy lookup
  const interfaceMethodsMap: InterfaceMethodsMap = new Map();

  // Process module interfaces
  moduleInterfaces.forEach((interfaceDecl) => {
    const interfaceName = interfaceDecl.getName();
    const methods: MethodInfo[] = interfaceDecl.getMethods().map((m) => {
      const name = m.getName();
      const params: MethodParam[] = m.getParameters().map((p) => {
        const paramName = p.getName();
        const isOptional = p.isOptional();
        const typeNode = p.getTypeNode();
        const typeText = typeNode ? typeNode.getText() : p.getType().getText();
        return { paramName, isOptional, typeText };
      });
      const returnType = m.getReturnType().getText() || "void";
      return { name, params, returnType };
    });
    interfaceMethodsMap.set(interfaceName, methods);
    console.log(`  ✓ Module ${interfaceName}: ${methods.length} method(s)`);
  });

  // Process element interfaces (props) with JSDoc parsing
  elementInterfaces.forEach((interfaceDecl) => {
    const interfaceName = interfaceDecl.getName();
    const properties: PropertyInfo[] = interfaceDecl
      .getProperties()
      .map((p) => {
        const name = p.getName();
        const isOptional = p.hasQuestionToken();
        const typeText = p.getTypeNode()?.getText() || p.getType().getText();
        return { name, isOptional, typeText };
      });

    // Android view type will be determined from element config only

    interfaceMethodsMap.set(interfaceName, properties);
    console.log(`  ✓ Element ${interfaceName}: ${properties.length} prop(s)`);
  });

  // Process service interfaces
  serviceInterfaces.forEach((interfaceDecl) => {
    const interfaceName = interfaceDecl.getName();
    const methods: MethodInfo[] = interfaceDecl.getMethods().map((m) => {
      const name = m.getName();
      const params: MethodParam[] = m.getParameters().map((p) => {
        const paramName = p.getName();
        const isOptional = p.isOptional();
        const typeNode = p.getTypeNode();
        const typeText = typeNode ? typeNode.getText() : p.getType().getText();
        return { paramName, isOptional, typeText };
      });
      const returnType = m.getReturnType().getText() || "void";
      return { name, params, returnType };
    });
    interfaceMethodsMap.set(interfaceName, methods);
    console.log(`  ✓ Service ${interfaceName}: ${methods.length} method(s)`);
  });

  return interfaceMethodsMap;
}

/**
 * Parses element interfaces and returns detailed ElementInfo objects
 * @param srcFile - Path to the TypeScript source file
 * @param elements - Array of element configurations to parse
 * @returns Map of element name to ElementInfo
 */
export function parseElementInterfaces(
  srcFile: string,
  elements: ElementConfig[]
): Map<string, ElementInfo> {
  // Load TS source
  const project = new Project();
  const srcPath = path.resolve(srcFile);
  const sourceFile = project.addSourceFileAtPath(srcPath);

  // Extract element names from config
  const elementNames = elements.map((el) => el.name);

  // Find element interfaces
  const allInterfaces = sourceFile.getInterfaces();
  const elementInterfaces = allInterfaces.filter(
    (i) => i.getName().endsWith("Props") || elementNames.includes(i.getName())
  );

  const elementInfoMap = new Map<string, ElementInfo>();

  elementInterfaces.forEach((interfaceDecl) => {
    const interfaceName = interfaceDecl.getName();

    // Extract properties
    const properties: PropertyInfo[] = interfaceDecl
      .getProperties()
      .map((p) => {
        const name = p.getName();
        const isOptional = p.hasQuestionToken();
        const typeText = p.getTypeNode()?.getText() || p.getType().getText();
        return { name, isOptional, typeText };
      });

    // Determine element name (remove "Props" suffix if present)
    const elementName = interfaceName.endsWith("Props")
      ? interfaceName.slice(0, -5)
      : interfaceName;

    // Find the corresponding element config to get tagName
    const elementConfig = elements.find(el => el.name === elementName);
    
    const elementInfo: ElementInfo = {
      name: elementName,
      tagName: elementConfig?.tagName,
      properties,
    };

    elementInfoMap.set(elementName, elementInfo);
    console.log(`  ✓ Element ${elementName}: ${properties.length} prop(s)`);
  });

  return elementInfoMap;
}
