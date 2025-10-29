import type * as Lynx from "@lynx-js/types";

/** @lynxelement name:explorer-input */
export class ExplorerInput extends HTMLElement {
  private input: HTMLInputElement;

  constructor() {
    super();

    // Create the input element
    this.input = document.createElement("input");
    this.input.type = "text";

    // Apply default styling to match Android implementation
    this.input.style.cssText = `
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      padding: 0;
      margin: 0;
      width: 100%;
      height: 100%;
    `;

    // Add event listeners
    this.input.addEventListener("input", () => {
      this.emitEvent("input", { value: this.input.value });
    });

    this.input.addEventListener("blur", () => {
      this.emitEvent("blur", null);
    });

    this.appendChild(this.input);
  }

  connectedCallback() {
    // Element added to DOM - nothing special needed
  }

  disconnectedCallback() {
    // Element removed from DOM - cleanup if needed
  }

  static get observedAttributes() {
    return ["value", "placeholder", "text-color"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case "value":
        this.input.value = newValue || "";
        break;
      case "placeholder":
        this.input.placeholder = newValue || "";
        break;
      case "text-color":
        this.input.style.color = newValue || "";
        break;
    }
  }

  // Focus method to match Android implementation
  focus() {
    this.input.focus();
  }

  setBindinput(bindinput?: (e: Lynx.BaseEvent<"input", { value: string }>) => void): void {
    if (bindinput) {
      this.input.addEventListener("input", () => {
        const lynxEvent: Lynx.BaseEvent<"input", { value: string }> = {
          type: "input",
          target: { uid: this.id || "" } as any,
          currentTarget: { uid: this.id || "" } as any,
          timestamp: Date.now(),
          detail: { value: this.input.value }
        };
        bindinput(lynxEvent);
      });
    }
  }

  setClassName(className?: string): void {
    if (className) {
      this.className = className;
    }
  }

  setId(id?: string): void {
    if (id) {
      this.id = id;
    }
  }

  setStyle(style?: string | Lynx.CSSProperties): void {
    if (typeof style === "string") {
      this.style.cssText += style;
    } else if (style) {
      Object.assign(this.style, style);
    }
  }

  setValue(value?: string): void {
    if (value !== undefined && value !== this.input.value) {
      this.input.value = value;
    }
  }

  setMaxlines(_maxlines?: number): void {
    // For single-line input, this doesn't apply, but we could store it
    // if we wanted to switch to textarea for multi-line support
  }

  setPlaceholder(placeholder?: string): void {
    if (placeholder !== undefined) {
      this.input.placeholder = placeholder;
    }
  }

  setTextColor(textColor?: string): void {
    if (textColor) {
      this.input.style.color = textColor;
      // Also set placeholder color with opacity like Android implementation
      const colorValue = textColor.startsWith("#")
        ? textColor.substring(1)
        : textColor;
      this.input.style.setProperty("--placeholder-color", `#40${colorValue}`);
      this.input.style.setProperty("color", textColor);
    }
  }

  // Helper method for event emission
  protected emitEvent(name: string, value?: Record<string, any> | null): void {
    const event = new CustomEvent(name, {
      detail: value,
      bubbles: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
  }
}

// Note: No customElements.define() needed!
// The @lynxelement annotation tells the Rsbuild plugin to auto-register
// this element during compilation via the autolink system.
