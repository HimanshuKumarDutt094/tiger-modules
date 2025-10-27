import { LynxJsLinkingModuleSpec } from "./generated/LynxJsLinkingModuleSpec.js";

/** @lynxnativemodule name:LynxJsLinkingModule */
export class LynxJsLinkingModule extends LynxJsLinkingModuleSpec {
  openURL(url: string, callback: (err?: string) => void): void {
    try {
      if (!url || url.trim() === "") {
        callback("URL cannot be empty");
        return;
      }

      const trimmedUrl = url.trim();

      // Parse the URL to determine the scheme
      let finalUrl: string;

      try {
        const parsedUrl = new URL(trimmedUrl);
        const scheme = parsedUrl.protocol.toLowerCase();

        switch (scheme) {
          case "tel:":
            // For tel: links, open directly (browser will handle appropriately)
            finalUrl = trimmedUrl;
            break;
          case "mailto:":
            // For mailto: links, open directly (browser will handle appropriately)
            finalUrl = trimmedUrl;
            break;
          case "sms:":
          case "smsto:":
            // SMS links - browser will handle appropriately
            finalUrl = trimmedUrl;
            break;
          case "http:":
          case "https:":
            // Standard web links
            finalUrl = trimmedUrl;
            break;
          default:
            // Custom schemes or other protocols
            finalUrl = trimmedUrl;
            break;
        }
      } catch (urlError) {
        // If URL parsing fails, assume it's a relative URL or needs http://
        if (!trimmedUrl.includes("://")) {
          finalUrl = `https://${trimmedUrl}`;
        } else {
          finalUrl = trimmedUrl;
        }
      }

      // Open URL in new tab/window
      window.open(finalUrl, "_blank", "noopener,noreferrer");
      callback(); // Success
    } catch (error) {
      callback(
        `Failed to open URL: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  openSettings(callback: (err?: string) => void): void {
    try {
      // On web, we can't directly open system settings
      // Best we can do is provide information or redirect to browser settings
      const userAgent = navigator.userAgent.toLowerCase();

      if (userAgent.includes("chrome")) {
        // Try to open Chrome settings
        window.open("chrome://settings/", "_blank");
      } else if (userAgent.includes("firefox")) {
        // Try to open Firefox preferences
        window.open("about:preferences", "_blank");
      } else if (userAgent.includes("safari")) {
        // Safari doesn't allow direct settings access
        alert("Please open Safari preferences manually (Safari > Preferences)");
      } else {
        // Generic fallback
        alert("Please open your browser settings manually");
      }

      callback(); // Success
    } catch (error) {
      callback(
        `Failed to open settings: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  share(
    content: string,
    options?: { mimeType?: string; dialogTitle?: string },
    callback?: (err?: string) => void
  ): void {
    try {
      // Check if Web Share API is available
      if (navigator.share) {
        const shareData: ShareData = {
          text: content,
        };

        if (options?.dialogTitle) {
          shareData.title = options.dialogTitle;
        }

        navigator
          .share(shareData)
          .then(() => callback?.())
          .catch((error) => callback?.(`Share failed: ${error.message}`));
      } else {
        // Fallback: Copy to clipboard and show notification
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(content)
            .then(() => {
              alert(`Content copied to clipboard: ${content}`);
              callback?.();
            })
            .catch((error) => {
              callback?.(`Failed to copy to clipboard: ${error.message}`);
            });
        } else {
          // No modern clipboard support available
          callback?.("Share not supported in this browser");
        }
      }
    } catch (error) {
      callback?.(
        `Share failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
