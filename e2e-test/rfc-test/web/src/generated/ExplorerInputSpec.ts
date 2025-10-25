/**
 * Generated base class for ExplorerInput element
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
export abstract class ExplorerInputSpec extends HTMLElement {

  // Property handlers
  abstract setBindinput(bindinput?: (e: Event) => void): void;
  abstract setClassName(className?: string): void;
  abstract setId(id?: string): void;
  abstract setStyle(style?: string | CSSStyleDeclaration): void;
  abstract setValue(value?: string | undefined): void;
  abstract setMaxlines(maxlines?: number): void;
  abstract setPlaceholder(placeholder?: string): void;

  // Helper method for event emission
  protected emitEvent(name: string, value?: Record<string, any>): void {
    const event = new CustomEvent(name, {
      detail: value,
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(event);
  }
}