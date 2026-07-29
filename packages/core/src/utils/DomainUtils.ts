import { Target } from "../types/config.js";

export class DomainUtils {
  /**
   * Normalizes a raw URL or domain string down to a canonical domain (e.g. "https://www.youtube.com/watch?v=123" -> "youtube.com").
   */
  public static normalizeDomain(input: string): string {
    if (!input) return "";
    let cleaned = input.trim().toLowerCase();
    cleaned = cleaned.replace(/^https?:\/\//, "");
    cleaned = cleaned.replace(/^www\./, "");
    cleaned = cleaned.split("/")[0].split("?")[0].split("#")[0];
    return cleaned;
  }

  /**
   * Checks if an active activity domain matches a target domain (exact or subdomain match).
   */
  public static isDomainMatch(activityDomain: string, targetDomain: string): boolean {
    if (!activityDomain || !targetDomain) return false;
    const actLower = activityDomain.trim().toLowerCase();
    const tgtLower = targetDomain.trim().toLowerCase();

    return (
      actLower === tgtLower ||
      actLower.endsWith("." + tgtLower) ||
      tgtLower.endsWith("." + actLower)
    );
  }

  /**
   * Returns all targets from a targets array matching an active activity domain.
   */
  public static getMatchingTargets(activityDomain: string, targets: Target[]): Target[] {
    if (!activityDomain || !targets || targets.length === 0) return [];
    return targets.filter((target) => this.isDomainMatch(activityDomain, target.identifier));
  }
}
