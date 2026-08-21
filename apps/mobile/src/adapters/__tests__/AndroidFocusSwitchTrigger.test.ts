import mockOffRampMonitor from "../../testing/mockOffRampMonitor";
import { AndroidFocusSwitchTrigger } from "../AndroidFocusSwitchTrigger";

describe("AndroidFocusSwitchTrigger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("asks the native module to fire the forced focus-switch with the given duration and message", async () => {
    const trigger = new AndroidFocusSwitchTrigger();
    await trigger.fireInterruption(30, "Take a break!");
    expect(mockOffRampMonitor.requestFocusSwitch).toHaveBeenCalledWith(30, "Take a break!");
  });
});
