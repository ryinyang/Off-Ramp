import { describe, it, expect } from "vitest";
import { DomainUtils, Target } from "../src/index.js";

describe("DomainUtils", () => {
  it("normalizes full URLs and domain strings correctly", () => {
    expect(DomainUtils.normalizeDomain("https://www.youtube.com/watch?v=123")).toBe("youtube.com");
    expect(DomainUtils.normalizeDomain("http://www.reddit.com/r/all")).toBe("reddit.com");
    expect(DomainUtils.normalizeDomain("OLD.REDDIT.COM")).toBe("old.reddit.com");
    expect(DomainUtils.normalizeDomain("tiktok.com")).toBe("tiktok.com");
  });

  it("matches domain exact and subdomain variations", () => {
    expect(DomainUtils.isDomainMatch("www.reddit.com", "reddit.com")).toBe(true);
    expect(DomainUtils.isDomainMatch("old.reddit.com", "reddit.com")).toBe(true);
    expect(DomainUtils.isDomainMatch("reddit.com", "www.reddit.com")).toBe(true);
    expect(DomainUtils.isDomainMatch("google.com", "reddit.com")).toBe(false);
  });

  it("filters matching targets cleanly", () => {
    const targets: Target[] = [
      { id: "t1", name: "Reddit", identifier: "reddit.com", type: "website" },
      { id: "t2", name: "TikTok", identifier: "tiktok.com", type: "website" },
    ];

    const matched = DomainUtils.getMatchingTargets("old.reddit.com", targets);
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("t1");
  });
});
