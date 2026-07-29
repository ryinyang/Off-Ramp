import { IPlatformMonitor } from "@off-ramp/core";

export class WebTabMonitor implements IPlatformMonitor {
  public async getCurrentActivity(): Promise<string | null> {
    try {
      let activeUrl: string | undefined;

      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs.length > 0) {
          activeUrl = tabs[0].url;
        }
      } else if (typeof browser !== "undefined" && browser.tabs && browser.tabs.query) {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs.length > 0) {
          activeUrl = tabs[0].url;
        }
      }

      if (!activeUrl) return null;

      const parsedUrl = new URL(activeUrl);
      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
        // Remove leading 'www.' if present
        return parsedUrl.hostname.replace(/^www\./, "");
      }
    } catch {
      // Ignore non-standard URLs (e.g. about:blank or chrome://)
    }

    return null;
  }
}
