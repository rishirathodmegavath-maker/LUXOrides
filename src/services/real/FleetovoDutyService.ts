import { dutyApi } from "../../api/duty.api";
import type { DutySummaryForDriverDTO } from "../../api/duty.types";
import { MockDutyService } from "../mock/mockDuty";
import { DutyService, DutySummary, ReadinessChecklist, TripListItem } from "../types";

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

  startDuty(): Promise<void> {
    return this.mock.startDuty();
  }

  verifyPickupOtp(code: string): Promise<boolean> {
    return this.mock.verifyPickupOtp(code);
  }

  markArrivedAtDropoff(): Promise<void> {
    return this.mock.markArrivedAtDropoff();
  }

  getTripSummary(): Promise<{ distanceKm: number; durationLabel: string }> {
    return this.mock.getTripSummary();
  }

  returnToGarage(): Promise<void> {
    return this.mock.returnToGarage();
  }

  closeDuty(): Promise<void> {
    return this.mock.closeDuty();
  }
}
