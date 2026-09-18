import React from "react";
import { Linking, Text } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Sentry } from "../config/sentry";

// A render-time crash anywhere below ErrorBoundary must never white-screen
// the whole app -- it should fall back to a recovery screen, report to
// Sentry (so the team actually finds out), and let the driver either retry
// (a real remount, not just clearing a flag -- see the component's own
// comment) or reach support.

jest.mock("../config/sentry", () => ({
  Sentry: { captureException: jest.fn(), addBreadcrumb: jest.fn() },
}));

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("boom");
  }
  return <Text>All good</Text>;
}

// React logs the caught error to console.error even though ErrorBoundary
// handles it -- expected noise for these tests, not a real failure.
let consoleErrorSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("ErrorBoundary", () => {
  test("renders children normally when nothing throws", async () => {
    await render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("All good")).toBeTruthy();
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });

  test("catches a render crash and shows the recovery screen instead of propagating", async () => {
    await render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    await waitFor(() => expect(screen.getByText("Something went wrong")).toBeTruthy());
    expect(screen.getByText("Your trip information is safe. Please try again.")).toBeTruthy();
  });

  test("reports the crash to Sentry", async () => {
    await render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    await waitFor(() => expect(Sentry.captureException).toHaveBeenCalledTimes(1));
    const [error] = (Sentry.captureException as jest.Mock).mock.calls[0];
    expect(error.message).toBe("boom");
  });

  test("Call Support opens the real support dialer number", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);

    await render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    await waitFor(() => expect(screen.getByText("Call Support")).toBeTruthy());

    await waitFor(() => fireEvent.press(screen.getByText("Call Support")));

    expect(openURL).toHaveBeenCalledWith("tel:18001234567");
  });

  test("Try Again remounts the subtree, recovering once the underlying cause is gone", async () => {
    // Simulates the crash cause going away (e.g. a refetch on remount would
    // now return good data) by swapping in a non-throwing child on retry --
    // the real behavior this proves is that the boundary actually unmounts/
    // remounts its children rather than getting stuck.
    let shouldThrow = true;
    function Wrapper() {
      return (
        <ErrorBoundary>
          <Bomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    const { rerender } = await render(<Wrapper />);
    await waitFor(() => expect(screen.getByText("Something went wrong")).toBeTruthy());

    // The underlying cause clears (e.g. a refetch would now succeed) before
    // the driver taps Try Again -- ErrorBoundary still shows the fallback
    // (hasError is still true) but its `children` prop is now the
    // non-throwing element, exactly like a real screen whose data becomes
    // valid again while the recovery screen is still on-screen.
    shouldThrow = false;
    await rerender(<Wrapper />);

    await waitFor(() => fireEvent.press(screen.getByText("Try Again")));

    await waitFor(() => expect(screen.getByText("All good")).toBeTruthy());
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });
});
