# Milestone 4 Spec: Cloudless Sync Engine

## 1. Overview

Build a lightweight, offline-first manual JSON configuration import and export mechanism across browser extension and mobile app platforms with strict schema versioning and migration capabilities.

## 2. Shared Sync Logic (`packages/core/services/SyncEngine.ts`)

- **Export Generator**: Serializes current Zustand `UserConfig` into structured `.json` string with `version` tag and checksum/timestamp metadata.
- **Import Parser & Migration Engine**:
  - Inspects incoming JSON `version` tag.
  - Passes data through versioned Zod migration pipeline (e.g. `v1 -> v2`).
  - Validates full payload before updating state via `ConfigManager`.
  - Rejects malformed JSON with user-friendly actionable error messages.

## 3. UI Integrations

- **Web Extension**: Download config `.json` file / Upload config `.json` file input in Popup & Options pages.
- **Mobile App**: Export via system share sheet (`react-native-share`) / Import via document picker (`expo-document-picker`).

## 4. Deliverables & Verification

- Validated JSON export from Extension imports seamlessly into Android and iOS mobile apps.
- Backward compatibility confirmed via unit tests for older schema versions.
- Invalid or corrupted JSON files present clear error messages without corrupting active app configuration.
