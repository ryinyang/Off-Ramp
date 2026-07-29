import { IStorageProvider } from "@off-ramp/core";
import { BrowserApi } from "../utils/BrowserApi";

export class ExtensionStorage implements IStorageProvider {
  public async save(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const storage = BrowserApi.getStorage();
        if (typeof browser !== "undefined" && storage && storage.local) {
          storage.local.set({ [key]: value }).then(() => resolve(), reject);
        } else if (typeof chrome !== "undefined" && storage && storage.local) {
          chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  public async load(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        const storage = BrowserApi.getStorage();
        if (typeof browser !== "undefined" && storage && storage.local) {
          storage.local.get(key).then((res) => {
            if (res && typeof res === "object" && key in res) {
              resolve((res[key] as string) || null);
            } else {
              resolve(null);
            }
          }, reject);
        } else if (typeof chrome !== "undefined" && storage && storage.local) {
          chrome.storage.local.get(key, (res) => {
            if (chrome.runtime && chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            if (res && typeof res === "object" && key in res) {
              resolve((res[key] as string) || null);
            } else {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}
