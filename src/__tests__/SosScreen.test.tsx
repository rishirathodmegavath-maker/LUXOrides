import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SosScreen } from "../screens/duty/SosScreen";

// Driver App audit priority coverage: SOS is a real, backend-persisted
// alert (DriverDutySosService via dutyService.triggerSos) for a future ops
// screen to act on -- not a phone call or any local-only action. GPS is
// best-effort: the alert must still send without a coordinate.

jest.mock("../services", () => ({
  dutyService: {
    triggerSos: jest.fn(),
  },
}));

jest.mock("../util/location", () => ({
  captureCurrentLocation: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyService } = require("../services");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { captureCurrentLocation } = require("../util/location");

const navigation = { goBack: jest.fn() } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SosScreen", () => {
  test("sends the real SOS alert with the driver's current coordinates", async () => {
    captureCurrentLocation.mockResolvedValue({ latitude: 28.6, longitude: 77.2 });
    dutyService.triggerSos.mockResolvedValue(undefined);

    await render(<SosScreen navigation={navigation} route={undefined as never} />);
    fireEvent.press(screen.getByText("Send SOS"));

    await waitFor(() =>
      expect(dutyService.triggerSos).toHaveBeenCalledWith({ latitude: 28.6, longitude: 77.2 })
    );
    expect(await screen.findByText("Help is on the way")).toBeTruthy();
  });

  test("still sends the alert (with a null coordinate) when GPS is unavailable -- never blocks on location", async () => {
    captureCurrentLocation.mockRejectedValue(new Error("Location permission denied"));
    dutyService.triggerSos.mockResolvedValue(undefined);

    await render(<SosScreen navigation={navigation} route={undefined as never} />);
    fireEvent.press(screen.getByText("Send SOS"));

    await waitFor(() => expect(dutyService.triggerSos).toHaveBeenCalledWith(null));
    expect(await screen.findByText("Help is on the way")).toBeTruthy();
  });

  test("a real backend failure shows an error and lets the driver retry -- never a silent fake success", async () => {
    captureCurrentLocation.mockResolvedValue({ latitude: 28.6, longitude: 77.2 });
    dutyService.triggerSos.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<SosScreen navigation={navigation} route={undefined as never} />);
    fireEvent.press(screen.getByText("Send SOS"));

    expect(await screen.findByText("Couldn't send SOS. Please try again or call for help directly.")).toBeTruthy();
    expect(screen.queryByText("Help is on the way")).toBeNull();

    dutyService.triggerSos.mockResolvedValueOnce(undefined);
    fireEvent.press(screen.getByText("Send SOS"));

    expect(await screen.findByText("Help is on the way")).toBeTruthy();
    expect(dutyService.triggerSos).toHaveBeenCalledTimes(2);
  });
});
