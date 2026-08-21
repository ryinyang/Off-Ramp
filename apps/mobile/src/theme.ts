/**
 * Mirrors packages/ui/src/tokens/colors.ts plus the spacing/radius scale used across
 * apps/mobile screens. Kept as plain constants (not Tailwind) because NativeWind 4.2.6's
 * className styling does not apply on the current Expo SDK 57 / React Native 0.86 / React 19.2
 * stack — verified on-device (a bare `<Text className="bg-red-500">` rendered fully unstyled
 * even with a clean Metro cache, on both the New and old architecture).
 */
export const colors = {
  primary: "#6366F1",
  primaryHover: "#4F46E5",
  backgroundDark: "#0F172A",
  cardDark: "#1E293B",
  textLight: "#F8FAFC",
  textMuted: "#94A3B8",
  danger: "#EF4444",
  dangerMuted: "#451A1A",
  success: "#10B981",
  successMuted: "#0F2E22",
  warning: "#F59E0B",
  border: "#334155",
  borderMuted: "#475569",
  overlay: "rgba(0, 0, 0, 0.7)",
  // Target-type markers: apps and websites can share a display name (e.g. a "YouTube" app
  // target alongside a "YouTube" website target), so every place a target's name is shown also
  // shows one of these as a small badge to disambiguate at a glance.
  targetApp: "#818CF8",
  targetWebsite: "#2DD4BF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 24,
  huge: 52,
} as const;
