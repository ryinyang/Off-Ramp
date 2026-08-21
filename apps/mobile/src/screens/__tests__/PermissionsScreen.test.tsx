import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

import mockOffRampMonitor from "../../testing/mockOffRampMonitor";
import PermissionsScreen from "../PermissionsScreen";

describe("PermissionsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOffRampMonitor.hasUsageAccessPermission.mockReturnValue(false);
    mockOffRampMonitor.hasAccessibilityPermission.mockReturnValue(false);
    mockOffRampMonitor.hasNotificationPermission.mockReturnValue(false);
  });

  it("disables Continue until both required permissions are granted", async () => {
    await render(<PermissionsScreen />);
    const continueButton = screen.getByTestId("permissions-continue");
    expect(continueButton.props.accessibilityState.disabled).toBe(true);
  });

  it("opens the usage access settings screen when requested", async () => {
    await render(<PermissionsScreen />);
    await fireEvent.press(screen.getByText("Open Usage Access Settings"));
    expect(mockOffRampMonitor.openUsageAccessSettings).toHaveBeenCalled();
  });

  it("starts the monitoring service and navigates home once both required permissions are granted", async () => {
    mockOffRampMonitor.hasUsageAccessPermission.mockReturnValue(true);
    mockOffRampMonitor.hasAccessibilityPermission.mockReturnValue(true);

    await render(<PermissionsScreen />);
    const continueButton = await screen.findByTestId("permissions-continue");
    await waitFor(() => expect(continueButton.props.accessibilityState.disabled).toBe(false));

    await fireEvent.press(continueButton);

    expect(mockOffRampMonitor.startMonitoringService).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
