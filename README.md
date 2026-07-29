# Off-Ramp 🛑📱

**Off-Ramp** is an open-source, cross-platform app designed to interrupt doom scrolling. 

Unlike traditional anti-procrastination apps that hard-block apps or rely on floating overlays, Off-Ramp uses an **Opal-style focus switch**: when your screen time limit is reached on a monitored app or website, Off-Ramp forcibly intercepts entry, shields the app/site, and pulls your focus directly to a mindful break screen.

---

## 🏗️ Monorepo Architecture

Off-Ramp is organized as a high-performance monorepo using **Turborepo** and **npm Workspaces**:

```
off_ramp/
├── packages/
│   ├── core/         # Pure TypeScript logic: schemas, state, and strategy contracts
│   └── ui/           # Shared cross-platform design tokens and UI components
└── apps/
    ├── extension/    # Firefox browser extension (built with Plasmo & React 18)
    └── mobile/       # Mobile application (built with Expo & React Native)
```

### Core Architecture (`@off-ramp/core`)
The brain of Off-Ramp lives in `packages/core` with zero platform or UI dependencies:
* **Domain Schemas (`src/types/config.ts`)**: Zod-validated data models for `Target`, `Schedule`, `Rule`, and versioned `UserConfig`.
* **Strategy Contracts (`src/adapters/`)**:
  * `IPlatformMonitor`: Interface for querying current active application/website.
  * `IPlatformTrigger`: Interface for executing Opal-style focus-switch interruptions.
  * `IStorageProvider`: Interface for local state persistence.
* **Core Services (`src/services/`)**:
  * `TimerService`: Calculates screen time using event-driven timestamp diffing.
  * `ScheduleEvaluator`: Evaluates active monitoring time windows.
  * `InterruptionEngine`: Main orchestrator firing focus-switch triggers when limits fire.
  * `ConfigManager`: Manages Zod parsing, default initialization, and schema migrations.
* **State Management (`src/store/useOffRampStore.ts`)**: Universal Zustand store supporting local state mutation and manual JSON config export/import.

---

## ⚡ Quick Start

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation & Build

```bash
# Install dependencies across all packages
npm install

# Build all monorepo packages
npm run build

# Run unit tests across core logic
npm run test
```

---

## 🦊 Testing the Firefox Extension

1. Build the extension bundle:
   ```bash
   npm run build
   ```
2. Open **Mozilla Firefox** and navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
3. Click **Load Temporary Add-on...**
4. Select `manifest.json` located inside:
   ```text
   apps/extension/build/firefox-mv2-dev/manifest.json
   ```
5. Click the **Off-Ramp icon** in the Firefox toolbar to open the popup UI.
6. Open a tab to `https://www.reddit.com`. When your limit is reached, Off-Ramp will automatically redirect the tab to an internal break page (`tabs/break.html`) displaying a countdown timer and reflection prompt.

---

## 🛠️ Development Commands

| Command | Action |
| :--- | :--- |
| `npm run build` | Builds all packages (`packages/core`, `packages/ui`, `apps/extension`, `apps/mobile`) via Turborepo. |
| `npm run test` | Runs the Vitest test suite across `@off-ramp/core`. |
| `npm run dev --workspace=@off-ramp/extension` | Starts Plasmo dev server with hot-reloading for Firefox extension. |
