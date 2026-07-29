import { IPlatformMonitor, DomainUtils } from "@off-ramp/core";
import { BrowserApi } from "../utils/BrowserApi";

export class WebTabMonitor implements IPlatformMonitor {
  public async getCurrentActivity(): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const processTabs = (tabs: Array<{ url?: string }>) => {
          if (!tabs || tabs.length === 0 || !tabs[0] || !tabs[0].url) {
            resolve(null);
            return;
          }
          try {
            const parsedUrl = new URL(tabs[0].url);
            if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
              const normalized = DomainUtils.normalizeDomain(parsedUrl.hostname);
              resolve(normalized || null);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        };

        const tabsApi = BrowserApi.getTabs();
        if (typeof browser !== "undefined" && tabsApi && tabsApi.query) {
          tabsApi.query({ active: true, lastFocusedWindow: true }).then(
            (tabs) => {
              if (tabs && tabs.length > 0) {
                processTabs(tabs);
              } else {
                tabsApi.query({ active: true }).then(processTabs, () => resolve(null));
              }
            },
            () => resolve(null)
          );
        } else if (typeof chrome !== "undefined" && tabsApi && tabsApi.query) {
          tabsApi.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0) {
              processTabs(tabs);
            } else {
              tabsApi.query({ active: true }, processTabs);
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
