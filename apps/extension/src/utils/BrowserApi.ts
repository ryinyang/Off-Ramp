export class BrowserApi {
  /**
   * Safe getter for extension storage (prioritizes browser.storage over chrome.storage).
   */
  public static getStorage(): typeof browser.storage | typeof chrome.storage | null {
    if (typeof browser !== "undefined" && browser.storage) {
      return browser.storage;
    }
    if (typeof chrome !== "undefined" && chrome.storage) {
      return chrome.storage;
    }
    return null;
  }

  /**
   * Safe getter for extension tabs API.
   */
  public static getTabs(): typeof browser.tabs | typeof chrome.tabs | null {
    if (typeof browser !== "undefined" && browser.tabs) {
      return browser.tabs;
    }
    if (typeof chrome !== "undefined" && chrome.tabs) {
      return chrome.tabs;
    }
    return null;
  }

  /**
   * Safe trigger to open extension settings/options page.
   */
  public static openOptionsPage(): void {
    if (typeof browser !== "undefined" && browser.runtime && browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage();
    } else if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  }
}
