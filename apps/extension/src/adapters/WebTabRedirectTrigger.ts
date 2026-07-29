import { IPlatformTrigger } from "@off-ramp/core";

export class WebTabRedirectTrigger implements IPlatformTrigger {
  public async fireInterruption(durationSeconds: number, message: string): Promise<void> {
    const encodedMessage = encodeURIComponent(message);
    let breakPageUrl: string | undefined;

    if (typeof browser !== "undefined" && browser.runtime && browser.runtime.getURL) {
      breakPageUrl = browser.runtime.getURL(
        `tabs/break.html?duration=${durationSeconds}&message=${encodedMessage}`
      );
    } else if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      breakPageUrl = chrome.runtime.getURL(
        `tabs/break.html?duration=${durationSeconds}&message=${encodedMessage}`
      );
    }

    if (!breakPageUrl) return;

    const targetUrl = breakPageUrl;

    const performUpdate = (tabId: number) => {
      if (typeof browser !== "undefined" && browser.tabs && browser.tabs.update) {
        browser.tabs.update(tabId, { url: targetUrl });
      } else if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.update) {
        chrome.tabs.update(tabId, { url: targetUrl });
      }
    };

    if (typeof browser !== "undefined" && browser.tabs && browser.tabs.query) {
      const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabs && tabs.length > 0 && tabs[0].id !== undefined) {
        performUpdate(tabs[0].id);
      } else {
        const allTabs = await browser.tabs.query({ active: true });
        if (allTabs && allTabs.length > 0 && allTabs[0].id !== undefined) {
          performUpdate(allTabs[0].id);
        }
      }
    } else if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0 && tabs[0].id !== undefined) {
          performUpdate(tabs[0].id);
        } else {
          chrome.tabs.query({ active: true }, (allTabs) => {
            if (allTabs && allTabs.length > 0 && allTabs[0].id !== undefined) {
              performUpdate(allTabs[0].id);
            }
          });
        }
      });
    }
  }
}
