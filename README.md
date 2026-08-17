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
    └── mobile/       # Mobile application (Expo and React Native)
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

## Development Commands

| Command                                       | Description                                                                                                                                                                                                                                                                        |
| :-------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`                               | Builds all packages ([`packages/core`](file:///home/ryan/off_ramp/packages/core), [`packages/ui`](file:///home/ryan/off_ramp/packages/ui), [`apps/extension`](file:///home/ryan/off_ramp/apps/extension), [`apps/mobile`](file:///home/ryan/off_ramp/apps/mobile)) with Turborepo. |
| `npm run test`                                | Runs the Vitest test suite for [`@off-ramp/core`](file:///home/ryan/off_ramp/packages/core).                                                                                                                                                                                       |
| `npm run dev --workspace=@off-ramp/extension` | Starts the Plasmo development server with hot reload for the Firefox extension.                                                                                                                                                                                                    |
