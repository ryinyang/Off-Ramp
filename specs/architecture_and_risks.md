# Architecture Research & Risk Mitigation Analysis

## 1. Executive Summary
This document outlines technical research, feasibility constraints, risk mitigation strategies, and system designs for **Off-Ramp** across browser extensions (Chrome/Firefox MV3) and mobile platforms (Android & iOS).

Off-Ramp operates strictly in **Focus-Switch Mode (Opal-Style)**: Using native OS capabilities to forcibly pull screen focus away from restricted apps/sites and return focus to Off-Ramp or the Home Screen.

---

## 2. Technical Risk Matrix & Mitigation Strategies

| Risk Category | Identified Bottleneck | Technical Constraint | Recommended Mitigation |
| :--- | :--- | :--- | :--- |
| **iOS Focus-Switch Mechanism** | Cannot call `UIApplication.openURL` from `ShieldActionExtension` | Apple restricts shield extension actions to `.close`, `.defer`, or `.none`. | Action button executes `.close` (dismisses target app to Home Screen) and triggers a local notification / deep link (`offramp://`) to open Off-Ramp. |
| **Android Focus-Switch Mechanism** | Background service cannot launch activity without permission | Android 10+ restricts starting activities directly from background services. | Use Android **Accessibility Service** (`AccessibilityService`) listening to `TYPE_WINDOW_STATE_CHANGED` to issue `startActivity(intentToOffRamp)`. |
| **iOS Family Controls Approval** | Apple entitlement requirement | Apple requires manual approval for `com.apple.developer.family-controls`. | Apply for entitlement in Apple Developer Portal immediately. Provide fallback mock adapters for local dev builds. |
| **Chrome Manifest V3 Timers** | Service Worker auto-terminates after 30s | Background JS `setInterval` freezes when service worker goes idle. | Implement **event-driven timestamp diffing** (`chrome.tabs.onActivated` / `chrome.tabs.onUpdated`) using `chrome.storage.session`. |
| **Web Focus-Switching** | Target tab open in background | Injected content script can be closed or bypassed by switching tabs. | Call `chrome.tabs.update(tabId, { url: breakPageUrl })` to redirect active tab to internal Off-Ramp extension break page. |

---

## 3. Platform Architecture Diagram (Opal-Style Focus Switch)

```
+-----------------------------------------------------------------------------------------------------+
|                                          OFF-RAMP BRAIN                                             |
|                                       (InterruptionEngine)                                          |
+-----------------------------------------------------------------------------------------------------+
                                                  |
                  +-------------------------------+-------------------------------+
                  |                               |                               |
                  v                               v                               v
         [  iOS Platform  ]              [ Android Platform ]            [ Web Extension  ]
                  |                               |                               |
                  v                               v                               v
          Native Shield                 Accessibility Intent              Tab Redirect
   (ManagedSettings + .close)           (startActivity OffRamp)       (chrome.tabs.update)
```

---

## 4. Immediate Next Steps & Spikes
1. **Apply for Apple Family Controls Entitlement**: Request entitlement on Apple Developer Console.
2. **Execute Expo Prebuild Spike**: Confirm Expo config plugins generate Swift `ShieldConfigurationExtension` targets cleanly.
3. **Android Accessibility Spike**: Verify `AccessibilityService` window state change listener and `startActivity` Intent behavior on Android 14 test device/emulator.
4. **Plasmo Break Page Spike**: Test `chrome.tabs.update` redirect and timer auto-restore in Plasmo MV3.
