import { UserConfig, UserConfigSchema } from "../types/config.js";

export class ConfigManager {
  /**
   * Generates a default initial user configuration.
   */
  public static createDefaultConfig(): UserConfig {
    return {
      version: 1,
      targets: [
        {
          id: "target-tiktok",
          name: "TikTok",
          identifier: "com.zhiliaoapp.musically",
          type: "app",
        },
        {
          id: "target-reddit",
          name: "Reddit",
          identifier: "reddit.com",
          type: "website",
        },
      ],
      schedules: [
        {
          id: "sched-workdays",
          name: "Workdays",
          activeDays: [1, 2, 3, 4, 5], // Mon - Fri
          startTime: "09:00",
          endTime: "17:00",
          enabled: true,
        },
      ],
      rules: [
        {
          id: "rule-default",
          allowedMinutes: 15,
          interruptionSeconds: 30,
          message: "Hey! Time to take a break and give yourself an off-ramp.",
          targetIds: ["target-tiktok", "target-reddit"],
          scheduleId: "sched-workdays",
          enabled: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Validates and parses raw JSON string or object payload into UserConfig.
   * Handles migration pipelines for older versions if needed.
   */
  public parseConfig(rawJson: string | object): UserConfig {
    const data = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;

    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid configuration format: Expected JSON object.");
    }

    const version = (data as { version?: unknown }).version;

    if (version === undefined) {
      // Legacy unversioned format fallback migration
      return UserConfigSchema.parse({
        ...data,
        version: 1,
        updatedAt: new Date().toISOString(),
      });
    }

    if (version === 1) {
      return UserConfigSchema.parse(data);
    }

    throw new Error(`Unsupported configuration version: ${version}`);
  }

  /**
   * Serializes UserConfig object to JSON string.
   */
  public serializeConfig(config: UserConfig): string {
    const validated = UserConfigSchema.parse(config);
    return JSON.stringify(validated, null, 2);
  }
}
