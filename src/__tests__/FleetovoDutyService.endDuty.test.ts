import { FleetovoDutyService } from "../services/real/FleetovoDutyService";
import { useDutyStore } from "../store/dutyStore";
import type { DutyEndInput } from "../services/types";

// Final Fare + Expense task -- endDuty must map every driver-entered expense
// through to the real backend contract (extraCharges + positionally-aligned
// receiptPhotos) and must never compute amountToCollect/fareBreakdown itself:
// whatever the mocked backend response says is exactly what comes back,
// proven here by making the mocked amount deliberately NOT equal to a naive
// local sum of the submitted expenses (1450 vs 1000+120+50=1170) -- if
// endDuty were ever recomputing the total client-side, this test would catch
// it returning 1170 instead of the backend's real 1450.

jest.mock("../api/duty.api", () => ({
  dutyApi: {
    submitEnd: jest.fn(),
  },
}));

jest.mock("../util/network", () => ({
  assertOnline: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dutyApi } = require("../api/duty.api");

const BACKEND_RESPONSE = {
  success: true,
  status: "COMPLETED",
  summary: {
    bookingId: "booking-1",
    dutyId: "duty-1",
    startKm: 100,
    endKm: 169,
    totalKm: 69,
    startAt: "2026-09-08T09:00:00Z",
    endAt: "2026-09-08T14:00:00Z",
    extraChargesTotal: 170,
    bookingTotal: 1450,
    amountToCollect: 1450,
    actualDrivenKm: 50,
    projectedTotalKm: 69,
    returnRoute: null,
    fareBreakdown: null,
    gstAmount: null,
    gstRatePercent: null,
  },
  paymentInstruction: {
    collectionRequired: true,
    amount: 1450,
    qrCodeUrl: "https://qr.example/1",
    paymentLink: null,
    message: null,
  },
  message: "Duty completed successfully",
};

function endInput(expenses: DutyEndInput["expenses"]): DutyEndInput {
  return {
    odometerKm: 169,
    photoUri: "file://odometer.jpg",
    location: { latitude: 1, longitude: 1, formattedAddress: "Drop" },
    expenses,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useDutyStore.setState({
    online: false,
    todayDuty: null,
    checklist: { vehicleExteriorUris: {}, vehicleInteriorUris: {} },
    readinessStatus: "pending",
    executionToken: "exec-token-1",
    dutyEndResult: null,
  });
  dutyApi.submitEnd.mockResolvedValue(BACKEND_RESPONSE);
});

describe("FleetovoDutyService.endDuty -- expense mapping", () => {
  test("maps every expense's real category, amount, and description into extraCharges", async () => {
    const service = new FleetovoDutyService();

    await service.endDuty(endInput([
      { type: "TOLL", amount: 120, description: "NH48 toll", receiptUri: "file://toll.jpg" },
      { type: "STATE_TAX", amount: 50, receiptUri: "file://tax.jpg" },
    ]));

    expect(dutyApi.submitEnd).toHaveBeenCalledTimes(1);
    const [, payload] = dutyApi.submitEnd.mock.calls[0];
    expect(payload.extraCharges).toEqual([
      { type: "TOLL", amount: 120, description: "NH48 toll" },
      { type: "STATE_TAX", amount: 50, description: null },
    ]);
  });

  test("sends receiptPhotos positionally aligned with extraCharges, one per expense", async () => {
    const service = new FleetovoDutyService();

    await service.endDuty(endInput([
      { type: "TOLL", amount: 120, receiptUri: "file://toll.jpg" },
      { type: "PARKING", amount: 40, receiptUri: "file://parking.jpg" },
    ]));

    const [, , , receiptPhotos] = dutyApi.submitEnd.mock.calls[0];
    expect(receiptPhotos).toEqual([
      { uri: "file://toll.jpg", name: "expense-receipt-1.jpg", type: "image/jpeg" },
      { uri: "file://parking.jpg", name: "expense-receipt-2.jpg", type: "image/jpeg" },
    ]);
  });

  test("with no expenses, extraCharges is empty and no receiptPhotos part is sent", async () => {
    const service = new FleetovoDutyService();

    await service.endDuty(endInput(undefined));

    const [, payload, , receiptPhotos] = dutyApi.submitEnd.mock.calls[0];
    expect(payload.extraCharges).toEqual([]);
    expect(receiptPhotos).toBeUndefined();
  });

  test("amountToCollect comes straight from the backend response, never a local re-sum of the submitted expenses", async () => {
    const service = new FleetovoDutyService();

    // A naive local sum here would be 1000 (base, not even known client-side)
    // + 120 + 50 = 170 total expenses -- nowhere near the mocked backend's
    // real 1450. If endDuty ever computed this itself instead of reading
    // paymentInstruction.amount, this assertion would fail.
    const result = await service.endDuty(endInput([
      { type: "TOLL", amount: 120, receiptUri: "file://toll.jpg" },
      { type: "STATE_TAX", amount: 50, receiptUri: "file://tax.jpg" },
    ]));

    expect(result.amountToCollect).toBe(1450);
    expect(result.qrCodeUrl).toBe("https://qr.example/1");
  });
});
