/**
 * Element (LynxUI) code generation
 * Handles generation of LynxUI-based custom elements according to RFC
 */

import fs from "fs";
import path from "path";
import { convertType } from "../../utils/type-converter.js";
import type { PropertyInfo, CodegenContext, ElementInfo } from "../types.js";

export function generateElement(
  elementName: string,
  properties: PropertyInfo[] | undefined,
  context: CodegenContext
): void;
export function generateElement(
  elementInfo: ElementInfo,
  context: CodegenContext
): void;
export function generateElement(
  elementNameOrInfo: string | ElementInfo,
  propertiesOrContext?: PropertyInfo[] | CodegenContext,
  context?: CodegenContext
): void {
  // Handle both old and new function signatures for backward compatibility
  let elementName: string;
  let properties: PropertyInfo[] | undefined;
  let actualContext: CodegenContext;

  if (typeof elementNameOrInfo === 'string') {
    // Old signature: generateElement(elementName, properties, context)
    elementName = elementNameOrInfo;
    properties = propertiesOrContext as PropertyInfo[] | undefined;
    actualContext = context!;
  } else {
    // New signature: generateElement(elementInfo, context)
    const elementInfo = elementNameOrInfo;
    elementName = elementInfo.name;
    properties = elementInfo.properties;
    actualContext = propertiesOrContext as CodegenContext;
  }
  
  // Validate that we have a valid context
  if (!actualContext) {
    throw new Error(`generateElement: context is undefined for element ${elementName}`);
  }
  console.log(`🔨 Generating Element: ${elementName}...`);

  // Generate Android LynxUI Element
  generateAndroidElement(elementName, properties, actualContext);

  // Generate iOS LynxUI Element
  generateIOSElement(elementName, properties, actualContext);

  // Generate Web Element
  generateWebElement(elementName, properties, actualContext);

  // Generate TypeScript module augmentation for IntrinsicElements
  generateTypeScriptModuleAugmentation(elementName, properties);

  console.log(
    `  ✅ Generated LynxUI element: ${elementName} for all platforms`
  );
}

function generateAndroidElement(
  elementName: string,
  properties: PropertyInfo[] | undefined,
  context: CodegenContext
): void {
  const {
    androidPackageName,
    androidLanguage,
    fileExtension,
    androidSourceDir,
  } = context;

  // Generate complete Android element class directly (no spec file)
  const androidElementFile = path.join(
    `./android/src/main/${androidSourceDir}`,
    ...androidPackageName.split("."),
    `${elementName}.${fileExtension}`
  );
  fs.mkdirSync(path.dirname(androidElementFile), { recursive: true });

  if (androidLanguage === "kotlin") {
    generateCompleteKotlinElement(
      androidElementFile,
      elementName,
      properties,
      androidPackageName
    );
  } else {
    generateCompleteJavaElement(
      androidElementFile,
      elementName,
      properties,
      androidPackageName
    );
  }
}

function generateCompleteKotlinElement(
  elementFile: string,
  elementName: string,
  properties: PropertyInfo[] | undefined,
  packageName: string
): void {
  const props = properties || [];

  // Use standard View as default base type (no custom view type configuration)
  const viewType = "View";
  const viewTypeImport = "import android.view.View";

  // Check if we need to import Callback
  const needsCallbackImport = props.some(prop => {
    const kotlinType = convertType(prop.typeText, "kotlin");
    return kotlinType.includes("Callback");
  });

  const callbackImport = needsCallbackImport ? "import com.lynx.react.bridge.Callback" : "";

  const propMethods = props
    .map((prop) => {
      const kotlinType = convertType(prop.typeText, "kotlin");
      const finalType = kotlinType.endsWith("?")
        ? kotlinType
        : kotlinType + (prop.isOptional ? "?" : "");
      return `  @LynxProp(name = "${prop.name}")
  fun set${capitalize(prop.name)}(${prop.name}: ${finalType}) {
    // TODO: Update your View with ${prop.name}
    // Access the native view with: view.someProperty = ${prop.name}
    // Example implementation:
    // view.${prop.name} = ${prop.name}
  }`;
    })
    .join("\n\n");

  const ktElementContent = `package ${packageName}

import android.content.Context
${viewTypeImport}
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.event.LynxCustomEvent
import com.tigermodule.autolink.LynxElement
${callbackImport}

/**
 * ${elementName} element implementation
 * 
 * This is a complete, self-contained element class that you can modify directly.
 * The class extends LynxUI<View> and includes the @LynxElement annotation for
 * automatic discovery by the gradle plugin.
 * 
 * TODO: Customize this class by:
 * 1. Implementing the createView() method to return your desired view type
 * 2. Implementing property setters to update your view
 * 3. Adding event emission calls where needed
 * 4. Optionally changing the View type to a more specific Android view
 */
@LynxElement(name = "${elementName.toLowerCase()}")
class ${elementName}(context: LynxContext) : LynxUI<${viewType}>(context) {

  override fun createView(context: Context): ${viewType} {
    // TODO: Create and configure your View
    // You can change View to any Android view type (Button, TextView, etc.)
    return ${viewType}(context).apply {
      // TODO: Configure your View properties here
      // Example: setBackgroundColor(Color.WHITE)
      // Example: layoutParams = ViewGroup.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
    }
  }

${propMethods || "  // No properties defined"}

  // Helper method for event emission
  // Call this method to send events back to the JavaScript layer
  protected fun emitEvent(name: String, value: Map<String, Any>? = null) {
    val detail = LynxCustomEvent(sign, name)
    value?.forEach { (key, v) ->
      detail.addDetail(key, v)
    }
    lynxContext.eventEmitter.sendCustomEvent(detail)
  }

  // Example event emission methods (uncomment and modify as needed):
  /*
  private fun emitClick() {
    emitEvent("click", mapOf("timestamp" to System.currentTimeMillis()))
  }

  private fun emitChange(newValue: String) {
    emitEvent("change", mapOf("value" to newValue))
  }
  */
}`;

  fs.writeFileSync(elementFile, ktElementContent);
  console.log(`  ✅ Generated complete Kotlin element: ${elementName}.kt`);
}

function generateCompleteJavaElement(
  elementFile: string,
  elementName: string,
  properties: PropertyInfo[] | undefined,
  packageName: string
): void {
  const props = properties || [];

  // Use standard View as default base type (no custom view type configuration)
  const viewType = "View";
  const viewTypeImport = "import android.view.View;";

  // Check if we need to import Callback
  const needsCallbackImport = props.some(prop => {
    const javaType = convertType(prop.typeText, "java");
    return javaType.includes("Callback");
  });

  const callbackImport = needsCallbackImport ? "import com.lynx.react.bridge.Callback;" : "";

  const propMethods = props
    .map((prop) => {
      const javaType = convertType(prop.typeText, "java");
      return `  @LynxProp(name = "${prop.name}")
  public void set${capitalize(prop.name)}(${javaType} ${prop.name}) {
    // TODO: Update your View with ${prop.name}
    // Access the native view with: getView().someMethod(${prop.name})
    // Example implementation:
    // getView().set${capitalize(prop.name)}(${prop.name});
  }`;
    })
    .join("\n\n");

  const javaElementContent = `package ${packageName};

import android.content.Context;
${viewTypeImport}
import com.lynx.tasm.behavior.LynxContext;
import com.lynx.tasm.behavior.ui.LynxUI;
import com.lynx.tasm.behavior.LynxProp;
import com.lynx.tasm.event.LynxCustomEvent;
import com.tigermodule.autolink.LynxElement;
${callbackImport}
import java.util.Map;
import java.util.HashMap;

/**
 * ${elementName} element implementation
 * 
 * This is a complete, self-contained element class that you can modify directly.
 * The class extends LynxUI<View> and includes the @LynxElement annotation for
 * automatic discovery by the gradle plugin.
 * 
 * TODO: Customize this class by:
 * 1. Implementing the createView() method to return your desired view type
 * 2. Implementing property setters to update your view
 * 3. Adding event emission calls where needed
 * 4. Optionally changing the View type to a more specific Android view
 */
@LynxElement(name = "${elementName.toLowerCase()}")
public class ${elementName} extends LynxUI<${viewType}> {
  
  public ${elementName}(LynxContext context) {
    super(context);
  }

  @Override
  protected ${viewType} createView(Context context) {
    // TODO: Create and configure your View
    // You can change View to any Android view type (Button, TextView, etc.)
    ${viewType} view = new ${viewType}(context);
    
    // TODO: Configure your View properties here
    // Example: view.setBackgroundColor(Color.WHITE);
    // Example: view.setLayoutParams(new ViewGroup.LayoutParams(MATCH_PARENT, WRAP_CONTENT));
    
    return view;
  }

${propMethods || "  // No properties defined"}

  // Helper method for event emission
  // Call this method to send events back to the JavaScript layer
  protected void emitEvent(String name, Map<String, Object> value) {
    LynxCustomEvent detail = new LynxCustomEvent(getSign(), name);
    if (value != null) {
      for (Map.Entry<String, Object> entry : value.entrySet()) {
        detail.addDetail(entry.getKey(), entry.getValue());
      }
    }
    getLynxContext().getEventEmitter().sendCustomEvent(detail);
  }

  // Overloaded helper method for simple event emission
  protected void emitEvent(String name) {
    emitEvent(name, null);
  }

  // Example event emission methods (uncomment and modify as needed):
  /*
  private void emitClick() {
    Map<String, Object> eventData = new HashMap<>();
    eventData.put("timestamp", System.currentTimeMillis());
    emitEvent("click", eventData);
  }

  private void emitChange(String newValue) {
    Map<String, Object> eventData = new HashMap<>();
    eventData.put("value", newValue);
    emitEvent("change", eventData);
  }
  */
}`;

  fs.writeFileSync(elementFile, javaElementContent);
  console.log(`  ✅ Generated complete Java element: ${elementName}.java`);
}









function generateIOSElement(
  elementName: string,
  properties: PropertyInfo[] | undefined,
  context: CodegenContext
): void {
  // Generate complete iOS Swift element class directly (no spec file)
  const swiftElementFile = path.join("./ios/src", `${elementName}.swift`);
  fs.mkdirSync(path.dirname(swiftElementFile), { recursive: true });

  const props = properties || [];
  const propMethods = props
    .map((prop) => {
      const swiftType = convertType(prop.typeText, "swift");
      const finalType = swiftType.endsWith("?")
        ? swiftType
        : swiftType + (prop.isOptional ? "?" : "");
      return `    @objc func set${capitalize(prop.name)}(_ ${
        prop.name
      }: ${finalType}) {
        // TODO: Update your view with ${prop.name}
        // Access the native view with: view.${prop.name} = ${prop.name}
        // Example implementation:
        // view.${prop.name} = ${prop.name}
    }`;
    })
    .join("\n\n");

  const swiftElementContent = `import Foundation
import UIKit

/**
 * ${elementName} element implementation
 * 
 * This is a complete, self-contained element class that you can modify directly.
 * The class extends LynxUI<UIView> and can be discovered by the build system.
 * 
 * TODO: Customize this class by:
 * 1. Implementing the createView() method to return your desired view type
 * 2. Implementing property setters to update your view
 * 3. Adding event emission calls where needed
 * 4. Optionally changing the UIView type to a more specific iOS view
 */
@objcMembers
public final class ${elementName}: LynxUI<UIView> {

    public override func createView() -> UIView {
        // TODO: Create and configure your UIView
        // You can change UIView to any iOS view type (UIButton, UITextField, etc.)
        let view = UIView()
        
        // TODO: Configure your view properties here
        // Example: view.backgroundColor = UIColor.white
        // Example: view.layer.cornerRadius = 8
        
        return view
    }

${propMethods || "    // No properties defined"}

    // Helper method for event emission
    // Call this method to send events back to the JavaScript layer
    protected func emitEvent(name: String, value: [String: Any]? = nil) {
        let detail = LynxCustomEvent(sign: getSign(), name: name)
        if let value = value {
            for (key, v) in value {
                detail.addDetail(key, value: v)
            }
        }
        getLynxContext().getEventEmitter().sendCustomEvent(detail)
    }

    // Example event emission methods (uncomment and modify as needed):
    /*
    private func emitClick() {
        emitEvent(name: "click", value: ["timestamp": Date().timeIntervalSince1970])
    }

    private func emitChange(newValue: String) {
        emitEvent(name: "change", value: ["value": newValue])
    }
    */
}`;

  fs.writeFileSync(swiftElementFile, swiftElementContent);
  console.log(`  ✅ Generated complete iOS element: ${elementName}.swift`);
}

function generateWebElement(
  elementName: string,
  properties: PropertyInfo[] | undefined,
  context: CodegenContext
): void {
  // Generate complete Web element class directly (no spec file)
  const webElementFile = path.join("./web/src", `${elementName}.ts`);
  fs.mkdirSync(path.dirname(webElementFile), { recursive: true });

  const props = properties || [];
  
  // Convert Lynx types to appropriate web types
  const convertToWebType = (typeText: string): string => {
    // Replace BaseEvent with standard Event types
    if (typeText.includes('BaseEvent')) {
      return typeText.replace(/BaseEvent<[^>]+>/g, 'Event');
    }
    // Replace CSSProperties with CSSStyleDeclaration or string
    if (typeText.includes('CSSProperties')) {
      return typeText.replace(/CSSProperties/g, 'CSSStyleDeclaration');
    }
    return typeText;
  };

  const propMethods = props
    .map((prop) => {
      const webType = convertToWebType(prop.typeText);
      return `  set${capitalize(prop.name)}(${prop.name}${
        prop.isOptional ? "?" : ""
      }: ${webType}): void {
    // TODO: Update your element with ${prop.name}
    // Access the element with: this.someProperty = ${prop.name}
    // Example implementation:
    // this.setAttribute('${prop.name}', String(${prop.name}));
  }`;
    })
    .join("\n\n");

  const webElementContent = `/**
 * ${elementName} element implementation
 * 
 * This is a complete, self-contained element class that you can modify directly.
 * The class extends HTMLElement and can be discovered by the build system.
 * 
 * TODO: Customize this class by:
 * 1. Implementing property setters to update your element
 * 2. Adding event emission calls where needed
 * 3. Implementing lifecycle methods (connectedCallback, disconnectedCallback)
 * 4. Optionally using Shadow DOM for encapsulation
 */
export class ${elementName} extends HTMLElement {
  
  constructor() {
    super();
    // TODO: Initialize your custom element
    // Example: this.attachShadow({ mode: 'open' });
    // Example: this.innerHTML = '<div>Hello World</div>';
  }

  connectedCallback() {
    // TODO: Element added to DOM
    // This is called when the element is inserted into the DOM
  }

  disconnectedCallback() {
    // TODO: Element removed from DOM
    // This is called when the element is removed from the DOM
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    // TODO: Handle attribute changes
    // This is called when observed attributes change
  }

  static get observedAttributes() {
    // TODO: Return array of attribute names to observe
    // Example: return ['value', 'placeholder'];
    return [];
  }

${propMethods || "  // No properties defined"}

  // Helper method for event emission
  // Call this method to send events back to the JavaScript layer
  protected emitEvent(name: string, value?: Record<string, any>): void {
    const event = new CustomEvent(name, {
      detail: value,
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(event);
  }

  // Example event emission methods (uncomment and modify as needed):
  /*
  private emitClick() {
    this.emitEvent("click", { timestamp: Date.now() });
  }

  private emitChange(newValue: string) {
    this.emitEvent("change", { value: newValue });
  }
  */
}

// Register the custom element
customElements.define('${elementName.toLowerCase()}', ${elementName});`;

  fs.writeFileSync(webElementFile, webElementContent);
  console.log(`  ✅ Generated complete Web element: ${elementName}.ts`);
}

function generateTypeScriptModuleAugmentation(
  elementName: string,
  properties: PropertyInfo[] | undefined
): void {
  // Generate TypeScript module augmentation for IntrinsicElements
  const rootGeneratedDir = path.join("./generated");
  fs.mkdirSync(rootGeneratedDir, { recursive: true });

  const rootGeneratedFile = path.join(rootGeneratedDir, `${elementName}.d.ts`);
  const props = properties || [];

  // Detect required imports from property types
  const requiredImports = new Set<string>();
  const allTypeText = props.map(prop => prop.typeText).join(' ');
  
  if (allTypeText.includes('BaseEvent')) {
    requiredImports.add('BaseEvent');
  }
  if (allTypeText.includes('CSSProperties')) {
    requiredImports.add('CSSProperties');
  }

  // Generate import statement if needed
  const importStatement = requiredImports.size > 0 
    ? `import type { ${Array.from(requiredImports).join(', ')} } from "@lynx-js/types";\n`
    : '';

  // Common properties that should not be duplicated
  const commonProps = new Set(['className', 'id', 'style']);
  
  // Filter out common properties from the interface properties to avoid duplication
  const filteredProps = props.filter(prop => !commonProps.has(prop.name));

  // Generate properties interface
  const propsInterface = filteredProps.length > 0
    ? filteredProps
        .map(
          (prop) =>
            `      ${prop.name}${prop.isOptional ? "?" : ""}: ${
              prop.typeText
            };`
        )
        .join("\n")
    : "      // No custom props defined";

  const moduleAugmentation = `/**
 * Generated TypeScript module augmentation for ${elementName} element
 * DO NOT EDIT - This file is auto-generated
 */

${importStatement}import * as Lynx from "@lynx-js/types";

declare module "@lynx-js/types" {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "${elementName.toLowerCase()}": {
${propsInterface}
      className?: string;
      id?: string;
      style?: string | Lynx.CSSProperties;
    };
  }
}

// Export element interface for direct usage
export interface ${elementName}Props {
${filteredProps
  .map(
    (prop) => `  ${prop.name}${prop.isOptional ? "?" : ""}: ${prop.typeText};`
  )
  .join("\n")}
  className?: string;
  id?: string;
  style?: string | Lynx.CSSProperties;
}`;

  fs.writeFileSync(rootGeneratedFile, moduleAugmentation);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}




