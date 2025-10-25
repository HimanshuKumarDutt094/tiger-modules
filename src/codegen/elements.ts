/**
 * Element (LynxUI) code generation
 * Handles generation of LynxUI-based custom elements according to RFC
 */

import fs from "fs";
import path from "path";
import { convertType } from "../util";
import type { PropertyInfo, CodegenContext, ElementInfo } from "./types";

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
  let androidViewType: import("./types.js").AndroidViewTypeConfig | undefined;

  if (typeof elementNameOrInfo === 'string') {
    // Old signature: generateElement(elementName, properties, context)
    elementName = elementNameOrInfo;
    properties = propertiesOrContext as PropertyInfo[] | undefined;
    actualContext = context!;
    androidViewType = undefined;
  } else {
    // New signature: generateElement(elementInfo, context)
    const elementInfo = elementNameOrInfo;
    elementName = elementInfo.name;
    properties = elementInfo.properties;
    actualContext = propertiesOrContext as CodegenContext;
    androidViewType = elementInfo.androidViewType;
  }
  
  // Validate that we have a valid context
  if (!actualContext) {
    throw new Error(`generateElement: context is undefined for element ${elementName}`);
  }
  console.log(`🔨 Generating Element: ${elementName}...`);
  if (androidViewType) {
    console.log(`  📱 Using Android view type: ${androidViewType.viewType}`);
  }

  // Generate Android LynxUI Element
  generateAndroidElement(elementName, properties, actualContext, androidViewType);

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
  context: CodegenContext,
  androidViewType?: import("./types.js").AndroidViewTypeConfig
): void {
  const {
    androidPackageName,
    androidLanguage,
    fileExtension,
    androidSourceDir,
  } = context;

  // Generate Android LynxUI base class
  const androidSpecFile = path.join(
    `./android/src/main/${androidSourceDir}`,
    ...androidPackageName.split("."),
    "generated",
    `${elementName}Spec.${fileExtension}`
  );
  fs.mkdirSync(path.dirname(androidSpecFile), { recursive: true });

  if (androidLanguage === "kotlin") {
    generateKotlinElement(
      androidSpecFile,
      elementName,
      properties,
      androidPackageName,
      androidViewType
    );
  } else {
    generateJavaElement(
      androidSpecFile,
      elementName,
      properties,
      androidPackageName,
      androidViewType
    );
  }

  // Generate implementation template (only if it doesn't exist)
  const androidImplFile = path.join(
    `./android/src/main/${androidSourceDir}`,
    ...androidPackageName.split("."),
    `${elementName}.${fileExtension}`
  );

  if (!fs.existsSync(androidImplFile)) {
    if (androidLanguage === "kotlin") {
      generateKotlinElementImplementation(
        androidImplFile,
        elementName,
        properties,
        androidPackageName,
        androidViewType
      );
    } else {
      generateJavaElementImplementation(
        androidImplFile,
        elementName,
        properties,
        androidPackageName,
        androidViewType
      );
    }
  }
}

function generateKotlinElement(
  specFile: string,
  elementName: string,
  properties: PropertyInfo[] | undefined,
  packageName: string,
  androidViewType?: import("./types.js").AndroidViewTypeConfig
): void {
  const specClassName = `${elementName}Spec`;
  const props = properties || [];

  // Determine view type and imports
  const viewType = androidViewType?.shortName || "View";
  const viewTypeImport = androidViewType 
    ? `import ${androidViewType.packageName}.${androidViewType.shortName}`
    : "import android.view.View";
  
  // Generate additional imports that might be needed for specific view types
  const additionalImports = getAdditionalAndroidImports(androidViewType?.shortName || "View");
  if (additionalImports.length > 0 && androidViewType) {
    console.log(`    📦 Adding ${additionalImports.length} additional Kotlin imports for ${androidViewType.shortName}`);
  }

  const propMethods = props
    .map((prop) => {
      const kotlinType = convertType(prop.typeText, "kotlin");
      const finalType = kotlinType.endsWith("?")
        ? kotlinType
        : kotlinType + (prop.isOptional ? "?" : "");
      return `  @LynxProp(name = "${prop.name}")
  abstract fun set${capitalize(prop.name)}(${prop.name}: ${finalType})`;
    })
    .join("\n\n");

  const ktSpecContent = `package ${packageName}.generated

import android.content.Context
${viewTypeImport}
${additionalImports.join('\n')}
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.event.LynxCustomEvent
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap

/**
 * Generated base class for ${elementName} element
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
abstract class ${specClassName}(context: LynxContext) : LynxUI<${viewType}>(context) {

  // Abstract method to create the native view
  abstract override fun createView(context: Context): ${viewType}

  // Property handlers
${propMethods || "  // No properties defined"}

  // Helper method for event emission
  protected fun emitEvent(name: String, value: Map<String, Any>?) {
    val detail = LynxCustomEvent(sign, name)
    value?.forEach { (key, v) ->
      detail.addDetail(key, v)
    }
    lynxContext.eventEmitter.sendCustomEvent(detail)
  }
}`;

  fs.writeFileSync(specFile, ktSpecContent);
}

function generateJavaElement(
  specFile: string,
  elementName: string,
  properties: PropertyInfo[] | undefined,
  packageName: string,
  androidViewType?: import("./types.js").AndroidViewTypeConfig
): void {
  const specClassName = `${elementName}Spec`;
  const props = properties || [];

  // Determine view type and imports
  const viewType = androidViewType?.shortName || "View";
  const viewTypeImport = androidViewType 
    ? `import ${androidViewType.packageName}.${androidViewType.shortName};`
    : "import android.view.View;";
  
  // Generate additional imports that might be needed for specific view types
  const additionalImports = getAdditionalAndroidImports(androidViewType?.shortName || "View", "java");
  if (additionalImports.length > 0 && androidViewType) {
    console.log(`    📦 Adding ${additionalImports.length} additional Java imports for ${androidViewType.shortName}`);
  }

  const propMethods = props
    .map((prop) => {
      const javaType = convertType(prop.typeText, "java");
      return `  @LynxProp(name = "${prop.name}")
  public abstract void set${capitalize(prop.name)}(${javaType} ${prop.name});`;
    })
    .join("\n\n");

  const javaSpecContent = `package ${packageName}.generated;

import android.content.Context;
${viewTypeImport}
${additionalImports.join('\n')}
import com.lynx.tasm.behavior.LynxContext;
import com.lynx.tasm.behavior.ui.LynxUI;
import com.lynx.tasm.behavior.LynxProp;
import com.lynx.tasm.behavior.LynxUIMethod;
import com.lynx.tasm.event.LynxCustomEvent;
import com.lynx.react.bridge.Callback;
import com.lynx.react.bridge.ReadableMap;
import java.util.Map;

/**
 * Generated base class for ${elementName} element
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
public abstract class ${specClassName} extends LynxUI<${viewType}> {
  
  public ${specClassName}(LynxContext context) {
    super(context);
  }

  // Abstract method to create the native view
  protected abstract ${viewType} createView(Context context);

  // Property handlers
${propMethods || "  // No properties defined"}

  // Helper method for event emission
  protected void emitEvent(String name, Map<String, Object> value) {
    LynxCustomEvent detail = new LynxCustomEvent(getSign(), name);
    if (value != null) {
      for (Map.Entry<String, Object> entry : value.entrySet()) {
        detail.addDetail(entry.getKey(), entry.getValue());
      }
    }
    getLynxContext().getEventEmitter().sendCustomEvent(detail);
  }
}`;

  fs.writeFileSync(specFile, javaSpecContent);
}

function generateKotlinElementImplementation(
  implFile: string,
  elementName: string,
  properties: PropertyInfo[] | undefined,
  packageName: string,
  androidViewType?: import("./types.js").AndroidViewTypeConfig
): void {
  const specClassName = `${elementName}Spec`;
  const props = properties || [];

  // Determine view type and imports
  const viewType = androidViewType?.shortName || "View";
  const viewTypeImport = androidViewType 
    ? `import ${androidViewType.packageName}.${androidViewType.shortName}`
    : "import android.view.View";
  
  // Generate additional imports that might be needed for specific view types
  const additionalImports = getAdditionalAndroidImports(androidViewType?.shortName || "View");
  if (additionalImports.length > 0 && androidViewType) {
    console.log(`    📦 Adding ${additionalImports.length} additional Kotlin implementation imports for ${androidViewType.shortName}`);
  }

  // Generate view-specific instantiation examples
  const getViewInstantiationExample = (viewType: string): string => {
    switch (viewType) {
      case "AppCompatEditText":
        return `    // Create and configure AppCompatEditText
    return AppCompatEditText(context).apply {
      // Configure your EditText properties
      // hint = "Enter text here"
      // inputType = InputType.TYPE_CLASS_TEXT
      // setSingleLine(true)
      // isFocusable = true
      // isFocusableInTouchMode = true
    }`;
      case "Button":
        return `    // Create and configure Button
    return Button(context).apply {
      // Configure your Button properties
      // text = "Click me"
      // setOnClickListener { /* handle click */ }
      // isClickable = true
    }`;
      case "RecyclerView":
        return `    // Create and configure RecyclerView
    return RecyclerView(context).apply {
      // Configure your RecyclerView properties
      // layoutManager = LinearLayoutManager(context)
      // adapter = /* your adapter */
      // setHasFixedSize(true)
    }`;
      case "ImageView":
        return `    // Create and configure ImageView
    return ImageView(context).apply {
      // Configure your ImageView properties
      // scaleType = ImageView.ScaleType.CENTER_CROP
      // setImageResource(R.drawable.placeholder)
      // adjustViewBounds = true
    }`;
      case "TextView":
        return `    // Create and configure TextView
    return TextView(context).apply {
      // Configure your TextView properties
      // text = "Default text"
      // textSize = 16f
      // gravity = Gravity.CENTER
    }`;
      case "EditText":
        return `    // Create and configure EditText
    return EditText(context).apply {
      // Configure your EditText properties
      // hint = "Enter text here"
      // inputType = InputType.TYPE_CLASS_TEXT
      // setSingleLine(true)
    }`;
      case "LinearLayout":
        return `    // Create and configure LinearLayout
    return LinearLayout(context).apply {
      // Configure your LinearLayout properties
      // orientation = LinearLayout.VERTICAL
      // gravity = Gravity.CENTER
    }`;
      case "RelativeLayout":
        return `    // Create and configure RelativeLayout
    return RelativeLayout(context).apply {
      // Configure your RelativeLayout properties
      // gravity = Gravity.CENTER
    }`;
      case "FrameLayout":
        return `    // Create and configure FrameLayout
    return FrameLayout(context).apply {
      // Configure your FrameLayout properties
      // foregroundGravity = Gravity.CENTER
    }`;
      case "ScrollView":
        return `    // Create and configure ScrollView
    return ScrollView(context).apply {
      // Configure your ScrollView properties
      // isScrollbarFadingEnabled = true
      // isFillViewport = true
    }`;
      case "WebView":
        return `    // Create and configure WebView
    return WebView(context).apply {
      // Configure your WebView properties
      // settings.javaScriptEnabled = true
      // settings.domStorageEnabled = true
    }`;
      default:
        return `    // Create and configure ${viewType}
    return ${viewType}(context).apply {
      // TODO: Configure your ${viewType} properties here
      // Add any specific configuration for ${viewType}
    }`;
    }
  };

  const propImplementations = props
    .map((prop) => {
      const kotlinType = convertType(prop.typeText, "kotlin");
      const finalType = kotlinType.endsWith("?")
        ? kotlinType
        : kotlinType + (prop.isOptional ? "?" : "");
      
      // Generate view-specific property implementation examples
      const getPropertyExample = (propName: string, viewType: string): string => {
        // AppCompatEditText specific properties
        if (viewType === "AppCompatEditText") {
          switch (propName) {
            case "value":
              return `    // Update EditText value
    view.setText(${propName})`;
            case "placeholder":
              return `    // Update EditText placeholder
    view.hint = ${propName}`;
            case "maxLines":
              return `    // Update EditText max lines
    view.maxLines = ${propName} ?: Int.MAX_VALUE`;
            case "enabled":
              return `    // Update EditText enabled state
    view.isEnabled = ${propName} ?: true`;
            default:
              return `    // TODO: Update AppCompatEditText with ${propName}
    // Example: view.${propName} = ${propName}`;
          }
        }
        
        // Button specific properties
        if (viewType === "Button") {
          switch (propName) {
            case "title":
            case "text":
              return `    // Update Button text
    view.text = ${propName}`;
            case "enabled":
              return `    // Update Button enabled state
    view.isEnabled = ${propName} ?: true`;
            default:
              return `    // TODO: Update Button with ${propName}
    // Example: view.${propName} = ${propName}`;
          }
        }
        
        // TextView specific properties
        if (viewType === "TextView") {
          switch (propName) {
            case "text":
              return `    // Update TextView text
    view.text = ${propName}`;
            case "textSize":
              return `    // Update TextView text size
    ${propName}?.let { view.textSize = it }`;
            case "textColor":
              return `    // Update TextView text color
    ${propName}?.let { view.setTextColor(it) }`;
            default:
              return `    // TODO: Update TextView with ${propName}
    // Example: view.${propName} = ${propName}`;
          }
        }
        
        // ImageView specific properties
        if (viewType === "ImageView") {
          switch (propName) {
            case "src":
            case "source":
              return `    // Update ImageView source
    // ${propName}?.let { view.setImageResource(it) }`;
            case "scaleType":
              return `    // Update ImageView scale type
    // ${propName}?.let { view.scaleType = it }`;
            default:
              return `    // TODO: Update ImageView with ${propName}
    // Example: view.${propName} = ${propName}`;
          }
        }
        
        // EditText specific properties
        if (viewType === "EditText") {
          switch (propName) {
            case "value":
              return `    // Update EditText value
    view.setText(${propName})`;
            case "placeholder":
              return `    // Update EditText placeholder
    view.hint = ${propName}`;
            case "inputType":
              return `    // Update EditText input type
    ${propName}?.let { view.inputType = it }`;
            default:
              return `    // TODO: Update EditText with ${propName}
    // Example: view.${propName} = ${propName}`;
          }
        }
        
        // Generic property implementation for other view types
        return `    // TODO: Update your ${viewType} with ${propName}
    // Example: view.${propName} = ${propName}
    // Note: Implement property handling specific to ${viewType}`;
      };

      return `  override fun set${capitalize(prop.name)}(${
        prop.name
      }: ${finalType}) {
${getPropertyExample(prop.name, viewType)}
  }`;
    })
    .join("\n\n");

  const ktImplContent = `package ${packageName}

import android.content.Context
${viewTypeImport}
${additionalImports.join('\n')}
import com.lynx.tasm.behavior.LynxContext
import ${packageName}.generated.${specClassName}
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import com.tigermodule.autolink.LynxElement

/**
 * Implementation of ${elementName} element using ${viewType}
 * Extend the generated base class and implement your logic
 */
@LynxElement(name = "${elementName.toLowerCase()}")
class ${elementName}(context: LynxContext) : ${specClassName}(context) {

  override fun createView(context: Context): ${viewType} {
${getViewInstantiationExample(viewType)}
  }

${propImplementations || "  // No properties to implement"}
}`;

  fs.writeFileSync(implFile, ktImplContent);
  console.log(`  ✅ Generated Kotlin implementation template: ${elementName}.kt (using ${viewType})`);
  if (androidViewType) {
    console.log(`    📱 Custom Android view type: ${androidViewType.viewType}`);
  }
}

function generateJavaElementImplementation(
  implFile: string,
  elementName: string,
  properties: PropertyInfo[] | undefined,
  packageName: string,
  androidViewType?: import("./types.js").AndroidViewTypeConfig
): void {
  const specClassName = `${elementName}Spec`;
  const props = properties || [];

  // Determine view type and imports
  const viewType = androidViewType?.shortName || "View";
  const viewTypeImport = androidViewType 
    ? `import ${androidViewType.packageName}.${androidViewType.shortName};`
    : "import android.view.View;";
  
  // Generate additional imports that might be needed for specific view types
  const additionalImports = getAdditionalAndroidImports(androidViewType?.shortName || "View", "java");
  if (additionalImports.length > 0 && androidViewType) {
    console.log(`    📦 Adding ${additionalImports.length} additional Java implementation imports for ${androidViewType.shortName}`);
  }

  // Generate view-specific instantiation examples
  const getViewInstantiationExample = (viewType: string): string => {
    switch (viewType) {
      case "AppCompatEditText":
        return `    // Create and configure AppCompatEditText
    ${viewType} editText = new ${viewType}(context);
    // Configure your EditText properties
    // editText.setHint("Enter text here");
    // editText.setInputType(InputType.TYPE_CLASS_TEXT);
    // editText.setSingleLine(true);
    // editText.setFocusable(true);
    // editText.setFocusableInTouchMode(true);
    return editText;`;
      case "Button":
        return `    // Create and configure Button
    ${viewType} button = new ${viewType}(context);
    // Configure your Button properties
    // button.setText("Click me");
    // button.setOnClickListener(v -> { /* handle click */ });
    // button.setClickable(true);
    return button;`;
      case "RecyclerView":
        return `    // Create and configure RecyclerView
    ${viewType} recyclerView = new ${viewType}(context);
    // Configure your RecyclerView properties
    // recyclerView.setLayoutManager(new LinearLayoutManager(context));
    // recyclerView.setAdapter(/* your adapter */);
    // recyclerView.setHasFixedSize(true);
    return recyclerView;`;
      case "ImageView":
        return `    // Create and configure ImageView
    ${viewType} imageView = new ${viewType}(context);
    // Configure your ImageView properties
    // imageView.setScaleType(ImageView.ScaleType.CENTER_CROP);
    // imageView.setImageResource(R.drawable.placeholder);
    // imageView.setAdjustViewBounds(true);
    return imageView;`;
      case "TextView":
        return `    // Create and configure TextView
    ${viewType} textView = new ${viewType}(context);
    // Configure your TextView properties
    // textView.setText("Default text");
    // textView.setTextSize(16f);
    // textView.setGravity(Gravity.CENTER);
    return textView;`;
      case "EditText":
        return `    // Create and configure EditText
    ${viewType} editText = new ${viewType}(context);
    // Configure your EditText properties
    // editText.setHint("Enter text here");
    // editText.setInputType(InputType.TYPE_CLASS_TEXT);
    // editText.setSingleLine(true);
    return editText;`;
      case "LinearLayout":
        return `    // Create and configure LinearLayout
    ${viewType} linearLayout = new ${viewType}(context);
    // Configure your LinearLayout properties
    // linearLayout.setOrientation(LinearLayout.VERTICAL);
    // linearLayout.setGravity(Gravity.CENTER);
    return linearLayout;`;
      case "RelativeLayout":
        return `    // Create and configure RelativeLayout
    ${viewType} relativeLayout = new ${viewType}(context);
    // Configure your RelativeLayout properties
    // relativeLayout.setGravity(Gravity.CENTER);
    return relativeLayout;`;
      case "FrameLayout":
        return `    // Create and configure FrameLayout
    ${viewType} frameLayout = new ${viewType}(context);
    // Configure your FrameLayout properties
    // frameLayout.setForegroundGravity(Gravity.CENTER);
    return frameLayout;`;
      case "ScrollView":
        return `    // Create and configure ScrollView
    ${viewType} scrollView = new ${viewType}(context);
    // Configure your ScrollView properties
    // scrollView.setScrollbarFadingEnabled(true);
    // scrollView.setFillViewport(true);
    return scrollView;`;
      case "WebView":
        return `    // Create and configure WebView
    ${viewType} webView = new ${viewType}(context);
    // Configure your WebView properties
    // webView.getSettings().setJavaScriptEnabled(true);
    // webView.getSettings().setDomStorageEnabled(true);
    return webView;`;
      default:
        return `    // Create and configure ${viewType}
    ${viewType} view = new ${viewType}(context);
    // TODO: Configure your ${viewType} properties here
    // Add any specific configuration for ${viewType}
    return view;`;
    }
  };

  const propImplementations = props
    .map((prop) => {
      const javaType = convertType(prop.typeText, "java");
      
      // Generate view-specific property implementation examples
      const getPropertyExample = (propName: string, viewType: string): string => {
        // AppCompatEditText specific properties
        if (viewType === "AppCompatEditText") {
          switch (propName) {
            case "value":
              return `    // Update EditText value
    view.setText(${propName});`;
            case "placeholder":
              return `    // Update EditText placeholder
    view.setHint(${propName});`;
            case "maxLines":
              return `    // Update EditText max lines
    if (${propName} != null) view.setMaxLines(${propName});`;
            case "enabled":
              return `    // Update EditText enabled state
    view.setEnabled(${propName} != null ? ${propName} : true);`;
            default:
              return `    // TODO: Update AppCompatEditText with ${propName}
    // Example: view.set${capitalize(propName)}(${propName});`;
          }
        }
        
        // Button specific properties
        if (viewType === "Button") {
          switch (propName) {
            case "title":
            case "text":
              return `    // Update Button text
    view.setText(${propName});`;
            case "enabled":
              return `    // Update Button enabled state
    view.setEnabled(${propName} != null ? ${propName} : true);`;
            default:
              return `    // TODO: Update Button with ${propName}
    // Example: view.set${capitalize(propName)}(${propName});`;
          }
        }
        
        // TextView specific properties
        if (viewType === "TextView") {
          switch (propName) {
            case "text":
              return `    // Update TextView text
    view.setText(${propName});`;
            case "textSize":
              return `    // Update TextView text size
    if (${propName} != null) view.setTextSize(${propName});`;
            case "textColor":
              return `    // Update TextView text color
    if (${propName} != null) view.setTextColor(${propName});`;
            default:
              return `    // TODO: Update TextView with ${propName}
    // Example: view.set${capitalize(propName)}(${propName});`;
          }
        }
        
        // ImageView specific properties
        if (viewType === "ImageView") {
          switch (propName) {
            case "src":
            case "source":
              return `    // Update ImageView source
    // if (${propName} != null) view.setImageResource(${propName});`;
            case "scaleType":
              return `    // Update ImageView scale type
    // if (${propName} != null) view.setScaleType(${propName});`;
            default:
              return `    // TODO: Update ImageView with ${propName}
    // Example: view.set${capitalize(propName)}(${propName});`;
          }
        }
        
        // EditText specific properties
        if (viewType === "EditText") {
          switch (propName) {
            case "value":
              return `    // Update EditText value
    view.setText(${propName});`;
            case "placeholder":
              return `    // Update EditText placeholder
    view.setHint(${propName});`;
            case "inputType":
              return `    // Update EditText input type
    if (${propName} != null) view.setInputType(${propName});`;
            default:
              return `    // TODO: Update EditText with ${propName}
    // Example: view.set${capitalize(propName)}(${propName});`;
          }
        }
        
        // Generic property implementation for other view types
        return `    // TODO: Update your ${viewType} with ${propName}
    // Example: view.set${capitalize(propName)}(${propName});
    // Note: Implement property handling specific to ${viewType}`;
      };

      return `  @Override
  public void set${capitalize(prop.name)}(${javaType} ${prop.name}) {
${getPropertyExample(prop.name, viewType)}
  }`;
    })
    .join("\n\n");

  const javaImplContent = `package ${packageName};

import android.content.Context;
${viewTypeImport}
${additionalImports.join('\n')}
import com.lynx.tasm.behavior.LynxContext;
import ${packageName}.generated.${specClassName};
import com.lynx.react.bridge.Callback;
import com.lynx.react.bridge.ReadableMap;
import com.tigermodule.autolink.LynxElement;

/**
 * Implementation of ${elementName} element using ${viewType}
 * Extend the generated base class and implement your logic
 */
@LynxElement(name = "${elementName.toLowerCase()}")
public class ${elementName} extends ${specClassName} {
  
  public ${elementName}(LynxContext context) {
    super(context);
  }

  @Override
  protected ${viewType} createView(Context context) {
${getViewInstantiationExample(viewType)}
  }

${propImplementations || "  // No properties to implement"}
}`;

  fs.writeFileSync(implFile, javaImplContent);
  console.log(`  ✅ Generated Java implementation template: ${elementName}.java (using ${viewType})`);
  if (androidViewType) {
    console.log(`    📱 Custom Android view type: ${androidViewType.viewType}`);
  }
}

function generateIOSElement(
  elementName: string,
  properties: PropertyInfo[] | undefined,
  context: CodegenContext
): void {
  // Generate iOS Swift base class
  const swiftSpecDir = path.join("./ios/src/generated");
  fs.mkdirSync(swiftSpecDir, { recursive: true });
  const swiftSpecFile = path.join(swiftSpecDir, `${elementName}Spec.swift`);

  const props = properties || [];
  const propMethods = props
    .map((prop) => {
      const swiftType = convertType(prop.typeText, "swift");
      const finalType = swiftType.endsWith("?")
        ? swiftType
        : swiftType + (prop.isOptional ? "?" : "");
      return `    @objc open func set${capitalize(prop.name)}(_ ${
        prop.name
      }: ${finalType}) {
        fatalError("Must be implemented by subclass")
    }`;
    })
    .join("\n\n");

  const swiftSpecContent = `import Foundation
import UIKit

/**
 * Generated base class for ${elementName} element
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
@objcMembers
open class ${elementName}Spec: LynxUI<UIView> {

    // Abstract method to create the native view
    open override func createView() -> UIView {
        fatalError("Must be implemented by subclass")
    }

    // Property handlers
${propMethods || "    // No properties defined"}

    // Helper method for event emission
    protected func emitEvent(name: String, value: [String: Any]?) {
        let detail = LynxCustomEvent(sign: getSign(), name: name)
        if let value = value {
            for (key, v) in value {
                detail.addDetail(key, value: v)
            }
        }
        getLynxContext().getEventEmitter().sendCustomEvent(detail)
    }
}`;

  fs.writeFileSync(swiftSpecFile, swiftSpecContent);

  // Generate implementation template (only if it doesn't exist)
  const swiftImplFile = path.join("./ios/src", `${elementName}.swift`);

  if (!fs.existsSync(swiftImplFile)) {
    const propImplementations = props
      .map((prop) => {
        const swiftType = convertType(prop.typeText, "swift");
        const finalType = swiftType.endsWith("?")
          ? swiftType
          : swiftType + (prop.isOptional ? "?" : "");
        return `    override func set${capitalize(prop.name)}(_ ${
          prop.name
        }: ${finalType}) {
        // TODO: Update your view with ${prop.name}
        // Example: view.${prop.name} = ${prop.name}
    }`;
      })
      .join("\n\n");

    const swiftImplContent = `import Foundation
import UIKit

/**
 * Implementation of ${elementName} element
 * Extend the generated base class and implement your logic
 */
@objcMembers
public final class ${elementName}: ${elementName}Spec {

    override func createView() -> UIView {
        // TODO: Create and return your native view
        // Example: let button = UIButton(); /* setup */; return button
        return UIView()
    }

${propImplementations}
}`;
    fs.writeFileSync(swiftImplFile, swiftImplContent);
  }
}

function generateWebElement(
  elementName: string,
  properties: PropertyInfo[] | undefined,
  context: CodegenContext
): void {
  // Generate Web element base class
  const webSpecDir = path.join("./web/src/generated");
  fs.mkdirSync(webSpecDir, { recursive: true });
  const webSpecFile = path.join(webSpecDir, `${elementName}Spec.ts`);

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
      return `  abstract set${capitalize(prop.name)}(${prop.name}${
        prop.isOptional ? "?" : ""
      }: ${webType}): void;`;
    })
    .join("\n");

  const webSpecContent = `/**
 * Generated base class for ${elementName} element
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
export abstract class ${elementName}Spec extends HTMLElement {

  // Property handlers
${propMethods || "  // No properties defined"}

  // Helper method for event emission
  protected emitEvent(name: string, value?: Record<string, any>): void {
    const event = new CustomEvent(name, {
      detail: value,
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(event);
  }
}`;

  fs.writeFileSync(webSpecFile, webSpecContent);

  // Generate implementation template (only if it doesn't exist)
  const webImplFile = path.join("./web/src", `${elementName}.ts`);

  if (!fs.existsSync(webImplFile)) {
    const propImplementations = props
      .map((prop) => {
        const webType = convertToWebType(prop.typeText);
        return `  set${capitalize(prop.name)}(${prop.name}${
          prop.isOptional ? "?" : ""
        }: ${webType}): void {
    // TODO: Update your element with ${prop.name}
    // Example: this.setAttribute('${prop.name}', String(${prop.name}));
  }`;
      })
      .join("\n\n");

    const webImplContent = `import { ${elementName}Spec } from "./generated/${elementName}Spec.js";

/**
 * Web implementation of ${elementName} element
 * Extend the generated base class and implement your logic
 */
export class ${elementName} extends ${elementName}Spec {
  
  constructor() {
    super();
    // TODO: Initialize your custom element
    // Example: this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // TODO: Element added to DOM
  }

  disconnectedCallback() {
    // TODO: Element removed from DOM
  }

${propImplementations}
}

// Register the custom element
customElements.define('${elementName.toLowerCase()}', ${elementName});`;
    fs.writeFileSync(webImplFile, webImplContent);
  }
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

/**
 * Gets additional imports that might be needed for specific Android view types
 * @param viewType - The Android view type (short name)
 * @param language - The target language ("kotlin" or "java")
 * @returns Array of import statements
 */
function getAdditionalAndroidImports(viewType: string, language: "kotlin" | "java" = "kotlin"): string[] {
  const imports: string[] = [];
  const isJava = language === "java";
  const importSuffix = isJava ? ";" : "";

  switch (viewType) {
    case "AppCompatEditText":
    case "EditText":
      // Common imports for EditText types
      imports.push(`import android.text.InputType${importSuffix}`);
      if (isJava) {
        imports.push(`import android.view.Gravity${importSuffix}`);
      }
      break;
      
    case "Button":
    case "AppCompatButton":
    case "MaterialButton":
      // Common imports for Button types
      if (isJava) {
        imports.push(`import android.view.View${importSuffix}`);
      }
      break;
      
    case "RecyclerView":
      // RecyclerView specific imports
      imports.push(`import androidx.recyclerview.widget.LinearLayoutManager${importSuffix}`);
      imports.push(`import androidx.recyclerview.widget.RecyclerView${importSuffix}`);
      break;
      
    case "ImageView":
    case "AppCompatImageView":
      // ImageView specific imports
      imports.push(`import android.widget.ImageView${importSuffix}`);
      if (isJava) {
        imports.push(`import android.graphics.drawable.Drawable${importSuffix}`);
      }
      break;
      
    case "LinearLayout":
      // LinearLayout specific imports
      imports.push(`import android.widget.LinearLayout${importSuffix}`);
      imports.push(`import android.view.Gravity${importSuffix}`);
      break;
      
    case "RelativeLayout":
      // RelativeLayout specific imports
      imports.push(`import android.widget.RelativeLayout${importSuffix}`);
      imports.push(`import android.view.Gravity${importSuffix}`);
      break;
      
    case "FrameLayout":
      // FrameLayout specific imports
      imports.push(`import android.widget.FrameLayout${importSuffix}`);
      imports.push(`import android.view.Gravity${importSuffix}`);
      break;
      
    case "ScrollView":
    case "HorizontalScrollView":
      // ScrollView specific imports
      if (isJava) {
        imports.push(`import android.view.ViewGroup${importSuffix}`);
      }
      break;
      
    case "NestedScrollView":
      // NestedScrollView specific imports
      imports.push(`import androidx.core.widget.NestedScrollView${importSuffix}`);
      break;
      
    case "WebView":
      // WebView specific imports
      imports.push(`import android.webkit.WebSettings${importSuffix}`);
      imports.push(`import android.webkit.WebViewClient${importSuffix}`);
      break;
      
    case "TextView":
    case "AppCompatTextView":
      // TextView specific imports
      imports.push(`import android.view.Gravity${importSuffix}`);
      if (isJava) {
        imports.push(`import android.graphics.Color${importSuffix}`);
      }
      break;
      
    case "ConstraintLayout":
      // ConstraintLayout specific imports
      imports.push(`import androidx.constraintlayout.widget.ConstraintLayout${importSuffix}`);
      imports.push(`import androidx.constraintlayout.widget.ConstraintSet${importSuffix}`);
      break;
      
    case "CardView":
    case "MaterialCardView":
      // CardView specific imports
      if (viewType === "CardView") {
        imports.push(`import androidx.cardview.widget.CardView${importSuffix}`);
      }
      break;
      
    case "FloatingActionButton":
      // FAB specific imports
      imports.push(`import com.google.android.material.floatingactionbutton.FloatingActionButton${importSuffix}`);
      break;
      
    case "TextInputLayout":
    case "TextInputEditText":
      // Material TextInput specific imports
      imports.push(`import com.google.android.material.textfield.TextInputLayout${importSuffix}`);
      imports.push(`import com.google.android.material.textfield.TextInputEditText${importSuffix}`);
      break;
      
    case "Toolbar":
      // Toolbar specific imports
      imports.push(`import androidx.appcompat.widget.Toolbar${importSuffix}`);
      break;
      
    case "AppBarLayout":
      // AppBarLayout specific imports
      imports.push(`import com.google.android.material.appbar.AppBarLayout${importSuffix}`);
      break;
      
    case "CheckBox":
    case "AppCompatCheckBox":
    case "RadioButton":
    case "AppCompatRadioButton":
    case "Switch":
    case "SwitchCompat":
      // Input control specific imports
      imports.push(`import android.widget.CompoundButton${importSuffix}`);
      break;
      
    default:
      // No additional imports needed for basic View or unknown types
      break;
  }

  return imports.filter(imp => imp.trim().length > 0);
}

/**
 * Validates that all required imports are present for a given view type
 * @param viewType - The Android view type
 * @param existingImports - Array of existing import statements
 * @param language - The target language
 * @returns Object with validation result and missing imports
 */
function validateAndroidViewTypeImports(
  viewType: string, 
  existingImports: string[], 
  language: "kotlin" | "java" = "kotlin"
): { isValid: boolean; missingImports: string[]; suggestions: string[] } {
  const requiredImports = getAdditionalAndroidImports(viewType, language);
  const existingImportSet = new Set(existingImports.map(imp => imp.trim()));
  
  const missingImports = requiredImports.filter(imp => !existingImportSet.has(imp.trim()));
  
  const suggestions: string[] = [];
  if (missingImports.length > 0) {
    suggestions.push(`Consider adding these imports for ${viewType}:`);
    suggestions.push(...missingImports);
  }
  
  return {
    isValid: missingImports.length === 0,
    missingImports,
    suggestions
  };
}
