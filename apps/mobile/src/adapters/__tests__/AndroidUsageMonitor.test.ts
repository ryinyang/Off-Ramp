import mockOffRampMonitor from "../../testing/mockOffRampMonitor";
import { AndroidUsageMonitor } from "../AndroidUsageMonitor";

describe("AndroidUsageMonitor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the native module's reported foreground package", async () => {
    mockOffRampMonitor.getForegroundPackageName.mockResolvedValueOnce("com.zhiliaoapp.musically");
    const monitor = new AndroidUsageMonitor();
    expect(await monitor.getCurrentActivity()).toBe("com.zhiliaoapp.musically");
  });

  it("returns null when nothing is in the foreground", async () => {
    mockOffRampMonitor.getForegroundPackageName.mockResolvedValueOnce(null);
    const monitor = new AndroidUsageMonitor();
    expect(await monitor.getCurrentActivity()).toBeNull();
  });

  it("returns null instead of throwing when the native call rejects", async () => {
    mockOffRampMonitor.getForegroundPackageName.mockRejectedValueOnce(new Error("native error"));
    const monitor = new AndroidUsageMonitor();
    await expect(monitor.getCurrentActivity()).resolves.toBeNull();
  });
});
