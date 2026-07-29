# Milestone 1 Spec: Monorepo Foundation & Core Brain

## 1. Overview
Establish the Turborepo workspace infrastructure, universal domain types, core business logic services, adapter interfaces, versioned schema validation, and shared state management supporting Opal-style Focus-Switch interception across all platforms.

## 2. Workspaces & Structure
- `packages/core`: Pure TypeScript, zero UI dependencies.
- `packages/ui`: Cross-platform shared design system & design tokens.
- `apps/mobile`: Expo + React Native shell (configured with Expo Prebuild for native iOS/Android targets).
- `apps/extension`: Plasmo browser extension shell.

## 3. Core Domain Specifications (`packages/core`)

### 3.1 Data Schemas (`types/config.ts`)
- `UserConfig`: Root configuration object with `version: number` for schema migrations.
- `Target`: App bundle ID (e.g. `com.zhiliaoapp.musically`) or domain name (e.g. `tiktok.com`).
- `Schedule`: Active days array (`[1..7]`), start time (`HH:mm`), end time (`HH:mm`).
- `Rule`: Allowed minutes $X$, duration seconds $Y$, custom alert message.

### 3.2 Core Services & Interfaces
- `ConfigManager`: Zod-validated configuration parser with version migration handler.
- `TimerService`: Event-based timestamp delta calculator tracking screen time at the **Rule Level** (`rule.id`).
- `ScheduleEvaluator`: Pure utility returning `isMonitoringActive(schedule, date)`.
- `InterruptionEngine`: Main orchestrator connecting `TimerService`, `ScheduleEvaluator`, and `IPlatformTrigger`. Accumulates time per `rule.id` bucket (summing screen time across all targets assigned to each rule) and triggers interruptions when a rule's combined allowed time is reached. Tracks active break cooldown ($Y$ seconds).

### 3.3 Platform Adapter Interfaces
- `IPlatformMonitor`: `getCurrentActivity(): string | null`
- `IPlatformTrigger`: `fireInterruption(duration: number, message: string): void`
- `IStorageProvider`: `save(data: string): Promise<void>`, `load(): Promise<string | null>`

## 4. Architectural Feasibility & Prebuild Spike
- Validate Expo Config Plugin (`@bacons/apple-targets` or custom plugin) for generating native iOS App Extensions (`ShieldConfiguration` & `DeviceActivityMonitor`).
- Validate Android `AccessibilityService` contract for focus-switch Intent dispatching.

## 5. Deliverables & Verification
- Monorepo initialized with Turborepo, ESLint, Prettier, and TypeScript.
- `packages/core` unit tests passing for `ConfigManager`, `TimerService`, `ScheduleEvaluator`, and `InterruptionEngine`.
