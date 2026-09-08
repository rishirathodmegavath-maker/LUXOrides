import React from "react";
import { render, screen } from "@testing-library/react-native";
import { DutyCompletionSlipScreen } from "../screens/duty/DutyCompletionSlipScreen";
import { useDutyStore } from "../store/dutyStore";
import type { DutySummary } from "../services/types";

// P1 live-bug coverage: the client name shown on the completion slip must
// come from the real duty in progress, never a hardcoded placeholder.

const navigation = { navigate: jest.fn(), goBack: jest.fn() } as unknown as never;

function renderScreen() {
  return render(<DutyCompletionSlipScreen navigation={navigation} route={undefined as never} />);
}

function baseDuty(overrides: Partial<DutySummary> = {}): DutySummary {
  return {
    id: "duty-1",
    type: "AIRPORT TRANSFER",
    reportTime: "09:30 AM",
    durationLabel: "",
    pickup: { label: "PICKUP", address: "Somewhere", distanceKm: null, etaMinutes: null },
    dropoff: { label: "DROP OFF", address: "Elsewhere", distanceKm: null, etaMinutes: null },
    clientName: "Priya Nair",
    clientPhone: "+919876543210",
    driverAcceptedAt: "2026-09-08T09:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  useDutyStore.setState({
    online: false,
    todayDuty: null,
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    readinessStatus: "pending",
    executionToken: null,
    dutyEndResult: null,
  });
});

describe("DutyCompletionSlipScreen", () => {
  test("shows the real client name from the active duty, never the old hardcoded placeholder", async () => {
    useDutyStore.setState({ todayDuty: baseDuty({ clientName: "Priya Nair" }) });

    await renderScreen();

    expect(screen.getByText("Priya Nair")).toBeTruthy();
    expect(screen.queryByText("Aditya Sharma")).toBeNull();
  });

  test("falls back to a truthful placeholder when no client name is available, never fabricating one", async () => {
    useDutyStore.setState({ todayDuty: null });

    await renderScreen();

    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.queryByText("Aditya Sharma")).toBeNull();
  });
});
