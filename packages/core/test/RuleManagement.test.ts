import { describe, it, expect } from "vitest";
import { ConfigManager, UserConfig, Target, Rule } from "../src/index.js";

describe("Rule & Target Management (Settings Behavior)", () => {
  const configManager = new ConfigManager();

  it("adds a new website target cleanly with normalized domain identifier", () => {
    const config = ConfigManager.createDefaultConfig();
    const rawInputDomain = "https://www.youtube.com/watch?v=123";
    const cleanedDomain = rawInputDomain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

    const newTarget: Target = {
      id: "target-youtube",
      name: "YouTube",
      identifier: cleanedDomain,
      type: "website",
    };

    const updatedConfig: UserConfig = {
      ...config,
      targets: [...config.targets, newTarget],
      updatedAt: new Date().toISOString(),
    };

    // Serialize & parse to ensure Zod validation passes
    const serialized = configManager.serializeConfig(updatedConfig);
    const parsed = configManager.parseConfig(serialized);

    expect(parsed.targets).toHaveLength(config.targets.length + 1);
    expect(parsed.targets.find((t) => t.id === "target-youtube")?.identifier).toBe("youtube.com");
  });

  it("removes a target and unassigns it from existing rules", () => {
    const config = ConfigManager.createDefaultConfig();
    const targetToRemoveId = "target-reddit";

    const updatedConfig: UserConfig = {
      ...config,
      targets: config.targets.filter((t) => t.id !== targetToRemoveId),
      rules: config.rules.map((r) => ({
        ...r,
        targetIds: r.targetIds.filter((id) => id !== targetToRemoveId),
      })),
      updatedAt: new Date().toISOString(),
    };

    const parsed = configManager.parseConfig(configManager.serializeConfig(updatedConfig));

    expect(parsed.targets.find((t) => t.id === targetToRemoveId)).toBeUndefined();
    parsed.rules.forEach((rule) => {
      expect(rule.targetIds).not.toContain(targetToRemoveId);
    });
  });

  it("creates a new custom interruption rule and validates schema", () => {
    const config = ConfigManager.createDefaultConfig();
    const newRule: Rule = {
      id: "rule-short-break",
      allowedMinutes: 5,
      interruptionSeconds: 15,
      message: "Custom 5-min warning!",
      targetIds: ["target-tiktok"],
      scheduleId: config.schedules[0].id,
      enabled: true,
    };

    const updatedConfig: UserConfig = {
      ...config,
      rules: [...config.rules, newRule],
      updatedAt: new Date().toISOString(),
    };

    const parsed = configManager.parseConfig(configManager.serializeConfig(updatedConfig));

    expect(parsed.rules).toHaveLength(config.rules.length + 1);
    const created = parsed.rules.find((r) => r.id === "rule-short-break");
    expect(created).toBeDefined();
    expect(created?.allowedMinutes).toBe(5);
    expect(created?.interruptionSeconds).toBe(15);
    expect(created?.message).toBe("Custom 5-min warning!");
  });

  it("updates existing rule parameters and toggles enabled status", () => {
    const config = ConfigManager.createDefaultConfig();
    const targetRuleId = config.rules[0].id;

    // Mutate rule
    const updatedRules = config.rules.map((r) =>
      r.id === targetRuleId
        ? {
            ...r,
            allowedMinutes: 2,
            interruptionSeconds: 45,
            message: "Updated message text",
            enabled: false,
          }
        : r
    );

    const updatedConfig: UserConfig = {
      ...config,
      rules: updatedRules,
      updatedAt: new Date().toISOString(),
    };

    const parsed = configManager.parseConfig(configManager.serializeConfig(updatedConfig));
    const modified = parsed.rules.find((r) => r.id === targetRuleId);

    expect(modified?.allowedMinutes).toBe(2);
    expect(modified?.interruptionSeconds).toBe(45);
    expect(modified?.message).toBe("Updated message text");
    expect(modified?.enabled).toBe(false);
  });

  it("deletes a rule from configuration", () => {
    const config = ConfigManager.createDefaultConfig();
    const targetRuleId = config.rules[0].id;

    const updatedConfig: UserConfig = {
      ...config,
      rules: config.rules.filter((r) => r.id !== targetRuleId),
      updatedAt: new Date().toISOString(),
    };

    const parsed = configManager.parseConfig(configManager.serializeConfig(updatedConfig));

    expect(parsed.rules.find((r) => r.id === targetRuleId)).toBeUndefined();
  });
});
