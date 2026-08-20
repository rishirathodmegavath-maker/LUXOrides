import { dutyApi } from "../../api/duty.api";
import type { AddressSnapshot, DriverDutyExpenseInput, DutySummaryForDriverDTO } from "../../api/duty.types";
import { useDutyStore } from "../../store/dutyStore";
import { MockDutyService } from "../mock/mockDuty";
import { DutyEndInput, DutyEndResult, DutyService, DutyStartInput, DutySummary, ReadinessChecklist, TripListItem } from "../types";

function money(dto: DutySummaryForDriverDTO): number | undefined {
  return dto.dutyTotal?.amount;
}

function tripStatus(status: DutySummaryForDriverDTO["status"]): TripListItem["status"] {
  if (status === "COMPLETED") return "completed";
  if (status === "CANCELLED") return "cancelled";
  return "upcoming";
}

function toTripListItem(dto: DutySummaryForDriverDTO): TripListItem {
  return {
    id: dto.dutyId,
    type: dto.vehicleName,
    clientName: dto.clientName,
    date: new Date(dto.reportingTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    status: tripStatus(dto.status),
    pickupAddress: dto.reportingLocation,
    dropoffAddress: dto.dropLocation ?? "—",
    fare: money(dto),
  };
}

function toAddressSnapshot(loc: DutyStartInput["location"]): AddressSnapshot {
  return {
    formattedAddress: loc.formattedAddress,
    latitude: loc.latitude,
    longitude: loc.longitude,
  };
}

function formatDuration(startAt: string | null, endAt: string | null): string {
  if (!startAt || !endAt) return "";
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  if (ms <= 0) return "";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} Hrs ${minutes} mins` : `${minutes} mins`;
}

function toDutySummary(dto: DutySummaryForDriverDTO): DutySummary {
  return {
    id: dto.dutyId,
    type: dto.vehicleName,
    reportTime: new Date(dto.reportingTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    // The real DTO has no live-routing figures (distance/ETA) — Phase 1
    // already treats maps/ORS as out of scope (see MapPreview), so this
    // stays a static label rather than fabricating numbers the backend
    // doesn't provide.
    durationLabel: "",
    clientName: dto.clientName,
    pickup: { label: "PICKUP", address: dto.reportingLocation, distanceKm: 0, etaMinutes: 0 },
    dropoff: { label: "DROP OFF", address: dto.dropLocation ?? "—", distanceKm: 0, etaMinutes: 0 },
  };
}

// Real backend has genuine endpoints for the duty list/detail dashboard
// (DriverAppController, /driver/app/**) — live-verified against the
// running backend. It has NO endpoint at all for pre-duty readiness,
// accept/decline persistence, or pickup-OTP, so those still delegate to
// the mock (composition, not a full rewrite) per the agreed Day-2 scope.
export class FleetovoDutyService implements DutyService {
  private mock = new MockDutyService();

  async getTodayDuty(): Promise<DutySummary | null> {
    const page = await dutyApi.getActiveDuties();
    const first = page.content[0];
    return first ? toDutySummary(first) : null;
  }

  async getTrips(): Promise<TripListItem[]> {
    const [active, history] = await Promise.all([dutyApi.getActiveDuties(), dutyApi.getDutyHistory()]);
    return [...active.content, ...history.content].map(toTripListItem);
  }

  async getTripById(id: string): Promise<TripListItem | null> {
    try {
      const dto = await dutyApi.getDuty(id);
      return toTripListItem(dto);
    } catch {
      return null;
    }
  }

  acceptDuty(dutyId: string): Promise<void> {
    return this.mock.acceptDuty(dutyId);
  }

  declineDuty(dutyId: string, reason: string): Promise<void> {
    return this.mock.declineDuty(dutyId, reason);
  }

  submitReadiness(checklist: ReadinessChecklist): Promise<void> {
    return this.mock.submitReadiness(checklist);
  }

  getReadinessStatus(): Promise<"pending" | "submitted" | "approved"> {
    return this.mock.getReadinessStatus();
  }

// Odometer photo + GPS location are mandatory on the real endpoints
  // (ExternalDriverDutyController) — a duty must already be in the
  // driver's active list (getTodayDuty/getTrips) to have a real dutyId to
  // mint a token for.
  async startDuty(input: DutyStartInput): Promise<void> {
    const todayDuty = useDutyStore.getState().todayDuty;
    if (!todayDuty) {
      throw new Error("No active duty to start.");
    }
    const { token } = await dutyApi.issueExecutionToken(todayDuty.id);
    useDutyStore.getState().setExecutionToken(token);
    await dutyApi.submitStart(
      token,
      {
        odometerKm: input.odometerKm,
        location: toAddressSnapshot(input.location),
        accuracyMeters: input.location.accuracyMeters ?? null,
        locationCapturedAt: new Date().toISOString(),
      },
      { uri: input.photoUri, name: "odometer-start.jpg", type: "image/jpeg" }
    );
  }

  verifyPickupOtp(code: string): Promise<boolean> {
    return this.mock.verifyPickupOtp(code);
  }

  markArrivedAtDropoff(): Promise<void> {
    return this.mock.markArrivedAtDropoff();
  }

  async endDuty(input: DutyEndInput): Promise<DutyEndResult> {
    const token = useDutyStore.getState().executionToken;
    if (!token) {
      throw new Error("Duty was never started — nothing to end.");
    }
    const extraCharges: DriverDutyExpenseInput[] =
      input.expenseAmount && input.expenseAmount > 0
        ? [{ type: "OTHER", amount: input.expenseAmount, description: "Additional charges" }]
        : [];
    const res = await dutyApi.submitEnd(
      token,
      {
        odometerKm: input.odometerKm,
        location: toAddressSnapshot(input.location),
        accuracyMeters: input.location.accuracyMeters ?? null,
        locationCapturedAt: new Date().toISOString(),
        extraCharges,
      },
      { uri: input.photoUri, name: "odometer-end.jpg", type: "image/jpeg" }
    );
    return {
      distanceKm: res.summary.totalKm ?? res.summary.actualDrivenKm ?? 0,
      durationLabel: formatDuration(res.summary.startAt, res.summary.endAt),
      amountToCollect: res.paymentInstruction.amount,
      qrCodeUrl: res.paymentInstruction.qrCodeUrl,
      paymentLink: res.paymentInstruction.paymentLink,
    };
  }

  async checkPaymentStatus(): Promise<{ paid: boolean; status: string }> {
    const token = useDutyStore.getState().executionToken;
    if (!token) return { paid: false, status: "NOT_CREATED" };
    const res = await dutyApi.checkQrPaymentStatus(token);
    return { paid: res.paid, status: res.status };
  }

  returnToGarage(): Promise<void> {
    return this.mock.returnToGarage();
  }

  closeDuty(): Promise<void> {
    return this.mock.closeDuty();
  }
}
