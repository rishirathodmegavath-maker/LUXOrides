import { track } from "../services/analytics";
import { Sentry } from "../config/sentry";

jest.mock("../config/sentry", () => ({
  Sentry: { addBreadcrumb: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("track", () => {
  test("records the event as a Sentry breadcrumb, not a new network call/SDK", () => {
    track("duty_accepted", { dutyId: "duty-1" });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "analytics",
      message: "duty_accepted",
      data: { dutyId: "duty-1" },
      level: "info",
    });
  });

  test("works with no properties", () => {
    track("app_open");

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "analytics",
      message: "app_open",
      data: undefined,
      level: "info",
    });
  });
});
