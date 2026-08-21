import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

const mockReplace = jest.fn();
let mockParams: { duration?: string; message?: string } = {};

jest.mock("expo-router", () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  useLocalSearchParams: () => mockParams,
}));

import BreakScreen from "../BreakScreen";

describe("BreakScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockParams = { duration: "3", message: "Custom reflection message" };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the custom message and starts the countdown from the requested duration", async () => {
    await render(<BreakScreen />);
    expect(screen.getByText("Custom reflection message")).toBeTruthy();
    expect(screen.getByTestId("break-countdown").props.children).toBe("0:03");
  });

  it("disables the return button while the countdown is still running", async () => {
    await render(<BreakScreen />);
    const button = screen.getByTestId("break-return-button");
    expect(button.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(button);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not auto-navigate away when the countdown reaches zero", async () => {
    await render(<BreakScreen />);
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });
    }
    expect(screen.getByTestId("break-countdown").props.children).toBe("0:00");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("enables the return button once the countdown reaches zero and requires an explicit tap", async () => {
    await render(<BreakScreen />);
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });
    }

    const button = screen.getByTestId("break-return-button");
    expect(button.props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(button);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("falls back to a default duration and message when deep-link params are missing", async () => {
    mockParams = {};
    await render(<BreakScreen />);
    expect(screen.getByTestId("break-countdown").props.children).toBe("0:30");
    expect(screen.getByText(/Time to take a break/)).toBeTruthy();
  });
});
