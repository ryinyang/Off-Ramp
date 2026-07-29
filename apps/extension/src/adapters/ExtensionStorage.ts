import { IStorageProvider } from "@off-ramp/core";

export class ExtensionStorage implements IStorageProvider {
  public async save(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof browser !== "undefined" && browser.storage && browser.storage.local) {
          browser.storage.local.set({ [key]: value }).then(() => resolve(), reject);
        } else if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
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
        if (typeof browser !== "undefined" && browser.storage && browser.storage.local) {
          browser.storage.local.get(key).then((res) => {
            if (res && typeof res === "object" && key in res) {
              resolve((res[key] as string) || null);
            } else {
              resolve(null);
            }
          }, reject);
        } else if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
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
