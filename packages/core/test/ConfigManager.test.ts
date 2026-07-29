import { describe, it, expect } from "vitest";
import { ConfigManager } from "../src/services/ConfigManager.js";

describe("ConfigManager", () => {
  const manager = new ConfigManager();

  it("creates valid default configuration", () => {
    const defaultConfig = ConfigManager.createDefaultConfig();
    expect(defaultConfig.version).toBe(1);
    expect(defaultConfig.targets.length).toBeGreaterThan(0);
    expect(defaultConfig.schedules.length).toBeGreaterThan(0);
    expect(defaultConfig.rules.length).toBeGreaterThan(0);
  });

  it("serializes and parses valid config JSON", () => {
    const defaultConfig = ConfigManager.createDefaultConfig();
    const serialized = manager.serializeConfig(defaultConfig);
    const parsed = manager.parseConfig(serialized);

    expect(parsed.version).toBe(1);
    expect(parsed.targets).toEqual(defaultConfig.targets);
  });

  it("migrates legacy unversioned config format", () => {
    const defaultConfig = ConfigManager.createDefaultConfig();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { version, updatedAt, ...legacyConfig } = defaultConfig;

    const parsed = manager.parseConfig(legacyConfig);
    expect(parsed.version).toBe(1);
    expect(parsed.targets.length).toBe(defaultConfig.targets.length);
  });

  it("throws error on invalid JSON string", () => {
    expect(() => manager.parseConfig("invalid json")).toThrow();
  });
});
