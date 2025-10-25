import { ExplorerInputSpec } from "./generated/ExplorerInputSpec.js";

/**
 * Web implementation of ExplorerInput element
 * Extend the generated base class and implement your logic
 */
export class ExplorerInput extends ExplorerInputSpec {
  
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

  setBindinput(bindinput?: (e: Event) => void): void {
    // TODO: Update your element with bindinput
    // Example: this.setAttribute('bindinput', String(bindinput));
  }

  setClassName(className?: string): void {
    // TODO: Update your element with className
    // Example: this.setAttribute('className', String(className));
  }

  setId(id?: string): void {
    // TODO: Update your element with id
    // Example: this.setAttribute('id', String(id));
  }

  setStyle(style?: string | CSSStyleDeclaration): void {
    // TODO: Update your element with style
    // Example: this.setAttribute('style', String(style));
  }

  setValue(value?: string | undefined): void {
    // TODO: Update your element with value
    // Example: this.setAttribute('value', String(value));
  }

  setMaxlines(maxlines?: number): void {
    // TODO: Update your element with maxlines
    // Example: this.setAttribute('maxlines', String(maxlines));
  }

  setPlaceholder(placeholder?: string): void {
    // TODO: Update your element with placeholder
    // Example: this.setAttribute('placeholder', String(placeholder));
  }
}

// Register the custom element
customElements.define('explorerinput', ExplorerInput);