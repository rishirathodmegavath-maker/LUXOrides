import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { GarageLocationScreen } from "../screens/onboarding/GarageLocationScreen";
import { useOnboardingStore } from "../store/onboardingStore";

// Onboarding data-loss fix: this screen previously showed 3 hardcoded fake
// garage names and saved the selection nowhere real. It now loads real
// options from the backend and persists through the real profile-update
// path -- these tests lock in the loading/empty/error states that real data
// requires but a hardcoded list never needed.

const GARAGE_OPTIONS = [
  { id: "garage-1", garageName: "Noida", garageAddress: "Sector 62, Noida" },
  { id: "garage-2", garageName: "Gurugram", garageAddress: "Cyber Hub, Gurugram" },
];

jest.mock("../services", () => ({
  onboardingService: {
    getGarageOptions: jest.fn(),
    saveGarageLocation: jest.fn(),
  },
}));

// The real Dropdown drives an Animated `Modal` transition this test
// environment can't reliably exercise (see DropOffScreen.test.tsx) --
// swapped for a trivial stand-in exposing plain, always-visible Pressables.
jest.mock("../components", () => {
  const actual = jest.requireActual("../components");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require("react-native");
  return {
    ...actual,
    Dropdown: ({
      value,
      options,
      onChange,
      placeholder,
    }: {
      value: string | null;
      options: { label: string; value: string }[];
      onChange: (v: string) => void;
      placeholder?: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, value ? options.find((o: { value: string }) => o.value === value)?.label : placeholder),
        ...options.map((opt: { label: string; value: string }) =>
          React.createElement(
            Pressable,
            { key: opt.value, onPress: () => onChange(opt.value), accessibilityRole: "button" },
            React.createElement(Text, null, `Choose ${opt.label}`)
          )
        )
      ),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { onboardingService } = require("../services");

const navigate = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, goBack } as unknown as never;

async function renderScreen() {
  return render(<GarageLocationScreen navigation={navigation} route={undefined as never} />);
}

async function chooseGarageAndContinue() {
  await waitFor(() => fireEvent.press(screen.getByText("Choose Noida")));
  await waitFor(() => fireEvent.press(screen.getByText("Continue")));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  useOnboardingStore.setState({ garageDone: false, photoDone: false, garageName: null });
});

describe("GarageLocationScreen", () => {
  test("shows a loading state, then the real garage options -- never the old fake names", async () => {
    let resolveGarages!: (v: typeof GARAGE_OPTIONS) => void;
    onboardingService.getGarageOptions.mockReturnValue(new Promise((resolve) => (resolveGarages = resolve)));

    await renderScreen();

    expect(screen.getByText("Loading garages…")).toBeTruthy();

    await waitFor(() => resolveGarages(GARAGE_OPTIONS));

    expect(await screen.findByText("Choose Noida")).toBeTruthy();
    expect(screen.getByText("Choose Gurugram")).toBeTruthy();
    expect(screen.queryByText(/Garage Inc\./)).toBeNull();
  });

  test("selecting a real garage and continuing persists it and marks onboarding progress", async () => {
    onboardingService.getGarageOptions.mockResolvedValue(GARAGE_OPTIONS);
    onboardingService.saveGarageLocation.mockResolvedValue(undefined);

    await renderScreen();
    await chooseGarageAndContinue();

    expect(onboardingService.saveGarageLocation).toHaveBeenCalledWith({
      garageName: "Noida",
      garageAddress: "Sector 62, Noida",
    });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("OnboardingHub"));
    expect(useOnboardingStore.getState().garageDone).toBe(true);
    expect(useOnboardingStore.getState().garageName).toBe("Noida");
  });

  test("a save failure alerts the driver, resets saving, and keeps the selection for retry", async () => {
    onboardingService.getGarageOptions.mockResolvedValue(GARAGE_OPTIONS);
    onboardingService.saveGarageLocation.mockRejectedValueOnce(new Error("Network request failed"));

    await renderScreen();
    await chooseGarageAndContinue();

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't save", "Network request failed"));
    expect(navigate).not.toHaveBeenCalled();

    onboardingService.saveGarageLocation.mockResolvedValueOnce(undefined);
    await waitFor(() => fireEvent.press(screen.getByText("Continue")));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("OnboardingHub"));
    expect(onboardingService.saveGarageLocation).toHaveBeenCalledTimes(2);
  });

  test("an empty garage list shows a real explanation instead of a picker or fake options", async () => {
    onboardingService.getGarageOptions.mockResolvedValue([]);

    await renderScreen();

    expect(await screen.findByText(/No garages have been set up/)).toBeTruthy();
    expect(screen.queryByText("Choose Noida")).toBeNull();
  });

  test("a load failure shows a retry banner, and retry re-fetches", async () => {
    onboardingService.getGarageOptions.mockRejectedValueOnce(new Error("Network request failed"));

    await renderScreen();

    expect(await screen.findByText("Couldn't load garages.")).toBeTruthy();

    onboardingService.getGarageOptions.mockResolvedValueOnce(GARAGE_OPTIONS);
    await waitFor(() => fireEvent.press(screen.getByLabelText("Retry")));

    expect(await screen.findByText("Choose Noida")).toBeTruthy();
    expect(onboardingService.getGarageOptions).toHaveBeenCalledTimes(2);
  });
});
