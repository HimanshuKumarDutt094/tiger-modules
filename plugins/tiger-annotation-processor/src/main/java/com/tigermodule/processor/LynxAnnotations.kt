package com.tigermodule.processor

/**
 * Tiger Autolink Discovery Annotations
 * These annotations are used to mark native modules, elements, and services
 * for automatic discovery and registration by the Autolink framework.
 * 
 * Note: These are NOT the same as Lynx SDK annotations like @LynxMethod, @LynxProp, etc.
 * Those come from the Lynx SDK itself (com.lynx.jsbridge.*, com.lynx.tasm.behavior.*)
 */

/**
 * Marks a class as a Lynx Native Module for autolink discovery.
 * The annotated class should extend the generated *Spec base class.
 * 
 * @param name The name of the native module as it will be exposed to JavaScript
 * 
 * @example
 * ```kotlin
 * @LynxNativeModule(name = "LocalStorage")
 * class LocalStorageModule(context: Context) : LocalStorageModuleSpec(context) {
 *     override fun setItem(key: String, value: String) {
 *         // Implementation
 *     }
 * }
 * ```
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.SOURCE)
annotation class LynxNativeModule(val name: String)

/**
 * Marks a class as a Lynx UI Element for autolink discovery.
 * The annotated class should extend LynxUI and the generated *Spec base class.
 * 
 * @param name The tag name of the element as it will be used in Lynx templates
 * 
 * @example
 * ```kotlin
 * @LynxElement(name = "custom-button")
 * class CustomButton(context: LynxContext) : CustomButtonSpec(context) {
 *     // Implementation
 * }
 * ```
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.SOURCE)
annotation class LynxElement(val name: String)

/**
 * Marks a class as a Lynx Service for autolink discovery.
 * The annotated class should implement the service interface.
 * 
 * @example
 * ```kotlin
 * @LynxService
 * class LogServiceImpl : ILogService {
 *     override fun log(message: String) {
 *         // Implementation
 *     }
 * }
 * ```
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.SOURCE)
annotation class LynxService
