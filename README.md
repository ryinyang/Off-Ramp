# Off-Ramp 🛑📱

**Off-Ramp** is an open-source, cross-platform app designed to interrupt doom scrolling. 

Unlike traditional anti-procrastination apps that hard-block apps or rely on floating overlays, Off-Ramp uses an **Opal-style focus switch**: when your screen time limit is reached on a monitored app or website, Off-Ramp forcibly intercepts entry, shields the app/site, and pulls your focus directly to a mindful break screen.

---

## 🏗️ Monorepo Architecture

Off-Ramp is organized as a high-performance monorepo using **Turborepo** and **npm Workspaces**:

```
off_ramp/
├── packages/
│   ├── core/         # Pure TypeScript logic: schemas, state, utilities, and strategy contracts
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
  * `TimerService`: Tracks screen time at the **Rule Level** (`rule.id`) using event-driven timestamp diffing.
  * `ScheduleEvaluator`: Evaluates active monitoring time windows.
  * `InterruptionEngine`: Main orchestrator firing focus-switch triggers when rule limits are reached and enforcing active break cooldowns across all tabs/apps.
  * `ConfigManager`: Manages Zod parsing, default initialization, and schema migrations.
* **Core Utilities (`src/utils/`)**:
  * `DomainUtils`: Canonical URL normalization, exact/subdomain matching, and target filtering.
  * `TimeUtils`: Screen time unit conversion, rule-level time calculations, and progress percentages.
* **State Management (`src/store/useOffRampStore.ts`)**: Universal Zustand store supporting local state mutation and direct clipboard config sync.

---

## 🔥 Key Extension Features

1. **Rule-Level Screen Time Aggregation**:
   - Timers are accumulated per rule. If a rule covers multiple websites (e.g. `reddit.com`, `tiktok.com`, `youtube.com`), screen time spent across all covered sites is summed toward the rule's limit.
2. **Active Break Cooldown Enforcement**:
   - While a break is active ($now < activeBreakUntil$), opening or switching to ANY targeted website/app immediately redirects to the break page for the remaining break duration. Non-targeted sites remain accessible.
3. **Dedicated Rule Management Settings Page** (`src/options/index.tsx`):
   - Full UI to create, edit, toggle, and delete anti-doomscrolling rules and website domain targets.
4. **Strict Break Page Enforcement** (`src/tabs/break.tsx`):
   - "Return to Previous Page" button is disabled while the break timer is active. Auto-redirection on completion is disabled, requiring explicit user interaction.
5. **Direct Clipboard Config Sync**:
   - Instant "Copy Config" and "Paste Config" via system clipboard (`navigator.clipboard`).
6. **Background Pause & Timer Freezing**:
   - Toggling "Pause Off-Ramp" freezes screen time accumulation and pauses background evaluation ticks.

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

# Run unit tests across core logic (21/21 tests passing across 8 suites)
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
   apps/extension/build/firefox-mv2-prod/manifest.json
   ```
5. Click the **Off-Ramp icon** in the Firefox toolbar to open the popup UI.
6. Click **⚙️ Settings & Rules** to open the full Rule Management Settings Page.
7. Open a tab to `https://www.reddit.com`. When your limit is reached, Off-Ramp will automatically redirect the tab to an internal break page (`tabs/break.html`) displaying a countdown timer and reflection prompt.

---

## 🛠️ Development Commands

| Command | Action |
| :--- | :--- |
| `npm run build` | Builds all packages (`packages/core`, `packages/ui`, `apps/extension`, `apps/mobile`) via Turborepo. |
| `npm run test` | Runs the Vitest test suite across `@off-ramp/core`. |
| `npm run dev --workspace=@off-ramp/extension` | Starts Plasmo dev server with hot-reloading for Firefox extension. |
