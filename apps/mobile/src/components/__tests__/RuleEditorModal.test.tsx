import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Rule, Schedule, Target } from "@off-ramp/core";

import { RuleEditorModal } from "../RuleEditorModal";

const rule: Rule = {
  id: "rule-1",
  allowedMinutes: 15,
  interruptionSeconds: 30,
  message: "Take a break!",
  targetIds: [],
  scheduleId: "sched-1",
  enabled: true,
};

const schedule: Schedule = {
  id: "sched-1",
  name: "Custom",
  activeDays: [1, 2, 3, 4, 5],
  startTime: "09:00",
  endTime: "17:00",
  enabled: true,
};

const targets: Target[] = [
  { id: "target-a", name: "Instagram", identifier: "com.instagram.android", type: "app" },
];

async function renderModal(onSave: jest.Mock, isCreating = true) {
  await render(
    <RuleEditorModal
      visible
      isCreating={isCreating}
      initialRule={rule}
      initialSchedule={schedule}
      targets={targets}
      onCancel={jest.fn()}
      onSave={onSave}
    />
  );
}

describe("RuleEditorModal", () => {
  it("rejects a non-numeric allowed-minutes value without calling onSave", async () => {
    const onSave = jest.fn();
    await renderModal(onSave);

    await fireEvent.changeText(screen.getByTestId("rule-allowed-minutes-input"), "not-a-number");
    await fireEvent.press(screen.getByTestId("rule-save-button"));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/must be a positive number of minutes/)).toBeTruthy();
  });

  it("rejects a malformed start time", async () => {
    const onSave = jest.fn();
    await renderModal(onSave);

    await fireEvent.changeText(screen.getByTestId("rule-start-time-input"), "9am");
    await fireEvent.press(screen.getByTestId("rule-save-button"));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/24-hour HH:mm format/)).toBeTruthy();
  });

  it("requires at least one active day", async () => {
    const onSave = jest.fn();
    await renderModal(onSave);

    // schedule starts with Mon-Fri active; deselect all five.
    for (const day of [1, 2, 3, 4, 5]) {
      await fireEvent.press(screen.getByTestId(`rule-day-${day}`));
    }
    await fireEvent.press(screen.getByTestId("rule-save-button"));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/Select at least one active day/)).toBeTruthy();
  });

  it("tags a same-named app and website target so they are never ambiguous", async () => {
    const duplicateNamedTargets: Target[] = [
      { id: "target-yt-app", name: "YouTube", identifier: "com.google.android.youtube", type: "app" },
      { id: "target-yt-site", name: "YouTube", identifier: "youtube.com", type: "website" },
    ];

    await render(
      <RuleEditorModal
        visible
        isCreating
        initialRule={rule}
        initialSchedule={schedule}
        targets={duplicateNamedTargets}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(screen.getAllByText("YouTube")).toHaveLength(2);
    expect(screen.getByText("APP")).toBeTruthy();
    expect(screen.getByText("SITE")).toBeTruthy();
  });

  it("saves the rule and schedule with edited values and selected targets", async () => {
    const onSave = jest.fn();
    await renderModal(onSave, false);

    await fireEvent.changeText(screen.getByTestId("rule-allowed-minutes-input"), "20");
    await fireEvent.press(screen.getByText("Instagram"));
    await fireEvent.press(screen.getByTestId("rule-save-button"));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rule-1", allowedMinutes: 20, targetIds: ["target-a"] }),
      expect.objectContaining({ id: "sched-1", startTime: "09:00", endTime: "17:00" })
    );
  });
});
