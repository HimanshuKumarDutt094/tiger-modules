import { NativeLocalStorageModule } from "./module";

// Export the native module interface for native platforms
export { NativeLocalStorageModule };

// Helper functions for easier usage
export async function setStorageItem(
  key: string,
  value: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      NativeLocalStorageModule.setStorageItem(key, value);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

export async function getStorageItem(key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    try {
      NativeLocalStorageModule.getStorageItem(key, (value: string | null) => {
        resolve(value);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function clearStorage(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      NativeLocalStorageModule.clearStorage();
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

export default {
  setStorageItem,
  getStorageItem,
  clearStorage,
};
