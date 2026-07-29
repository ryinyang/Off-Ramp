import { IPlatformTrigger } from "@off-ramp/core";

export class WebTabRedirectTrigger implements IPlatformTrigger {
  public async fireInterruption(durationSeconds: number, message: string): Promise<void> {
    const encodedMessage = encodeURIComponent(message);
    let breakPageUrl: string | undefined;

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      breakPageUrl = chrome.runtime.getURL(
        `tabs/break.html?duration=${durationSeconds}&message=${encodedMessage}`
      );
    } else if (typeof browser !== "undefined" && browser.runtime && browser.runtime.getURL) {
      breakPageUrl = browser.runtime.getURL(
        `tabs/break.html?duration=${durationSeconds}&message=${encodedMessage}`
      );
    }

    if (!breakPageUrl) return;

    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0 && tabs[0].id !== undefined) {
        await chrome.tabs.update(tabs[0].id, { url: breakPageUrl });
      }
    } else if (typeof browser !== "undefined" && browser.tabs && browser.tabs.query) {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0 && tabs[0].id !== undefined) {
        await browser.tabs.update(tabs[0].id, { url: breakPageUrl });
      }
    }
  }
}
