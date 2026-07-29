# Architecture Research & Risk Mitigation Analysis

## 1. Executive Summary

This document outlines technical research, feasibility constraints, risk mitigation strategies, and system designs for **Off-Ramp** across browser extensions (Firefox/Chrome MV3 & MV2) and mobile platforms (Android & iOS).

Off-Ramp operates strictly in **Focus-Switch Mode (Opal-Style)**: Using native OS capabilities to forcibly pull screen focus away from restricted apps/sites and return focus to Off-Ramp or the Home Screen.

---

## 2. Technical Risk Matrix & Mitigation Strategies

| Risk Category                      | Identified Bottleneck                                                   | Technical Constraint                                                                     | Recommended Mitigation                                                                                                                                                                          |
| :--------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **iOS Focus-Switch Mechanism**     | Cannot call `UIApplication.openURL` from `ShieldActionExtension`        | Apple restricts shield extension actions to `.close`, `.defer`, or `.none`.              | Action button executes `.close` (dismisses target app to Home Screen) and triggers a local notification / deep link (`offramp://`) to open Off-Ramp.                                            |
| **Android Focus-Switch Mechanism** | Background service cannot launch activity without permission            | Android 10+ restricts starting activities directly from background services.             | Use Android **Accessibility Service** (`AccessibilityService`) listening to `TYPE_WINDOW_STATE_CHANGED` to issue `startActivity(intentToOffRamp)`.                                              |
| **iOS Family Controls Approval**   | Apple entitlement requirement                                           | Apple requires manual approval for `com.apple.developer.family-controls`.                | Apply for entitlement in Apple Developer Portal immediately. Provide fallback mock adapters for local dev builds.                                                                               |
| **Firefox/Chrome Promise APIs**    | `chrome.*` returns `undefined` when `await`ed in Firefox                | Firefox defines `window.chrome` legacy alias, but its methods expect callback functions. | Prioritize Promise-native `browser.*` APIs first via `BrowserApi` helper, falling back to callback wrappers for `chrome.*`.                                                                     |
| **Web Focus-Switching & Cooldown** | Target tab open in background or user opens new target tab during break | User attempts to open another restricted site tab during active break.                   | `InterruptionEngine` tracks `activeBreakUntil`. If user opens any target tab during an active break, immediately fire `browser.tabs.update` redirecting to `break.html` for remaining duration. |
| **Multi-Target Rule Aggregation**  | Single rule covering multiple websites                                  | Tracking time per domain allows users to bypass limits by site hopping.                  | Track screen time at the **`rule.id` level**. `TimerService` sums screen time across all target domains assigned to a rule.                                                                     |

---

## 3. Platform Architecture Diagram (Opal-Style Focus Switch)

```
+-----------------------------------------------------------------------------------------------------+
|                                          OFF-RAMP BRAIN                                             |
|                             (InterruptionEngine + TimerService rule.id)                              |
+-----------------------------------------------------------------------------------------------------+
                                                  |
                  +-------------------------------+-------------------------------+
                  |                               |                               |
                  v                               v                               v
         [  iOS Platform  ]              [ Android Platform ]            [ Web Extension  ]
                  |                               |                               |
                  v                               v                               v
          Native Shield                 Accessibility Intent              Tab Redirect
   (ManagedSettings + .close)           (startActivity OffRamp)       (browser.tabs.update)
```

---

## 4. Completed Spikes & Next Platform Steps

1. **Firefox MV2 / Plasmo Extension POC**: **Complete & Verified**. Includes Rule-Level screen time aggregation, Active Break Cooldown enforcement across tabs, Settings & Rule Configurator, and Clipboard Config Sync.
2. **Apply for Apple Family Controls Entitlement**: Request entitlement on Apple Developer Console.
3. **Execute Expo Prebuild Spike**: Confirm Expo config plugins generate Swift `ShieldConfigurationExtension` targets cleanly.
4. **Android Accessibility Spike**: Verify `AccessibilityService` window state change listener and `startActivity` Intent behavior on Android 14 test device/emulator.
