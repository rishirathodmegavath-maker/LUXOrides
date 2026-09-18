import React from "react";
import { Linking } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { LocationPermissionBanner } from "../components/LocationPermissionBanner";

// useDutyLocationReporter previously swallowed a denied/revoked location
// permission entirely -- this banner is the only place a driver mid-duty
// finds out their live position stopped reporting, so it must show exactly
// when (and only when) status is "denied", and must actually take them to
// Settings rather than just naming the problem.

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("LocationPermissionBanner", () => {
  test("renders nothing when tracking is active", async () => {
    await render(<LocationPermissionBanner status="active" />);
    expect(screen.queryByText(/Location permission is required/)).toBeNull();
  });

  test("renders nothing when foreground-only (a real, working degraded mode, not a failure)", async () => {
    await render(<LocationPermissionBanner status="foreground-only" />);
    expect(screen.queryByText(/Location permission is required/)).toBeNull();
  });

  test("renders nothing when there is no active duty", async () => {
    await render(<LocationPermissionBanner status="inactive" />);
    expect(screen.queryByText(/Location permission is required/)).toBeNull();
  });

  test("shows an actionable prompt when permission is denied", async () => {
    await render(<LocationPermissionBanner status="denied" />);
    expect(screen.getByText(/Location permission is required/)).toBeTruthy();
    expect(screen.getByText("Open Settings")).toBeTruthy();
  });

  test("tapping the banner opens the device's app settings", async () => {
    // .mockClear() defensively, in case jest.spyOn returns an
    // already-mocked function carrying call history from an earlier test
    // in this file (restoreAllMocks in beforeEach should prevent this, but
    // this guards the assertion below regardless of the root cause).
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    openSettings.mockClear();
    await render(<LocationPermissionBanner status="denied" />);

    // Direct await, not waitFor-wrapped: fireEvent.press is itself async in
    // this RNTL version, and wrapping it in waitFor's own polling can fire
    // a second overlapping press whose dangling continuation resolves late
    // enough to leak a stray call into the next test (see the quality-banner
    // test below, which found this the hard way).
    await fireEvent.press(screen.getByText("Open Settings"));

    expect(openSettings).toHaveBeenCalledTimes(1);
  });
});

describe("LocationPermissionBanner -- GPS quality", () => {
  test("a merely weak (but fresh) fix shows no banner -- not actionable, would just be alert spam", async () => {
    await render(<LocationPermissionBanner status="active" quality="weak" />);
    expect(screen.queryByText(/Location unavailable/)).toBeNull();
  });

  test("a genuinely good fix shows no banner", async () => {
    await render(<LocationPermissionBanner status="active" quality="good" />);
    expect(screen.queryByText(/Location unavailable/)).toBeNull();
  });

  test("a stale fix shows a non-panicking, actionable banner while tracking is active", async () => {
    await render(<LocationPermissionBanner status="active" quality="stale" />);
    expect(screen.getByText(/Location unavailable/)).toBeTruthy();
    expect(screen.getByText("Open Settings")).toBeTruthy();
  });

  test("an unavailable fix shows the same banner while foreground-only", async () => {
    await render(<LocationPermissionBanner status="foreground-only" quality="unavailable" />);
    expect(screen.getByText(/Location unavailable/)).toBeTruthy();
  });

  test("stale/unavailable quality is ignored while tracking isn't even running (inactive)", async () => {
    await render(<LocationPermissionBanner status="inactive" quality="stale" />);
    expect(screen.queryByText(/Location unavailable/)).toBeNull();
  });

  test("denied always wins over a quality reading, and shows the permission copy not the quality copy", async () => {
    await render(<LocationPermissionBanner status="denied" quality="stale" />);
    expect(screen.getByText(/Location permission is required/)).toBeTruthy();
    expect(screen.queryByText(/Location unavailable/)).toBeNull();
  });

  test("tapping the quality banner also opens Settings", async () => {
    // .mockClear() defensively, in case jest.spyOn returns an
    // already-mocked function carrying call history from an earlier test
    // in this file (restoreAllMocks in beforeEach should prevent this, but
    // this guards the assertion below regardless of the root cause).
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    openSettings.mockClear();
    await render(<LocationPermissionBanner status="active" quality="unavailable" />);

    // Direct await, not waitFor-wrapped: fireEvent.press is itself async in
    // this RNTL version, and wrapping it in waitFor's own polling can fire
    // a second overlapping press before the first settles (see
    // LiveChatScreen.test.tsx for the same finding).
    await fireEvent.press(screen.getByText("Open Settings"));

    expect(openSettings).toHaveBeenCalledTimes(1);
  });
});
