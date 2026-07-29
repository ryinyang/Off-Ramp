# Milestone 2 Spec: Browser Extension POC

## 1. Overview
Build a fully functional browser extension (Chrome / Firefox) using Plasmo and Manifest V3, leveraging event-driven background tab monitoring and break-page tab focus redirection (Opal-style).

## 2. Architecture & Adapters (`apps/extension`)

### 2.1 Storage Adapter (`ExtensionStorage.ts`)
- Implements `IStorageProvider` using `chrome.storage.local`.
- Syncs state changes cleanly with the Zustand store in `packages/core`.

### 2.2 Activity Monitor Adapter (`WebTabMonitor.ts`)
- Implements `IPlatformMonitor`.
- **Manifest V3 Event-Driven Strategy**: Listens to `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` events. Calculates elapsed time using timestamp deltas stored in `chrome.storage.session`.

### 2.3 Interruption Trigger Adapter (`WebTabRedirectTrigger.ts`)
- Implements `IPlatformTrigger`.
- **Focus-Switch Strategy (Opal-Style)**: Redirects active target tab (`chrome.tabs.update(tabId, { url: breakPageUrl })`) to an internal extension break page for $Y$ seconds, pulling focus off the target website entirely.

## 3. UI Components
- **Popup UI** (`src/popup/index.tsx`): Quick configuration view for managing target websites and rules.
- **Break Page UI** (`src/pages/break.tsx`): Full-screen extension page displaying countdown and reflection message before auto-restoring access.

## 4. Deliverables & Verification
- Plasmo build succeeds without errors under Manifest V3 strict rules.
- Event-driven background service worker accurately accumulates active domain screen time across tab switches.
- Focus-Switch tab redirect triggers accurately after $X$ minutes and restores access after $Y$ seconds.
