import { LynxjsLinkingModule } from "./module";

export async function openURL(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      LynxjsLinkingModule.openURL(url, (err?: string) => {
        if (err) reject(new Error(err));
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function openSettings(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      LynxjsLinkingModule.openSettings((err?: string) => {
        if (err) reject(new Error(err));
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}


export async function share(
  content: string,
  options?: { mimeType?: string; dialogTitle?: string },
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      LynxjsLinkingModule.share(content, options, (err?: string) => {
        if (err) reject(new Error(err));
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

export default {
  openURL,
  openSettings,
  share,
};
