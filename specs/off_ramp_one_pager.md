# Codename: Off-Ramp

## Overview
Off-Ramp is a cross-platform app designed to interrupt doom scrolling by forcibly pulling screen focus away from distracting applications and websites (matching the core behavior of Opal).

Instead of relying on easy-to-ignore floating overlays or full nuclear app blockers, Off-Ramp monitors screen time against user-defined limits. When a limit is reached, Off-Ramp intercepts the restricted application or website, blocks entry via native system shields or tab redirects, and forcibly redirects the user to the Off-Ramp break screen or Home Screen.


## Requirements:
- User configures a list of target apps and websites that Off-Ramp should block/intercept.
- User configures active time schedules for monitoring (e.g., Mon-Fri 09:00-17:00).
- When a target app/site is opened during active hours and hits the screen time limit ($X$ minutes), Off-Ramp forcibly intercepts entry, shields the app/site, and pulls user focus to the Off-Ramp break screen for $Y$ seconds.
- Cross platform:
    - Supported platforms: iOS, Android, and Web Browsers (Chrome / Firefox extension).
    - Unified monorepo architecture (`packages/core`, `packages/ui`, `apps/mobile`, `apps/extension`).
- Priority 1 Cloudless:
    - Offline-first configuration stored locally.
    - Export and import configuration as a single versioned JSON file to sync across devices manually.


## v2 Requirements:
- Cloud Sync: Multi-device automatic state and rule synchronization for subscription users.
- Analytics: Usage statistics, doom scrolling trends, and focus score dashboards.


## Tech Stack

### React Native + Expo (Mobile Shell)
- [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) monorepo setup using `npx expo prebuild` to support custom native iOS and Android target extensions.

### iOS Native Frameworks (Apple Screen Time API)
- `FamilyControls`: Authorizes and locks app usage restrictions.
- `ManagedSettings`: Applies system shields over restricted apps.
- `DeviceActivity`: Schedules background usage monitors and threshold timers.
- `ShieldConfiguration` & `ShieldAction`: Renders native system block screens and dismisses restricted apps to Home Screen / Off-Ramp deep link (`offramp://`).

### Android Native Services
- `AccessibilityService`: Listens to `TYPE_WINDOW_STATE_CHANGED` events. Intercepts launch of restricted app package names and executes a forced `startActivity()` launch intent targeting Off-Ramp.
- `UsageStatsManager`: Tracks application usage stats.
- `ForegroundService`: Maintains persistent background monitoring service.

### Plasmo Framework (Browser Extension)
- [Plasmo](https://www.plasmo.com/) Manifest V3 framework. Uses `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` event listeners in a background service worker.
- Intercepts target site visits and uses `chrome.tabs.update(tabId, { url: breakPageUrl })` to redirect restricted tabs to an internal Off-Ramp break page.

### NativeWind & Tailwind CSS
- [NativeWind](https://www.nativewind.dev/) for cross-platform UI styling across mobile and extension settings pages.

### Zustand & Zod
- [Zustand](https://zustand.docs.pmnd.rs/) for local state management.
- [Zod](https://zod.dev/) for schema validation and versioned migration pipelines.


## Architecture & Low Level Design

### Domain Models (`packages/core/src/types/config.ts`)
- `UserConfig`: Root configuration payload with `version: number`.
- `Target`: App bundle ID (e.g. `com.zhiliaoapp.musically`) or domain name (`tiktok.com`).
- `Schedule`: Active days array (`[1..7]`), start time (`HH:mm`), end time (`HH:mm`).
- `Rule`: Allowed minutes $X$, interruption duration seconds $Y$, custom message.

### Core Services (`packages/core/src/services/`)
- `ConfigManager`: Zod schema validator and versioned migration pipeline.
- `TimerService`: Event-driven timestamp delta calculator.
- `ScheduleEvaluator`: Evaluates active monitoring window for given `Date()` and `Schedule`.
- `InterruptionEngine`: Main orchestrator connecting `TimerService`, `ScheduleEvaluator`, and `IPlatformTrigger`. Maintains active break cooldown state ($Y$ seconds); if a user attempts to open or switch to any targeted app/website while a break cooldown is active, `InterruptionEngine` instantly fires `fireInterruption` on the new tab/app for the remaining break time.

### Adapters (Strategy Pattern)

`IPlatformMonitor` (Interface)
- Method: `getCurrentActivity(): string | null`
- Implementations:
    - `AndroidUsageMonitor`: Interfacing with `UsageStatsManager` & `AccessibilityService`.
    - `WebTabMonitor`: Event-driven active tab listener (`chrome.tabs`).
    - `IOSActivityMonitor`: Hooks into Apple's `DeviceActivity` framework.

`IPlatformTrigger` (Interface)
- Method: `fireInterruption(duration: number, message: string): void`
- Implementations:
    - `AndroidFocusSwitchTrigger`: Uses `AccessibilityService` to fire a forced `startActivity()` launch intent targeting Off-Ramp's break screen (Opal-style).
    - `IOSShieldTrigger`: Configures native SwiftUI `ShieldConfigurationExtension` to shield target app and execute `.close` to return user to Home Screen / Off-Ramp.
    - `WebTabRedirectTrigger`: Uses `chrome.tabs.update()` to redirect active restricted tab to internal extension break page.

`IStorageProvider` (Interface)
- Methods: `save(data: string): Promise<void>`, `load(): Promise<string | null>`
- Implementations:
    - `MobileStorage`: Wraps `@react-native-async-storage/async-storage`.
    - `ExtensionStorage`: Wraps `chrome.storage.local`.


## Tasks & Milestones

### Milestone 1: The Monorepo Foundation
1. Initialize Turborepo workspace (`packages/core`, `packages/ui`, `apps/mobile`, `apps/extension`).
2. Define core TypeScript interfaces and Zod schemas in `packages/core`.
3. Set up Zustand store in `packages/core`.
4. Configure ESLint, Prettier, and TypeScript tooling.

### Milestone 2: Browser Extension POC (Plasmo MV3)
1. Initialize Plasmo inside `apps/extension`.
2. Implement Manifest V3 event-driven tab monitoring in background worker.
3. Implement tab URL redirection (`chrome.tabs.update`) to internal extension break page (`src/pages/break.tsx`).
4. Implement `ExtensionStorage` adapter using `chrome.storage.local`.

### Milestone 3: Mobile Applications (Android & iOS)
1. Initialize Expo shell in `apps/mobile` with Expo Prebuild.
2. Build Android `AccessibilityService` focus-switch trigger (`startActivity()`).
3. Build native iOS `DeviceActivityMonitorExtension`, `ShieldConfigurationExtension`, and `ShieldActionExtension` targets in Swift.
4. Implement permission onboarding flows for Android (Accessibility & Usage Access) and iOS (Family Controls).

### Milestone 4: Cloudless Sync Engine
1. Build JSON Config exporter utility with versioning metadata.
2. Build JSON Config import parser with Zod schema migration pipeline.
3. Add UI buttons and OS file/share sheet integration across web extension and mobile settings screens.
