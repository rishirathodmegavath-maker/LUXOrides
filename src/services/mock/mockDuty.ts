import { DutyService, DutySummary, ReadinessChecklist, TripListItem } from "../types";
import { delay } from "./utils";

const TRIPS: TripListItem[] = [
  {
    id: "duty_1001",
    type: "Airport Transfer",
    clientName: "Aditya Sharma",
    date: "Today, 09:30 AM",
    status: "upcoming",
    pickupAddress: "The Leela Palace, Diplomatic Enclave, Chanakyapuri, Delhi",
    dropoffAddress: "Indira Gandhi International Airport, Terminal 3",
    fare: 23747.5,
  },
  {
    id: "duty_0998",
    type: "City Transfer",
    clientName: "Neha Kapoor",
    date: "Yesterday, 06:15 PM",
    status: "completed",
    pickupAddress: "Cyber Hub, Gurugram",
    dropoffAddress: "DLF Emporio, Vasant Kunj",
    fare: 4200,
  },
  {
    id: "duty_0991",
    type: "Outstation",
    clientName: "Rohan Mehta",
    date: "12 May, 07:00 AM",
    status: "completed",
    pickupAddress: "Garage Inc., New Delhi",
    dropoffAddress: "Taj Mahal, Agra",
    fare: 15800,
  },
  {
    id: "duty_0980",
    type: "Airport Transfer",
    clientName: "Priya Nair",
    date: "8 May, 11:00 PM",
    status: "cancelled",
    pickupAddress: "IGI Airport, Terminal 2",
    dropoffAddress: "Connaught Place, Delhi",
  },
];

const TODAY_DUTY: DutySummary = {
  id: "duty_1001",
  type: "AIRPORT TRANSFER",
  reportTime: "09:30 AM",
  durationLabel: "4Hours/ 40Kms",
  clientName: "Aditya Sharma",
  pickup: {
    label: "PICKUP",
    address: "The Leela Palace, Diplomatic Enclave, Chanakyapuri, Delhi- 110023",
    distanceKm: 15,
    etaMinutes: 30,
  },
  dropoff: {
    label: "DROP OFF",
    address: "Indira Gandhi International Airport Terminal 3, Gate 4, Delhi 110037",
    distanceKm: 26,
    etaMinutes: 96,
  },
};

export class MockDutyService implements DutyService {
  private readiness: "pending" | "submitted" | "approved" = "pending";

  async getTodayDuty(): Promise<DutySummary | null> {
    return delay(TODAY_DUTY, 500);
  }

  async getTrips(): Promise<TripListItem[]> {
    return delay(TRIPS, 400);
  }

  async getTripById(id: string): Promise<TripListItem | null> {
    return delay(TRIPS.find((t) => t.id === id) ?? null, 300);
  }

  async acceptDuty(_dutyId: string): Promise<void> {
    await delay(null, 400);
  }

  async declineDuty(_dutyId: string, _reason: string): Promise<void> {
    await delay(null, 600);
  }

  async submitReadiness(_checklist: ReadinessChecklist): Promise<void> {
    this.readiness = "submitted";
    await delay(null, 900);
    this.readiness = "approved";
  }

  async getReadinessStatus(): Promise<"pending" | "submitted" | "approved"> {
    return delay(this.readiness, 200);
  }

  async startDuty(): Promise<void> {
    await delay(null, 500);
  }

  async verifyPickupOtp(code: string): Promise<boolean> {
    await delay(null, 700);
    return code === "123456";
  }

  async markArrivedAtDropoff(): Promise<void> {
    await delay(null, 500);
  }

  async getTripSummary(): Promise<{ distanceKm: number; durationLabel: string }> {
    return delay({ distanceKm: 57.5, durationLabel: "3 Hrs 30 mins" }, 400);
  }

  async returnToGarage(): Promise<void> {
    await delay(null, 800);
  }

  async closeDuty(): Promise<void> {
    await delay(null, 500);
  }
}
