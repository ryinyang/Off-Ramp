# Milestone 2 Spec: Browser Extension POC & Rule Management

## 1. Overview
Build a fully functional browser extension (Firefox & Chrome) using Plasmo, leveraging event-driven background tab monitoring, break-page tab focus redirection (Opal-style), and a full Rule Management Settings Page.

## 2. Architecture & Adapters (`apps/extension`)

### 2.1 Storage Adapter (`ExtensionStorage.ts`)
- Implements `IStorageProvider` using `browser.storage.local` / `chrome.storage.local`.
- Syncs state changes cleanly with `@off-ramp/core` and persists active accumulated target screen time.

### 2.2 Activity Monitor Adapter (`WebTabMonitor.ts`)
- Implements `IPlatformMonitor`.
- Listens to tab activation and update events to track active website domain names cleanly.

### 2.3 Interruption Trigger Adapter (`WebTabRedirectTrigger.ts`)
- Implements `IPlatformTrigger`.
- Redirects active target tab (`browser.tabs.update`) to internal extension break page (`tabs/break.html`) for $Y$ seconds.

## 3. UI Components

### 3.1 Popup UI (`src/popup/index.tsx`)
- Quick extension toolbar status popup.
- **Monitoring Status Badge**: Shows ACTIVE / PAUSED status with toggle control.
- **Real-Time Target Screen Time & Remaining Time Cards**:
  - Displays each monitored website target (e.g., `reddit.com`, `youtube.com`).
  - Displays real-time accumulated screen time and remaining time until interruption (e.g. `1.2 / 15.0 mins` | `13.8 mins remaining`).
  - Highlights active target domain when user is currently browsing it.
- **Rule Summary List**: Displays active rules and break durations.
- **Settings Navigation**: **"Settings & Rule Configurator ⚙️"** button launching the options page (`chrome.runtime.openOptionsPage()`).

### 3.2 Options / Settings Page UI (`src/options/index.tsx`)
- Full-page extension settings UI for complete Rule Management:
  - **Rule Editor Form**: Create, edit, and delete rules.
  - **Rule Parameters**:
    - Allowed screen time $X$ (minutes).
    - Break duration $Y$ (seconds).
    - Custom reflection/alert message.
    - Target website selection checkboxes (e.g. `reddit.com`, `tiktok.com`, `youtube.com`).
    - Enable / Disable rule toggle.
  - **Target Website Management**: Add new website domain targets or remove existing ones.
  - **Clipboard Config Sync**: Export (Copy configuration JSON directly to user's system clipboard) and Import (Paste configuration JSON from system clipboard).

### 3.3 Break Page UI (`src/tabs/break.tsx`)
- Full-screen extension break screen displaying countdown timer for $Y$ seconds and custom reflection message.
- **Strict Break Enforcement**:
  - The **"Return to Previous Page"** button is **disabled** while the break countdown timer is active ($timeLeft > 0$).
  - **No Auto-Redirection**: When the countdown timer reaches zero, the page does NOT automatically redirect. Access button becomes enabled (`"End Break & Return"`), requiring explicit user action to return.

## 4. Deliverables & Verification
- Plasmo build succeeds for Firefox target.
- Users can create, edit, toggle, and delete rules via the Options Page.
- Popup UI displays real-time remaining screen time per target website.
- Break page disables return button while timer is running and avoids auto-redirection on completion.
