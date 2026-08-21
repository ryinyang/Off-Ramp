import AsyncStorage from "@react-native-async-storage/async-storage";

import { MobileStorage } from "../MobileStorage";

describe("MobileStorage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("returns null for a key that has never been saved", async () => {
    const storage = new MobileStorage();
    expect(await storage.load("off_ramp_config")).toBeNull();
  });

  it("round-trips a saved value through AsyncStorage", async () => {
    const storage = new MobileStorage();
    await storage.save("off_ramp_config", '{"version":1}');
    expect(await storage.load("off_ramp_config")).toBe('{"version":1}');
  });

  it("overwrites a previously saved value for the same key", async () => {
    const storage = new MobileStorage();
    await storage.save("off_ramp_paused", "true");
    await storage.save("off_ramp_paused", "false");
    expect(await storage.load("off_ramp_paused")).toBe("false");
  });

  it("keeps distinct keys independent", async () => {
    const storage = new MobileStorage();
    await storage.save("a", "1");
    await storage.save("b", "2");
    expect(await storage.load("a")).toBe("1");
    expect(await storage.load("b")).toBe("2");
  });
});
