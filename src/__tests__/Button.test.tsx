import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Button } from "../components/Button";

// Accessibility hardening: Button previously had no accessibilityRole/Label
// at all, and while loading swapped its Text child for a bare
// ActivityIndicator -- a screen reader had no name for the button at
// exactly the moment a driver most needs confirmation their tap registered.

describe("Button -- accessibility", () => {
  test("exposes accessibilityRole=button and the label as its accessible name", async () => {
    await render(<Button label="Continue" onPress={() => {}} />);

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeTruthy();
  });

  test("keeps the label as its accessible name even while loading (label text itself is replaced by a spinner)", async () => {
    await render(<Button label="Submitting…" onPress={() => {}} loading />);

    expect(screen.getByLabelText("Submitting…")).toBeTruthy();
    // The visible Text child is genuinely gone -- only the accessible name survives.
    expect(screen.queryByText("Submitting…")).toBeNull();
  });

  test("marks accessibilityState.busy while loading, distinct from disabled", async () => {
    await render(<Button label="Save" onPress={() => {}} loading />);

    const button = screen.getByLabelText("Save");
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  test("marks accessibilityState.disabled without busy when explicitly disabled (not loading)", async () => {
    await render(<Button label="Save" onPress={() => {}} disabled />);

    const button = screen.getByLabelText("Save");
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false });
  });

  test("neither disabled nor busy in the normal enabled state", async () => {
    await render(<Button label="Save" onPress={() => {}} />);

    const button = screen.getByLabelText("Save");
    expect(button.props.accessibilityState).toEqual({ disabled: false, busy: false });
  });
});
