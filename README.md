# Off-Ramp

Off-Ramp is an open-source, cross-platform application that interrupts excessive screen time.

Off-Ramp does not use floating popups that you can dismiss easily. Off-Ramp does not block your applications permanently. Instead, Off-Ramp redirects your active view. When you reach your screen time limit on a monitored website or application, Off-Ramp redirects you to a break page. The break page shows a countdown timer. This break helps you stop repetitive device usage.

---

## Monorepo Structure

Off-Ramp uses Turborepo and npm Workspaces to manage packages:

```text
off_ramp/
├── packages/
│   ├── core/         # TypeScript logic: schemas, state, utilities, and adapter interfaces
│   └── ui/           # Shared design tokens and user interface components
└── apps/
    ├── extension/    # Mozilla Firefox browser extension (Plasmo and React 18)
    └── mobile/       # Android application (Expo, React Native, and a local Expo Module in Kotlin)
```

### Core Architecture (`@off-ramp/core`)

The [`packages/core`](file:///home/ryan/off_ramp/packages/core) package contains the application logic without platform or user interface dependencies:

- **Domain Schemas ([`config.ts`](file:///home/ryan/off_ramp/packages/core/src/types/config.ts))**: Zod schemas for `Target`, `Schedule`, `Rule`, and versioned `UserConfig`.
- **Adapter Interfaces ([`src/adapters/`](file:///home/ryan/off_ramp/packages/core/src/adapters))**:
  - [`IPlatformMonitor`](file:///home/ryan/off_ramp/packages/core/src/adapters/IPlatformMonitor.ts): Queries the active application or website.
  - [`IPlatformTrigger`](file:///home/ryan/off_ramp/packages/core/src/adapters/IPlatformTrigger.ts): Executes the break redirect.
  - [`IStorageProvider`](file:///home/ryan/off_ramp/packages/core/src/adapters/IStorageProvider.ts): Persists local state.
- **Core Services ([`src/services/`](file:///home/ryan/off_ramp/packages/core/src/services))**:
  - [`TimerService`](file:///home/ryan/off_ramp/packages/core/src/services/TimerService.ts): Tracks screen time for each rule with event-driven timestamp differences.
  - [`ScheduleEvaluator`](file:///home/ryan/off_ramp/packages/core/src/services/ScheduleEvaluator.ts): Evaluates active monitoring time windows.
  - [`InterruptionEngine`](file:///home/ryan/off_ramp/packages/core/src/services/InterruptionEngine.ts): Executes break triggers when rules reach limits and applies cooldowns.
  - [`ConfigManager`](file:///home/ryan/off_ramp/packages/core/src/services/ConfigManager.ts): Manages schema validation, default settings, and migrations.
- **Core Utilities ([`src/utils/`](file:///home/ryan/off_ramp/packages/core/src/utils))**:
  - [`DomainUtils`](file:///home/ryan/off_ramp/packages/core/src/utils/DomainUtils.ts): Normalizes URLs, matches subdomains, and filters targets.
  - [`TimeUtils`](file:///home/ryan/off_ramp/packages/core/src/utils/TimeUtils.ts): Converts time units, calculates rule time, and computes progress.
- **State Management ([`useOffRampStore.ts`](file:///home/ryan/off_ramp/packages/core/src/store/useOffRampStore.ts))**: Zustand store that updates local state and synchronizes configuration through the system clipboard.

---

## Key Extension Features

1. **Rule-Level Time Tracking**:
   - The extension sums screen time per rule. If a rule contains multiple websites, the extension combines the time spent across all listed websites.
2. **Active Break Cooldown**:
   - When a break is active, any attempt to open a monitored website redirects immediately to the break page. Non-monitored websites remain available.
3. **Rule Management Page** ([`index.tsx`](file:///home/ryan/off_ramp/apps/extension/src/options/index.tsx)):
   - A user interface lets you create, edit, toggle, and delete rules and domain targets.
4. **Break Page Control** ([`break.tsx`](file:///home/ryan/off_ramp/apps/extension/src/tabs/break.tsx)):
   - The break page disables the return button until the timer finishes. The page does not redirect automatically, which requires user confirmation.
5. **Clipboard Configuration Synchronization**:
   - You can copy and paste configuration data directly through the system clipboard.
6. **Background Pause**:
   - When you pause Off-Ramp, the extension stops time accumulation and timer evaluations.

---

## Key Android App Features

The Android app lives in [`apps/mobile`](apps/mobile). It reuses `@off-ramp/core` for every
platform-independent rule (`InterruptionEngine`, `TimerService`, `ScheduleEvaluator`,
`ConfigManager`) and adds Android-specific native code through a local Expo Module,
[`modules/off-ramp-monitor`](apps/mobile/modules/off-ramp-monitor).

1. **Forced Focus-Switch** ([`OffRampAccessibilityService.kt`](apps/mobile/modules/off-ramp-monitor/android/src/main/java/expo/modules/offrampmonitor/OffRampAccessibilityService.kt)):
   - An Accessibility Service holds the OS-granted exemption that lets Off-Ramp call `startActivity()` from a background context the instant a rule's limit is reached, pulling focus to the break screen (`offramp://break`) — see `architecture_and_risks.md`, "Android Focus-Switch Mechanism".
2. **Foreground-App Detection** ([`ForegroundAppTracker.kt`](apps/mobile/modules/off-ramp-monitor/android/src/main/java/expo/modules/offrampmonitor/ForegroundAppTracker.kt)):
   - Polls `UsageStatsManager` incrementally, caching the last-seen foreground package so a user who stays on one app for a long time is still tracked correctly.
3. **Background Monitoring Service** ([`OffRampForegroundService.kt`](apps/mobile/modules/off-ramp-monitor/android/src/main/java/expo/modules/offrampmonitor/OffRampForegroundService.kt)):
   - A persistent foreground service re-triggers a Headless JS task (`OffRampMonitorTask`) roughly every 3 seconds, running the same `InterruptionEngine.evaluate()` tick the browser extension runs, whether or not the app is on screen.
4. **Permission Onboarding** ([`PermissionsScreen.tsx`](apps/mobile/src/screens/PermissionsScreen.tsx)):
   - Guides the user to grant Usage Access and enable the Accessibility Service (Android has no in-app dialog for either) before monitoring can start.
5. **Target and Rule Management** ([`TargetSelectorScreen.tsx`](apps/mobile/src/screens/TargetSelectorScreen.tsx), [`RulesScreen.tsx`](apps/mobile/src/screens/RulesScreen.tsx)):
   - Add installed apps (via the Android 11+ package-visibility `<queries>` declaration, no restricted permission required) or websites as targets, then configure allowed minutes, break duration, active days/hours, and a reflection message per rule.
6. **Strict Break Enforcement** ([`BreakScreen.tsx`](apps/mobile/src/screens/BreakScreen.tsx)):
   - Mirrors the extension's break page: the return button stays disabled while the countdown runs, the hardware back button is swallowed, and the countdown never redirects automatically once it reaches zero.

---

## Quick Start

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher

### Installation and Build

1. Install dependencies for all packages:
   ```bash
   npm install
   ```
2. Build all monorepo packages:
   ```bash
   npm run build
   ```
3. Run the unit tests:
   ```bash
   npm run test
   ```

---

## Test the Firefox Extension

1. Build the extension package:
   ```bash
   npm run build
   ```
2. Open **Mozilla Firefox**.
3. Go to this address:
   ```text
   about:debugging#/runtime/this-firefox
   ```
4. Click **Load Temporary Add-on...**.
5. Select the [`manifest.json`](file:///home/ryan/off_ramp/apps/extension/build/firefox-mv2-prod/manifest.json) file:
   ```text
   apps/extension/build/firefox-mv2-prod/manifest.json
   ```
6. Click the **Off-Ramp icon** in the Firefox toolbar to open the popup user interface.
7. Click **Settings & Rules** to open the rule management page.
8. Open a new tab and go to `https://www.reddit.com`.
9. When you reach the time limit, Off-Ramp redirects the tab to the break page (`tabs/break.html`).

---

## Run the Android App

Off-Ramp's Accessibility Service and `UsageStatsManager` integration are native Android code, so
the app needs a development build — it cannot run inside Expo Go.

### Prerequisites

- **Android SDK**, with an emulator image or a physical device with USB debugging enabled.
- **JDK 17**.

### Build and install

1. From `apps/mobile`, generate the native Android project (regenerated any time `app.json` or
   `modules/off-ramp-monitor` changes):
   ```bash
   npm run prebuild --workspace=@off-ramp/mobile
   ```
2. Build and install a debug build onto a running emulator or connected device:
   ```bash
   npm run android --workspace=@off-ramp/mobile
   ```
   This starts the Metro bundler and launches the app. On first launch, Off-Ramp shows the
   permissions screen and cannot proceed until you grant **Usage Access** and enable the
   **Accessibility Service**, both from system Settings screens Off-Ramp deep-links you to.
3. To test the forced focus-switch without adding a real target app, add a fast-triggering rule
   from the **Rules** screen (for example, a 1-minute limit covering an app you have installed),
   then keep that app open past the limit — Off-Ramp pulls focus to the break screen automatically.

---

## Development Commands

| Command                                       | Description                                                                                                                                                                                                                                                                        |
| :-------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`                               | Builds all packages ([`packages/core`](file:///home/ryan/off_ramp/packages/core), [`packages/ui`](file:///home/ryan/off_ramp/packages/ui), [`apps/extension`](file:///home/ryan/off_ramp/apps/extension), [`apps/mobile`](file:///home/ryan/off_ramp/apps/mobile)) with Turborepo. |
| `npm run test`                                | Runs the Vitest suite for `@off-ramp/core` and the Jest suite for `@off-ramp/mobile`.                                                                                                                                                                                              |
| `npm run lint` / `npm run check-types`        | Runs ESLint / `tsc --noEmit` across every workspace.                                                                                                                                                                                                                                |
| `npm run dev --workspace=@off-ramp/extension` | Starts the Plasmo development server with hot reload for the Firefox extension.                                                                                                                                                                                                    |
| `npm run prebuild --workspace=@off-ramp/mobile` | Regenerates `apps/mobile/android` from `app.json` and `modules/off-ramp-monitor`.                                                                                                                                                                                                |
| `npm run android --workspace=@off-ramp/mobile`  | Builds and installs a debug build of the Android app on an emulator or device.                                                                                                                                                                                                   |
