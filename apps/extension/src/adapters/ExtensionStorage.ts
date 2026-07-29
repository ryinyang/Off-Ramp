import { IStorageProvider } from "@off-ramp/core";

export class ExtensionStorage implements IStorageProvider {
  public async save(key: string, value: string): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [key]: value });
    } else if (typeof browser !== "undefined" && browser.storage && browser.storage.local) {
      await browser.storage.local.set({ [key]: value });
    }
  }

  public async load(key: string): Promise<string | null> {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(key);
      return (result[key] as string) || null;
    } else if (typeof browser !== "undefined" && browser.storage && browser.storage.local) {
      const result = await browser.storage.local.get(key);
      return (result[key] as string) || null;
    }
    return null;
  }
}
