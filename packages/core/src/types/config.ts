import { z } from "zod";

export const TargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  identifier: z.string(), // App bundle ID (e.g. com.tiktok) or domain (e.g. tiktok.com)
  type: z.enum(["app", "website"]),
});

export type Target = z.infer<typeof TargetSchema>;

export const ScheduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  activeDays: z.array(z.number().min(1).max(7)), // 1 = Mon, 7 = Sun
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm 24-hr format
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  enabled: z.boolean().default(true),
});

export type Schedule = z.infer<typeof ScheduleSchema>;

export const RuleSchema = z.object({
  id: z.string(),
  allowedMinutes: z.number().positive(), // X minutes allowed
  interruptionSeconds: z.number().positive(), // Y seconds break duration
  message: z.string().default("Time to take a break! Give yourself an off-ramp."),
  targetIds: z.array(z.string()),
  scheduleId: z.string(),
  enabled: z.boolean().default(true),
});

export type Rule = z.infer<typeof RuleSchema>;

export const UserConfigSchemaV1 = z.object({
  version: z.literal(1),
  targets: z.array(TargetSchema),
  schedules: z.array(ScheduleSchema),
  rules: z.array(RuleSchema),
  updatedAt: z.string().datetime(),
});

export type UserConfigV1 = z.infer<typeof UserConfigSchemaV1>;

export const UserConfigSchema = UserConfigSchemaV1;
export type UserConfig = z.infer<typeof UserConfigSchema>;
