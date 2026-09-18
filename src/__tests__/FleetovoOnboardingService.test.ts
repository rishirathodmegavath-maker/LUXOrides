import { FleetovoOnboardingService } from "../services/real/FleetovoOnboardingService";

// Onboarding data-loss fix -- saveProfileBasics/saveGarageLocation previously
// delegated to MockOnboardingService (in-memory, lost on restart). Both now
// go through the same real driverApi.updateProfile ProfileInfoScreen already
// uses, and getGarageOptions reads the real, org-configured CityGarage list.

jest.mock("../api/driver.api", () => ({
  driverApi: {
    updateProfile: jest.fn(),
    getGarages: jest.fn(),
  },
}));

// FleetovoOnboardingService also imports document.api (uploadDocument/
// getDocumentStatus, untested here) -- its real module reads env.ts at
// import time, which throws outside a configured environment. Mocked purely
// so the module graph loads; nothing in this file exercises it.
jest.mock("../api/document.api", () => ({
  documentApi: {
    getStatus: jest.fn(),
    upload: jest.fn(),
  },
}));

jest.mock("../util/network", () => ({
  assertOnline: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { driverApi } = require("../api/driver.api");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { assertOnline } = require("../util/network");

beforeEach(() => {
  jest.clearAllMocks();
  driverApi.updateProfile.mockResolvedValue({});
});

describe("FleetovoOnboardingService.saveProfileBasics", () => {
  test("splits a two-word full name into firstName/lastName and sends email + experience", async () => {
    await new FleetovoOnboardingService().saveProfileBasics({
      name: "Raja Kumar",
      email: "raja@example.com",
      experienceYears: 5,
    });

    expect(assertOnline).toHaveBeenCalled();
    expect(driverApi.updateProfile).toHaveBeenCalledWith({
      name: { salutation: null, firstName: "Raja", lastName: "Kumar" },
      email: "raja@example.com",
      experienceYears: 5,
    });
  });

  test("a single-word name becomes firstName with an empty lastName, not dropped or thrown on", async () => {
    await new FleetovoOnboardingService().saveProfileBasics({ name: "Cher" });

    expect(driverApi.updateProfile).toHaveBeenCalledWith({
      name: { salutation: null, firstName: "Cher", lastName: "" },
      email: null,
      experienceYears: null,
    });
  });

  test("a multi-word name keeps everything after the first word as the last name", async () => {
    await new FleetovoOnboardingService().saveProfileBasics({ name: "Raja Kumar Singh" });

    expect(driverApi.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ name: { salutation: null, firstName: "Raja", lastName: "Kumar Singh" } })
    );
  });

  test("omitted email/experienceYears are sent as null, never silently skipped", async () => {
    await new FleetovoOnboardingService().saveProfileBasics({ name: "Raja Kumar" });

    const [payload] = driverApi.updateProfile.mock.calls[0];
    expect(payload.email).toBeNull();
    expect(payload.experienceYears).toBeNull();
  });

  test("propagates a real backend failure rather than swallowing it", async () => {
    driverApi.updateProfile.mockRejectedValueOnce(new Error("Validation failed"));

    await expect(new FleetovoOnboardingService().saveProfileBasics({ name: "Raja Kumar" })).rejects.toThrow(
      "Validation failed"
    );
  });
});

describe("FleetovoOnboardingService.getGarageOptions", () => {
  test("maps real CityGarage records to display-ready options", async () => {
    driverApi.getGarages.mockResolvedValue([
      { id: "garage-1", city: "Noida", garageLocation: { formattedAddress: "Sector 62, Noida", googlePlaceId: null, latitude: null, longitude: null } },
    ]);

    const options = await new FleetovoOnboardingService().getGarageOptions();

    expect(options).toEqual([{ id: "garage-1", garageName: "Noida", garageAddress: "Sector 62, Noida" }]);
  });

  test("falls back to the address when city is missing, and to city when address is missing", async () => {
    driverApi.getGarages.mockResolvedValue([
      { id: "garage-1", city: null, garageLocation: { formattedAddress: "Sector 62, Noida", googlePlaceId: null, latitude: null, longitude: null } },
      { id: "garage-2", city: "Gurugram", garageLocation: null },
    ]);

    const options = await new FleetovoOnboardingService().getGarageOptions();

    expect(options[0]).toEqual({ id: "garage-1", garageName: "Sector 62, Noida", garageAddress: "Sector 62, Noida" });
    expect(options[1]).toEqual({ id: "garage-2", garageName: "Gurugram", garageAddress: "Gurugram" });
  });

  test("an empty org garage list is a real empty array, not an error", async () => {
    driverApi.getGarages.mockResolvedValue([]);

    const options = await new FleetovoOnboardingService().getGarageOptions();

    expect(options).toEqual([]);
  });
});

describe("FleetovoOnboardingService.saveGarageLocation", () => {
  test("persists the selected garage's real address through updateProfile", async () => {
    await new FleetovoOnboardingService().saveGarageLocation({
      garageName: "Noida",
      garageAddress: "Sector 62, Noida",
    });

    expect(assertOnline).toHaveBeenCalled();
    expect(driverApi.updateProfile).toHaveBeenCalledWith({
      garageLocation: { formattedAddress: "Sector 62, Noida", googlePlaceId: null, latitude: null, longitude: null },
    });
  });
});
