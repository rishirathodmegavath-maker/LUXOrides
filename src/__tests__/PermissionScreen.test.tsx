import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { PermissionScreen } from "../screens/permissions/PermissionScreen";
import { useAuthStore } from "../store/authStore";

// permissionsDone must only ever flip true once the wizard has genuinely
// been walked to completion (reaching past the last of the 4 steps) -- never
// merely because a screen opened, never after only some steps, and the
// persisted write must happen at that same moment, not before.

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));

jest.mock("../services/notifications/pushNotifications", () => ({
  requestNotificationPermissionAndRegister: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../storage/permissionsStorage", () => ({
  permissionsStorage: { setPermissionsDone: jest.fn().mockResolvedValue(undefined) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Location = require("expo-location");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { permissionsStorage } = require("../storage/permissionsStorage");

function renderAt(kind: "location" | "notifications" | "phoneCalls" | "camera", navigation: { replace: jest.Mock }) {
  return render(
    <PermissionScreen
      route={{ key: "Permission", name: "Permission", params: { kind } }}
      navigation={navigation as unknown as never}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
  useAuthStore.setState({ session: null, permissionsDone: false, approvalStatus: "pending" });
});

describe("PermissionScreen -- completion persistence", () => {
  test("first-time driver: permissionsDone starts false and the wizard opens on the first (location) step", async () => {
    expect(useAuthStore.getState().permissionsDone).toBe(false);

    const replace = jest.fn();
    await renderAt("location", { replace });

    expect(screen.getByText(/access this device’s location/)).toBeTruthy();
    // Merely opening the screen must never mark completion.
    expect(useAuthStore.getState().permissionsDone).toBe(false);
    expect(permissionsStorage.setPermissionsDone).not.toHaveBeenCalled();
  });

  test("partial flow (skipping only the first 2 of 4 steps) never marks or persists completion", async () => {
    const replace = jest.fn();
    await renderAt("location", { replace });

    fireEvent.press(screen.getByText("Skip for now"));
    expect(replace).toHaveBeenCalledWith("Permission", { kind: "notifications" });

    expect(useAuthStore.getState().permissionsDone).toBe(false);
    expect(permissionsStorage.setPermissionsDone).not.toHaveBeenCalled();
  });

  test("a denial on an early step advances the wizard (existing design: no single denial blocks onboarding) but does NOT yet mark completion", async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: "denied" });
    const replace = jest.fn();
    await renderAt("location", { replace });

    await act(async () => {
      fireEvent.press(screen.getByText("Allow Permission"));
    });

    expect(replace).toHaveBeenCalledWith("Permission", { kind: "notifications" });
    // Only 1 of 4 steps done -- must remain unmarked and unpersisted.
    expect(useAuthStore.getState().permissionsDone).toBe(false);
    expect(permissionsStorage.setPermissionsDone).not.toHaveBeenCalled();
  });

  test("walking every step to the end (last = camera) marks AND persists completion exactly once", async () => {
    const replace = jest.fn();
    await renderAt("camera", { replace });

    fireEvent.press(screen.getByText("Skip for now"));

    expect(replace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().permissionsDone).toBe(true);
    expect(permissionsStorage.setPermissionsDone).toHaveBeenCalledTimes(1);
  });

  test("reaching the end via an OS-level denial on the last step still completes the flow (denial ≠ abort, per existing design) and persists", async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied" });
    const replace = jest.fn();
    await renderAt("camera", { replace });

    await act(async () => {
      fireEvent.press(screen.getByText("Allow Permission"));
    });

    expect(useAuthStore.getState().permissionsDone).toBe(true);
    expect(permissionsStorage.setPermissionsDone).toHaveBeenCalledTimes(1);
  });

  test("a persistence write failure never crashes the screen and never blocks the in-memory completion", async () => {
    permissionsStorage.setPermissionsDone.mockRejectedValueOnce(new Error("Keychain unavailable"));
    const replace = jest.fn();
    await renderAt("camera", { replace });

    expect(() => fireEvent.press(screen.getByText("Skip for now"))).not.toThrow();
    expect(useAuthStore.getState().permissionsDone).toBe(true);
  });
});

describe("PermissionScreen -- decoupled from runtime GPS permission state", () => {
  test("completing the wizard never touches the independent GPS-quality store used by runtime revocation handling", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useGpsQualityStore } = require("../store/gpsQualityStore");
    useGpsQualityStore.getState().reset();
    const before = useGpsQualityStore.getState();

    const replace = jest.fn();
    await renderAt("camera", { replace });
    fireEvent.press(screen.getByText("Skip for now"));

    expect(useAuthStore.getState().permissionsDone).toBe(true);
    // Untouched: runtime revocation (LocationPermissionBanner/useGpsQuality)
    // reads live OS state through this store, never permissionsDone.
    expect(useGpsQualityStore.getState()).toEqual(before);
  });
});
