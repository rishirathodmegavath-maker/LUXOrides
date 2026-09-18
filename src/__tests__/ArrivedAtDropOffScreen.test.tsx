import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ArrivedAtDropOffScreen } from "../screens/duty/ArrivedAtDropOffScreen";

// Reliability hardening: markArrivedAtDropoff previously had no catch --
// a failure left `loading` true forever with no error and no retry path.

jest.mock("../services", () => ({
  dutyService: {
    markArrivedAtDropoff: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");

const navigate = jest.fn();
const navigation = { navigate } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

describe("ArrivedAtDropOffScreen", () => {
  test("success navigates to DropOff and never alerts", async () => {
    dutyService.markArrivedAtDropoff.mockResolvedValue(undefined);

    await render(<ArrivedAtDropOffScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => fireEvent.press(screen.getByText("Continue")));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("DropOff"));
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  test("failure shows an alert, resets loading, and never navigates", async () => {
    dutyService.markArrivedAtDropoff.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<ArrivedAtDropOffScreen navigation={navigation} route={undefined as never} />);
    await waitFor(() => fireEvent.press(screen.getByText("Continue")));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't continue", "Network request failed"));
    expect(navigate).not.toHaveBeenCalled();

    // Loading reset -> the button is tappable again and a retry can succeed.
    dutyService.markArrivedAtDropoff.mockResolvedValueOnce(undefined);
    await waitFor(() => fireEvent.press(screen.getByText("Continue")));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("DropOff"));
    expect(dutyService.markArrivedAtDropoff).toHaveBeenCalledTimes(2);
  });
});
