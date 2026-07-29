# Milestone 3 Spec: Mobile Applications (Android & iOS)

## 1. Overview

Develop mobile apps for Android and iOS using React Native, Expo, NativeWind, featuring Opal-style Focus-Switching (Android `AccessibilityService` launch intents + iOS Native `ManagedSettingsStore` Shields).

## 2. Architecture & Adapters (`apps/mobile`)

### 2.1 Storage Adapter (`MobileStorage.ts`)

- Implements `IStorageProvider` using `@react-native-async-storage/async-storage`.

### 2.2 Activity Monitor Adapters

- **Android (`AndroidUsageMonitor.ts` & `AndroidAccessibilityMonitor.ts`)**:
  - `UsageStatsManager` powered by an Android Foreground Service (`FOREGROUND_SERVICE`).
  - `AccessibilityService` listening to `TYPE_WINDOW_STATE_CHANGED` for instant target package detection.
- **iOS (`IOSActivityMonitor.ts`)**:
  - Configures Apple's `DeviceActivity` framework to receive OS usage threshold callbacks.

### 2.3 Interruption Trigger Adapters

- **Android Focus-Switch Trigger (`AndroidFocusSwitchTrigger.ts`)**:
  - Uses `AccessibilityService` to fire a forced `startActivity()` launch intent targeting Off-Ramp's `BreakActivity`, pulling focus away from the restricted app instantly.
- **iOS Native Shield Trigger (`IOSShieldTrigger.ts`)**:
  - Configures SwiftUI `ShieldConfigurationExtension` and `ShieldActionExtension`.
  - When target app limit is hit, iOS displays system shield. Tapping action button triggers `.close` (dismisses target app to Home Screen) and triggers a local push notification / deep link (`offramp://break`) into Off-Ramp.

## 3. UI & Permissions (`packages/ui` + `apps/mobile`)

- **Permissions Onboarding Flow**:
  - Android: Prompts user for Usage Access (`PACKAGE_USAGE_STATS`) and Accessibility Service (`ACCESSIBILITY_SERVICE`).
  - iOS: Prompts user for Family Controls (`AuthorizationCenter.shared.requestAuthorization`).
- **App Screens**:
  - `HomeScreen`: Active timers, focus session status, monitoring toggle.
  - `TargetSelectorScreen`: App picker listing installed target apps or domain targets.
  - `RulesScreen`: Configurator for $X$ minutes, $Y$ seconds, and active schedules.

## 4. Deliverables & Verification

- Expo app builds cleanly using `npx expo prebuild` for both Android and iOS targets.
- Android Accessibility focus-switch trigger forcibly yanks focus from restricted apps to Off-Ramp screen upon limit expiration.
- iOS `ShieldConfigurationExtension` and `ShieldActionExtension` successfully shield restricted apps and dismiss to Home Screen / Off-Ramp deep link.
- Physical device testing verified on both Android and iOS hardware.
