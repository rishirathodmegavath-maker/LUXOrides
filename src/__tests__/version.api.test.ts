import { versionApi } from "../api/version.api";

jest.mock("../api/client", () => ({
  publicApi: { get: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { publicApi } = require("../api/client");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("versionApi.checkVersion", () => {
  test("calls the unauthenticated /public/app/version endpoint with the installed version as a query param", async () => {
    publicApi.get.mockResolvedValueOnce({ minimumSupportedVersion: "1.0.0", latestVersion: "1.2.0", forceUpdate: false });

    await versionApi.checkVersion("1.1.0");

    expect(publicApi.get).toHaveBeenCalledWith("/public/app/version?installedVersion=1.1.0");
  });

  test("URL-encodes the installed version", async () => {
    publicApi.get.mockResolvedValueOnce({ minimumSupportedVersion: "1.0.0", latestVersion: "1.0.0", forceUpdate: false });

    await versionApi.checkVersion("1.0.0+build 5");

    expect(publicApi.get).toHaveBeenCalledWith("/public/app/version?installedVersion=1.0.0%2Bbuild%205");
  });

  test("resolves with the backend's response verbatim", async () => {
    const response = { minimumSupportedVersion: "2.0.0", latestVersion: "2.3.0", forceUpdate: true };
    publicApi.get.mockResolvedValueOnce(response);

    await expect(versionApi.checkVersion("1.0.0")).resolves.toEqual(response);
  });

  test("a rejection (network/server failure) propagates -- the caller decides the fail-safe policy", async () => {
    publicApi.get.mockRejectedValueOnce(new Error("Network request failed"));

    await expect(versionApi.checkVersion("1.0.0")).rejects.toThrow("Network request failed");
  });
});
