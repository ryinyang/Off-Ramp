import { IPlatformMonitor } from "@off-ramp/core";

export class WebTabMonitor implements IPlatformMonitor {
  public async getCurrentActivity(): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const processTabs = (tabs: any[]) => {
          if (!tabs || tabs.length === 0 || !tabs[0] || !tabs[0].url) {
            resolve(null);
            return;
          }
          try {
            const parsedUrl = new URL(tabs[0].url);
            if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
              const hostname = parsedUrl.hostname.replace(/^www\./, "");
              resolve(hostname);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        };

        if (typeof browser !== "undefined" && browser.tabs && browser.tabs.query) {
          browser.tabs.query({ active: true, lastFocusedWindow: true }).then((tabs) => {
            if (tabs && tabs.length > 0) {
              processTabs(tabs);
            } else {
              browser.tabs.query({ active: true }).then(processTabs, () => resolve(null));
            }
          }, () => resolve(null));
        } else if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
          chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0) {
              processTabs(tabs);
            } else {
              chrome.tabs.query({ active: true }, processTabs);
            }
          });
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    });
  }
}
