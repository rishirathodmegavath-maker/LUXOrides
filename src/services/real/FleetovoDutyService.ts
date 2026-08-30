import { dutyApi } from "../../api/duty.api";
import type { AddressSnapshot, DriverDutyExpenseInput, DutySummaryForDriverDTO, PackageFareBreakdown } from "../../api/duty.types";
import type { FilePart } from "../../api/client";
import { dutyStorage } from "../../storage/dutyStorage";
import { assertOnline } from "../../util/network";
import { useDutyStore } from "../../store/dutyStore";
import { MockDutyService } from "../mock/mockDuty";
import { DutyEndInput, DutyEndResult, DutyLegRoute, DutyLocationInput, DutyRouteLeg, DutyService, DutyStartInput, DutySummary, FareBreakdown, IncidentReportInput, ReadinessChecklist, TripListItem } from "../types";

function money(dto: DutySummaryForDriverDTO): number | undefined {
  return dto.dutyTotal?.amount;
}

function tripStatus(status: DutySummaryForDriverDTO["status"]): TripListItem["status"] {
  if (status === "COMPLETED") return "completed";
  if (status === "CANCELLED") return "cancelled";
  return "upcoming";
}

function toFareBreakdown(dto: PackageFareBreakdown | null): FareBreakdown | null {
  if (!dto) return null;
  return {
    dutyTypeLabel: dto.dutyType,
    packageUnit: dto.packageUnit,
    includedDistanceKm: dto.includedDistanceKm,
    includedTimeUnits: dto.includedTimeUnits,
    baseFareAmount: dto.baseFareAmount,
    extraDistanceKm: dto.extraDistanceKm,
    extraDistanceRatePerKm: dto.extraDistanceRatePerKm,
    extraDistanceCharge: dto.extraDistanceCharge,
    extraTimeHours: dto.extraTimeHours,
    extraTimeRatePerHour: dto.extraTimeRatePerHour,
    extraTimeCharge: dto.extraTimeCharge,
    projectedTotalDurationSeconds: dto.projectedTotalDurationSeconds,
  };
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

export function toDutySummary(dto: DutySummaryForDriverDTO): DutySummary {
  return {
    id: dto.dutyId,
    type: dto.vehicleName,
    reportTime: new Date(dto.reportingTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    // The real DTO has no live-routing figures (distance/ETA) for the
    // pickup/drop legs — only the drop->garage return leg (computed at duty
    // end) carries real distance/route data. Leaving this blank rather than
    // fabricating a duration the backend doesn't provide.
    durationLabel: "",
    clientName: dto.clientName,
    clientPhone: dto.clientPhone,
    pickup: { label: "PICKUP", address: dto.reportingLocation, distanceKm: null, etaMinutes: null },
    dropoff: { label: "DROP OFF", address: dto.dropLocation ?? "—", distanceKm: null, etaMinutes: null },
  };
}

// Phase 1: accept/decline, pickup OTP, return-to-garage, and close-duty are
// all now real, backend-authoritative calls (DriverAppController /
// ExternalDriverDutyController) — only pre-duty readiness-status polling
// (unused by the UI, submitReadiness itself is already real) and pickup-OTP
// verification's UI plumbing still route through the mock's shape.
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

  async acceptDuty(dutyId: string): Promise<void> {
    await assertOnline();
    await dutyApi.acceptDuty(dutyId);
  }

  async declineDuty(dutyId: string, reason: string): Promise<void> {
    await assertOnline();
    await dutyApi.declineDuty(dutyId, { reason });
  }

  // Structured inspection submission (VehicleInspectionService,
  // /driver/app/duties/{dutyId}/inspection) -- the backend independently
  // enforces every condition rating, driverConfirmed, and all 8 photos, so
  // this client-side check is a fast-fail, not the actual authority.
  // readinessStatus itself stays driven by the mock (see submitReadiness's
  // own store update in DutyReadinessSubmitScreen) -- there's no backend
  // concept of an approval workflow for it yet.
  async submitReadiness(checklist: ReadinessChecklist): Promise<void> {
    await assertOnline();
    const todayDuty = useDutyStore.getState().todayDuty;
    if (!todayDuty) {
      throw new Error("No active duty to submit readiness for.");
    }
    if (
      !checklist.exteriorCondition ||
      !checklist.interiorCondition ||
      !checklist.cleanliness ||
      !checklist.tyreCondition ||
      !checklist.lightsCondition ||
      !checklist.driverConfirmed
    ) {
      throw new Error("All condition ratings and driver confirmation are required.");
    }

    const exteriorFieldByAngle: Record<string, string> = {
      Front: "exteriorFront",
      Back: "exteriorBack",
      "Left Side": "exteriorLeft",
      "Right Side": "exteriorRight",
    };
    const interiorFieldByAngle: Record<string, string> = {
      Dashboard: "interiorDashboard",
      "Front Seats": "interiorFrontSeats",
      "Back Seats": "interiorBackSeats",
      "Boot Space": "interiorBootSpace",
    };

    const photos: Record<string, FilePart> = {};
    for (const [angle, uri] of Object.entries(checklist.vehicleExteriorUris)) {
      const field = exteriorFieldByAngle[angle];
      if (field && uri) {
        photos[field] = { uri, name: `${field}.jpg`, type: "image/jpeg" };
      }
    }
    for (const [angle, uri] of Object.entries(checklist.vehicleInteriorUris)) {
      const field = interiorFieldByAngle[angle];
      if (field && uri) {
        photos[field] = { uri, name: `${field}.jpg`, type: "image/jpeg" };
      }
    }

    await dutyApi.submitInspection(
      todayDuty.id,
      {
        exteriorCondition: checklist.exteriorCondition,
        interiorCondition: checklist.interiorCondition,
        damageNotes: checklist.damageNotes ?? null,
        cleanliness: checklist.cleanliness,
        tyreCondition: checklist.tyreCondition,
        lightsCondition: checklist.lightsCondition,
        fuelLevel: checklist.fuelLevel ?? null,
        driverConfirmed: checklist.driverConfirmed,
      },
      photos
    );
  }

  getReadinessStatus(): Promise<"pending" | "submitted" | "approved"> {
    return this.mock.getReadinessStatus();
  }

// Odometer photo + GPS location are mandatory on the real endpoints
  // (ExternalDriverDutyController) — a duty must already be in the
  // driver's active list (getTodayDuty/getTrips) to have a real dutyId to
  // mint a token for.
  async startDuty(input: DutyStartInput): Promise<void> {
    await assertOnline();
    const todayDuty = useDutyStore.getState().todayDuty;
    if (!todayDuty) {
      throw new Error("No active duty to start.");
    }
    const { token } = await dutyApi.issueExecutionToken(todayDuty.id);
    useDutyStore.getState().setExecutionToken(token);
    // Persist before the actual /start call so a restart between minting
    // the token and the start call succeeding can still reconcile — worst
    // case reconcileActiveDuty finds the duty not yet started server-side
    // and drops the stale reference (see its own comment).
    await dutyStorage.setActiveDuty({ dutyId: todayDuty.id, executionToken: token });
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

  async requestPickupOtp(): Promise<void> {
    const token = useDutyStore.getState().executionToken;
    if (!token) {
      throw new Error("No active duty — pickup OTP requires a started duty.");
    }
    await dutyApi.generatePickupOtp(token);
  }

  async verifyPickupOtp(code: string): Promise<void> {
    await assertOnline();
    const token = useDutyStore.getState().executionToken;
    if (!token) {
      throw new Error("No active duty — pickup OTP requires a started duty.");
    }
    await dutyApi.verifyPickupOtp(token, { otp: code });
  }

  markArrivedAtDropoff(): Promise<void> {
    return this.mock.markArrivedAtDropoff();
  }

  async endDuty(input: DutyEndInput): Promise<DutyEndResult> {
    await assertOnline();
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
    const route = res.summary.returnRoute;
    return {
      distanceKm: res.summary.totalKm ?? res.summary.actualDrivenKm ?? 0,
      durationLabel: formatDuration(res.summary.startAt, res.summary.endAt),
      amountToCollect: res.paymentInstruction.amount,
      qrCodeUrl: res.paymentInstruction.qrCodeUrl,
      paymentLink: res.paymentInstruction.paymentLink,
      returnRoute: route
        ? {
            distanceKm: route.distanceKm,
            durationSeconds: route.durationSeconds,
            routeAvailable: route.routeAvailable,
            dropLocation: route.dropLocation,
            garageLocation: route.garageLocation,
            geometry: route.geometry,
          }
        : null,
      actualDrivenKm: res.summary.actualDrivenKm,
      projectedTotalKm: res.summary.projectedTotalKm,
      expensesTotal: res.summary.extraChargesTotal,
      fareBreakdown: toFareBreakdown(res.summary.fareBreakdown),
      gstAmount: res.summary.gstAmount,
      gstRatePercent: res.summary.gstRatePercent,
    };
  }

  async checkPaymentStatus(): Promise<{ paid: boolean; status: string; amount: number | null; qrImageUrl: string | null }> {
    const token = useDutyStore.getState().executionToken;
    if (!token) return { paid: false, status: "NOT_CREATED", amount: null, qrImageUrl: null };
    const res = await dutyApi.checkQrPaymentStatus(token);
    // amount/qrImageUrl let PaymentQrScreen render correctly even when it's
    // reached via reconcileActiveDuty's resume path, where no dutyEndResult
    // exists in the store (only the execution token was restored) — this
    // endpoint is the one place that still has them after a restart.
    return { paid: res.paid, status: res.status, amount: res.amount, qrImageUrl: res.qrImageUrl };
  }

  async returnToGarage(location?: DutyLocationInput | null): Promise<void> {
    await assertOnline();
    const token = useDutyStore.getState().executionToken;
    if (!token) {
      throw new Error("No active duty — return-to-garage requires a completed duty.");
    }
    await dutyApi.confirmGarageReturn(
      token,
      location
        ? {
            location: toAddressSnapshot(location),
            accuracyMeters: location.accuracyMeters ?? null,
            locationCapturedAt: new Date().toISOString(),
          }
        : null
    );
  }

  async closeDuty(): Promise<void> {
    await assertOnline();
    const token = useDutyStore.getState().executionToken;
    if (!token) {
      throw new Error("No active duty — close-duty requires a completed duty.");
    }
    await dutyApi.closeDuty(token);
  }

  async triggerSos(location: { latitude: number; longitude: number } | null, notes?: string): Promise<void> {
    await assertOnline();
    const token = useDutyStore.getState().executionToken;
    if (!token) {
      throw new Error("No active duty — SOS requires a started duty.");
    }
    await dutyApi.submitSos(token, {
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      capturedAt: new Date().toISOString(),
      notes: notes ?? null,
    });
  }

  async submitIncident(input: IncidentReportInput): Promise<void> {
    await assertOnline();
    const token = useDutyStore.getState().executionToken;
    if (!token) {
      throw new Error("No active duty — incident reporting requires a started duty.");
    }
    const photos: FilePart[] = input.photoUris.map((uri, index) => ({
      uri,
      name: `incident-${index + 1}.jpg`,
      type: "image/jpeg",
    }));
    await dutyApi.submitIncident(
      token,
      {
        category: input.category,
        description: input.description,
        location: toAddressSnapshot(input.location),
        submittedAt: new Date().toISOString(),
      },
      photos
    );
  }

  async getRouteForLeg(leg: DutyRouteLeg): Promise<DutyLegRoute> {
    const token = useDutyStore.getState().executionToken;
    if (!token) {
      return { available: false, distanceKm: null, durationSeconds: null, routeAvailable: false, fromLocation: null, toLocation: null, geometry: null };
    }
    const res = await dutyApi.getRouteForLeg(token, leg);
    return {
      available: res.available,
      distanceKm: res.distanceKm,
      durationSeconds: res.durationSeconds,
      routeAvailable: res.routeAvailable,
      fromLocation: res.fromLocation,
      toLocation: res.toLocation,
      geometry: res.geometry,
    };
  }
}
