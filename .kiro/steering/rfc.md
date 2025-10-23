# [RFC] Automatic Integration Solution for Lynx Native Extensions

**Discussion Number**: #2653
**URL**: https://github.com/lynx-family/lynx/discussions/2653
**Created by**: jianliang00

## Description

# Introduction

This RFC mainly discusses the introduction of the Autolink mechanism for Lynx. By packaging native code into an npm package according to specific specifications for distribution and leveraging the capabilities provided by the compilation framework plugin, it enables the rapid integration of Lynx components containing native code without modifying the compilation configuration on the native side of the application. This reduces the development and usage costs of Lynx native extension capabilities.

# Glossary

| Name           | Description                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Autolink       | A technology that automatically integrates Native code into cross - platform applications. This name originally comes from React Native |
| Element        | UI objects implemented with native code in Lynx, mainly referring to user-defined UI objects in this RFC.                               |
| Native Module  | A module that provides interfaces for frontend code to call Native capabilities.                                                        |
| Service        | A module that provides implementations for some extended capabilities in Lynx.                                                          |
| Lynx Extension | A general term for various extension modules of Lynx, including Element, Native Module, Service, etc.                                   |
| Package        | In this article, it specifically refers to npm packages.                                                                                |

# Motivation

Lynx provides multiple mechanisms for calling Native-side capabilities through frontend code. However, when integrating these codes, it is necessary to modify the compilation configurations (such as build.gradle.kts, Podfile) and Native code of each platform separately.
To simplify the above process as much as possible, we plan to introduce the Autolink mechanism to Lynx.

# Prior Arts

- React Native Autolinking: https://github.com/react-native-community/cli/blob/main/docs/autolinking.md
- Current Nanual Integration Solution of Lynx: https://lynxjs.org/guide/custom-native-component.html

# User Guide

## Integrate an Extension

For applications that have already integrated the Autolink framework, it is expected that the integration of native extensions can be quickly achieved in the following ways:

```bash
# Suppose there is a button element implemented in native code.
npm install @lynxjs/button
```

## Develop Workflow

The following is the basic process of developing and using extensions after having the Autolink framework.
<img width="970" height="1402" alt="image" src="https://github.com/user-attachments/assets/49101f7a-0143-489d-9e81-bc4bc68ce7a8" />

## Extension Package

### Project Layout

Here's the layout of a common extension project which contains the source code of both Lynx and native platforms:

```bash
@lynx-js/button
├── README.md
├── lynx.ext.json  # extension configuration file, which contains necessary configurations used by Autolink framework
├── android  # source code for Android platform
│   ├── build.gradle.kts
│   ├── consumer-rules.pro
│   ├── proguard-rules.pro
│   └── src
│        └── main
│            ├── AndroidManifest.xml
│            └── kotlin
│                └── com
│                    └── example
│                        └── lepo1
│                            ├── LocalStorageModule.kt  # module implementation
│                            ├── Button.kt  # element implementation
│                            └── CustomImageService.kt  # service implementation
├── ios  # source code for iOS platform
│   ├── build.podspec
│   └── src
│        ├── LocalStorageModule.swift  # module implementation
│        ├── Button.swift  # element implementation
│        └── CustomImageService.swift  # service implementation
├── web  # source code for web platform
│   └── src
│        ├── LocalStorageModule.ts  # module实现
│        └── Button.ts  # service实现
├── eslint.config.js
├── example  # demo project. Components can be integrated into this project for testing.
│   ├── android  # source code for Android application
│   ├── ios
│   ├── web
│   ├── lynx.config.ts
│   ├── package.json
│   ├── src
│   └── tsconfig.json
├── src  # source code of the Lynx application
│   ├── Button.css
│   ├── Button.tsx
│   └── index.tsx
└── tsconfig.json

```

### Configuration File

The extension package needs to add a "platforms" field to the specified configuration file (lynx.ext.json) to declare which platforms the current package supports and provide information for the packaging tool and compilation framework plugins. The basic format of the configuration file is as follows

> The "platforms" field is used to mark which platforms this package supports and add some required special configurations for each platform.

```json
{
  "platforms": {
    "android": {
      "packageName": "com.lynx.example"
    },
    "ios": {},
    "web": {}
  }
}
```

## Extension Development

### Define the APIs on the JS side

#### Native Module

Add type and interface definitions to a `.d.ts` file

```js
// types/index.d.ts
/** @lynxmodule */
export declare class NativeLocalStorageModule {
      setStorageItem(key: string, value: string): void;
      getStorageItem(key: string): string | null;
      clearStorage(): void;
}
```

#### Element

There is no need to generate interface code for the element, so there is no need to define interfaces on the JS side. However, developers can still encapsulate components themselves if necessary

```js
import './Button.css';

interface ButtonProps {
  ...
}

export const Button = ({
  backgroundColor,
  label,
  primary = false,
  size = 'medium',
  ...props
}: ButtonProps) => {
  const mode = primary ? 'demo-button--primary' : 'demo-button--secondary';
  return (
      <button
          bindclickevent={props.onClick}
          className={['demo-button', `demo-button--${size}`, mode].join(' ')}
          style={{ backgroundColor }}
          text={label}
      />
  );
};
```

### Code Generation

Developers can use the command-line tool to generate the following code in the project

```bash
├── android
│   └── src
│        └── main
│             └── kotlin
│                  └── com
│                       └── example
│                            └── nativelocalstorage
│                                 └── generated
│                                      └── NativeLocalStorageModuleSpec.java  # native module
├── ios
│   └── src
│        └── generated
│             ├── NativeLocalStorageModuleSpec.h  # native module header file
│             └── NativeLocalStorageModuleSpec.m  # native module source file
├── web
│   └── src
│        └── generated
│             └── NativeLocalStorageModuleSpec.ts  # native module
└── generated
     ├── Button.tsx
     └── NativeLocalStorageModule.ts
```

### Export JS Interface

To avoid exposing the generated path to extension users, the Native module needs to export the generated module

```js
// src/index.ts
export { NativeLocalStorageModule } from "../generated/NativeLocalStorageModule.js";
```

### Implement Native Code

#### Android

Add the following annotations to the defined Native Module class in the source code for Android platform

```kotlin
import com.example.nativelocalstorage.generated.NativeLocalStorageModuleSpec

@LynxNativeModule(name = "NativeLocalStorage")
class NativeLocalStorageModule(context: Context) : NativeLocalStorageModuleSpec(context) {

    override fun setStorageItem(key: String, value: String) {
        val sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        editor.putString(key, value)
        editor.apply()
    }
    ...
}
```

#### iOS

Use a macro to annotate the native module

```objective-c
// NativeLocalStorageModule.h

#import <Foundation/Foundation.h>
#import <generated/NativeLocalStorageModuleSpec.h>

NS_ASSUME_NONNULL_BEGIN

LynxNativeModule("NativeLocalStorageModule")
@interface NativeLocalStorageModule : NativeLocalStorageModuleSpec

@end

NS_ASSUME_NONNULL_END
```

```objective-c
#import "NativeLocalStorageModule.h"

@interface NativeLocalStorageModule()
@property (strong, nonatomic) NSUserDefaults *localStorage;
@end

@implementation NativeLocalStorageModule

...


- (void)setStorageItem:(NSString *)key value:(NSString *)value {
    [self.localStorage setObject:value forKey:key];
}

...

@end
```

#### web

For web, we use a JS doc style comment to mark a native module

```js
import {NativeLocalStorageModuleSpec} from "./generated/NativeLocalStorageModuleSpec.js";

/** @lynxnativemodule name:NativeLocalStorage */
class NativeLocalStorageModule extends NativeLocalStorageModuleSpec {

    ...

    setStorageItem(key: string, value: string): void {
        ...
    }

    ...

}
```

### Element

#### Android

The components defined in Android source code need to add the following annotation. When other projects use the components, relevant code will be generated from annotations, and the components will be automatically registered in the application

```kotlin
@LynxElement(name = "button")
class Button(context: LynxContext) : LynxUI<Button>(context) {

  override fun createView(context: Context): Button {
    return Button(context).apply {
      gravity = Gravity.CENTER
      background = null
      setPadding(0, 0, 0, 0)
      ...
}
```

#### iOS

```objective-c
// Button.h
#import <Lynx/LynxUI.h>

NS_ASSUME_NONNULL_BEGIN

@interface Button : LynxUI <UILabel*>

@end

NS_ASSUME_NONNULL_END
```

```objective-c

// Button.m
#import "Button.h"
#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxPropsProcessor.h>

@implementation Button

LYNX_LAZY_REGISTER_UI("button")

LYNX_PROP_SETTER("text", setValue, NSString *) {
    self.view.text = value;
}

- (UILabel *)createView {
    UILabel *view = [[UILabel alloc] init];
    view.textAlignment = NSTextAlignmentCenter;
    view.font = [UIFont systemFontOfSize:18];

    UITapGestureRecognizer *tapGesture = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleViewTap:)];
    [view addGestureRecognizer:tapGesture];
    view.userInteractionEnabled = YES;
    return view;
}

...

@end
```

#### web

```typescript
// button.ts

/** @lynxelement name:my-button */
class Button extends HTMLElement {
  constructor() {
    super();
    // create shadow root
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        button { color: white; background: #007bff; border: none; padding: 8px 16px; }
      </style>
      <button>MyButton</button>
    `;
  }
}
```

### Service

#### Android

```kotlin
@LynxService
object YourLogService : ILynxLogService {
  private var logOutputChannel: LogOutputChannelType = LogOutputChannelType.Platform

  override fun logByPlatform(
    level: Int,
    tag: String,
    msg: String,
  ) {
    // implementation
  }

  override fun isLogOutputByPlatform(): Boolean = logOutputChannel == LogOutputChannelType.Platform

  override fun getDefaultWriteFunction(): Long = 0

  override fun switchLogToSystem(enableSystemLog: Boolean) {}

  override fun getLogToSystemStatus(): Boolean = false
}
```

#### iOS

```objective-c
// YourLogService.h
#import <Lynx/Lynx Service.h>
#import <Lynx/LynxServiceLogProtocol.h>

// implement LynxServiceLogProtocol
@interface YourLogService : NSObject <LynxServiceLogProtocol>
@end
```

```objective-c
// YourLogService.m
#import "YourLogService.h"

// Auto registering with LynxServiceRegister
@LynxServiceRegister(LynxLogService);

@implementation LynxLogService

+ (NSUInteger)serviceType {
  return kLynxServiceLog;
}

+ (instancetype)sharedInstance {
  static dispatch_once_t onceToken;
  static YourLogService *logService;
  dispatch_once(&onceToken, ^{
    logService = [[YourLogService alloc] init];
  });
  return logService;
}

- (void *)getWriteFunction {
  return (void *)lynx::base::logging::logWrite;
}

@end
```

#### web

## Command Line

### Project Creation

If developers want to create a lynx extension project, they need to use the `create-lynx-extension` command.
The extension package created by the CLI consists of multiple template projects, including:

- One extension front-end code project
- One or more extension native source code files
- One example project for testing

`create-lynx-extension` will first prompt the user to select the type of extension to support, and then complete the project generation according user's input:

```bash
npm create lynx-extension

Please select the extension types included in this package:
◯ Native Module
◯ Element
◯ Service
  - Use space to select, enter to confirm

```

### Code Generation

In addition to generating projects, a command-line tool will also be provided for code generation.
Here's the usage of the tool:

```bash
npx @lynx-js/codegen

# or directly use the npm commands configured in the project.
#
# // package.json
#
# {
#   "name": "extension-example",
#   "version": "0.0.10",
#   "type": "module",
#   "scripts": {
#     "codegen": "lynx-codegen",
#   },
#
#   ...
#
#   "devDependencies": {
#     "@lynx-js/codegen": "^0.0.1",
#
#     ...
#   },
#
#   "engines": {
#     "node": ">=18"
#   }
# }
#
npm install
npm run codegen
```

## Integrate the Autolink Framework to Existing Application

To integrate the extension into your project, you just need to install it like any other npm package (npm install xxx). However, before you do this, make sure your application has already integrated the AutoLink framework. The integration steps are as follows:

### Android

- Add Gradle plugins to settings.gradle.kts and build.gradle.kts in the project root directory respectively.

```kotlin
// settings.gradle.kts
plugins {
    id("org.lynxsdk.extension-settings") version "0.0.1"
}
```

```kotlin
// build.gradle.kts
plugins {
    id("org.lynxsdk.extension-build") version "0.0.1"
}
```

- Compile the project
- Register extensions into the LynxViewBuilder class using the automatically generated ExtensionRegistry class.

```kotlin
package com.example.myapp

import android.app.Activity
import android.os.Bundle
import com.example.myqpp.provider.DemoTemplateProvider
import com.example.myapp.provider.GenericResourceFetcher
import com.lynx.tasm.LynxBooleanOption
import com.lynx.tasm.LynxView
import com.lynx.tasm.LynxViewBuilder
import com.example.myapp.generated.extensions.ExtensionRegistry

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ExtensionRegistry.setupGlobal(this)
        val lynxView: LynxView = buildLynxView()
        setContentView(lynxView)

        val uri = "main.lynx.bundle";
        lynxView.renderTemplateUrl(uri, "")
    }

    private fun buildLynxView(): LynxView {
        var viewBuilder: LynxViewBuilder = LynxViewBuilder()
        viewBuilder.setEnableGenericResourceFetcher(LynxBooleanOption.TRUE)
        viewBuilder.setTemplateProvider(DemoTemplateProvider(this))
        viewBuilder.setGenericResourceFetcher(GenericResourceFetcher())
        return viewBuilder.build(this)
    }
}
```

### iOS

- Install Cocoapods Plugin
  Install using the gem command.

```bash
gem install cocoapods-lynx-extension
```

or add it to the Gemfile (only when running pod install with Bundler)

```ruby
source 'https://rubygems.org'

# You may use http://rbenv.org/ or https://rvm.io/ to install and use this version
ruby ">= 2.6.10"

# Exclude problematic versions of cocoapods and activesupport that causes build failures.
gem 'cocoapods', '>= 1.13', '!= 1.15.0', '!= 1.15.1'
gem 'cocoapods-lynx-extension', '>= 0.0.1'

```

- Register the extension to `LynxViewBuilder` using `ExtensionRegistry`

```swift
// LepoDemo-Bridging-Header.h
#import <Lynx/LynxConfig.h>
#import <Lynx/LynxEnv.h>
#import <Lynx/LynxTemplateProvider.h>
#import <Lynx/LynxView.h>
#import <Lynx/LynxGenericResourceFetcher.h>
#import <Lynx/LynxBooleanOption.h>

#import "generated/ExtensionRegistry.h"
```

```swift
// AppDelegate.swift
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        LynxEnv.sharedInstance()
        LynxEnv.sharedInstance()
        let globalConfig = LynxConfig(provider: Lepo3LynxProvider())
        ExtensionRegistry().setup(globalConfig)
        LynxEnv.sharedInstance().prepareConfig(globalConfig)
        LynxEnv.sharedInstance().lynxDebugEnabled = true
        // Enable Lynx DevTool
        LynxEnv.sharedInstance().devtoolEnabled = true
        // Enable Lynx LogBox
        LynxEnv.sharedInstance().logBoxEnabled = true
        return true
    }

    ...


}
```

#### web

```typescript
import { pluginWebPlatform } from "@lepojs/autolink";
import { defineConfig } from "@rsbuild/core";

export default defineConfig({
  plugins: [
    pluginWebPlatform({
      autoLink: true,
    }),
  ],
});
```
