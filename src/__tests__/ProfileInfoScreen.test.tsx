import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ProfileInfoScreen } from "../screens/home/ProfileInfoScreen";

// Regression coverage: the onboarding data-loss fix added `email` to
// DriverDTO/DriverProfileUpdateRequest and a new getGarages() call -- neither
// should change this screen's existing (already-working) profile-edit flow,
// which predates and is independent of both.

// useFocusEffect needs a real navigation context this test renderer doesn't
// provide -- swapped for a plain useEffect, same pattern ActivityScreen's
// own test uses for the identical dependency.
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (cb: () => void) => {
      const React = jest.requireActual("react");
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === "function" ? cleanup : undefined;
      }, [cb]);
    },
  };
});

jest.mock("../api/driver.api", () => ({
  driverApi: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { driverApi } = require("../api/driver.api");

const navigate = jest.fn();
const navigation = { navigate, canGoBack: () => true } as unknown as never;

const PROFILE = {
  id: "driver-1",
  orgId: "org-1",
  clientId: null,
  clientName: null,
  name: { salutation: "Mr.", firstName: "Raja", lastName: "Kumar" },
  fatherName: null,
  gender: "MALE",
  phone: "+919876543210",
  alternatePhone: null,
  email: "raja@example.com",
  address: null,
  garageLocation: { formattedAddress: "Sector 62, Noida", googlePlaceId: null, latitude: null, longitude: null },
  experienceYears: 5,
  adharNumber: null,
  licenseNumber: null,
  pic: null,
  ownership: "ORG",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  createdBy: null,
  updatedBy: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  driverApi.getProfile.mockResolvedValue(PROFILE);
  driverApi.updateProfile.mockResolvedValue(PROFILE);
});

describe("ProfileInfoScreen", () => {
  test("loads and displays the real profile, including email, garage and experience", async () => {
    await render(<ProfileInfoScreen navigation={navigation} route={undefined as never} />);

    expect(await screen.findByDisplayValue("Raja")).toBeTruthy();
    expect(screen.getByDisplayValue("Kumar")).toBeTruthy();
    expect(screen.getByDisplayValue("raja@example.com")).toBeTruthy();
    expect(screen.getByDisplayValue("Sector 62, Noida")).toBeTruthy();
    expect(screen.getByDisplayValue("5")).toBeTruthy();
  });

  test("editing and saving still calls the real updateProfile endpoint", async () => {
    await render(<ProfileInfoScreen navigation={navigation} route={undefined as never} />);
    await screen.findByDisplayValue("Raja");

    await waitFor(() => fireEvent.press(screen.getByLabelText("Edit profile")));
    await waitFor(() => fireEvent.changeText(screen.getByDisplayValue("Raja"), "Rajesh"));
    await waitFor(() => fireEvent.press(screen.getByText("Save")));

    await waitFor(() => expect(driverApi.updateProfile).toHaveBeenCalledTimes(1));
    const [payload] = driverApi.updateProfile.mock.calls[0];
    expect(payload.name).toEqual({ salutation: "Mr.", firstName: "Rajesh", lastName: "Kumar" });
    expect(payload.email).toBe("raja@example.com");
    expect(payload.garageLocation.formattedAddress).toBe("Sector 62, Noida");
    expect(payload.experienceYears).toBe(5);
  });

  test("a load failure shows a retry banner instead of a blank/broken screen", async () => {
    driverApi.getProfile.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<ProfileInfoScreen navigation={navigation} route={undefined as never} />);

    expect(await screen.findByText("Couldn't load your profile.")).toBeTruthy();
  });
});
