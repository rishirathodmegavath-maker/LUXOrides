import React from "react";
import { Linking } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { UpdateRequiredScreen } from "../screens/UpdateRequiredScreen";

// EXPO_PUBLIC_ANDROID_STORE_URL/EXPO_PUBLIC_IOS_STORE_URL are read once at
// module-load time (see UpdateRequiredScreen.tsx), like every other
// EXPO_PUBLIC_* var in this codebase (env.test.ts, client.getCoalescing.test.ts)
// -- this test's .env has neither set, so STORE_URL is genuinely undefined
// for the whole file, matching this app's real pre-launch state (no store
// listing exists yet).

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("UpdateRequiredScreen", () => {
  test("shows the latest version in the message when known", async () => {
    await render(<UpdateRequiredScreen latestVersion="1.5.0" />);
    expect(screen.getByText(/1\.5\.0/)).toBeTruthy();
  });

  test("falls back to generic copy when the latest version isn't known yet", async () => {
    await render(<UpdateRequiredScreen latestVersion={null} />);
    expect(screen.getByText("Update Required")).toBeTruthy();
  });

  test("never renders 'Update Now' to a fabricated/placeholder store link when no store URL is configured", async () => {
    await render(<UpdateRequiredScreen latestVersion="1.5.0" />);
    expect(screen.queryByText("Update Now")).toBeNull();
  });

  test("Call Support always remains available -- the driver is never fully stuck", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await render(<UpdateRequiredScreen latestVersion="1.5.0" />);

    await fireEvent.press(screen.getByText("Call Support"));

    expect(openURL).toHaveBeenCalledTimes(1);
  });
});
