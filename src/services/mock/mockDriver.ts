import { DriverProfile, DriverServiceApi } from "../types";
import { delay } from "./utils";

export class MockDriverService implements DriverServiceApi {
  async getProfile(): Promise<DriverProfile> {
    return delay(
      {
        id: "driver_9290930909",
        name: "Raja Kumar",
        phone: "+91 9290930909",
        email: "raja.kumar@example.com",
        experienceYears: 6,
        garageName: "Garage Inc., New Delhi",
        garageAddress: "Africa Ave, Hauz Khas, New Delhi",
        approvalStatus: "approved",
      },
      400
    );
  }
}
