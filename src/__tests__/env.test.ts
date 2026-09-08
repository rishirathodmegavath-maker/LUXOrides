// Phase 3 production-readiness coverage for src/config/env.ts: a production
// (non-__DEV__) bundle must fail fast on exactly the dangerous values the
// Phase 3 audit found in real local config (a private-LAN http:// URL, the
// "demo" org) -- see .env.example and the Phase 3 report. Development must
// keep working completely unchanged, since that's the same LAN-IP/"demo"
// combination every developer actually runs locally.

const ORIGINAL_ENV = process.env;

function setDev(value: boolean): void {
  // __DEV__ is a React Native/Metro global, not a real Node global -- tests
  // set it directly since there's no bundler here to inject it. globalThis
  // (not `global`, which isn't typed without @types/node) works in both the
  // Jest/Node test environment and matches how RN itself exposes __DEV__.
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
}

function loadEnv(): { apiBaseUrl: string; orgId: string; wsBaseUrl: string } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must re-require after resetModules so env.ts's module-level validation reruns with the new process.env/__DEV__
  return require("../config/env").env;
}

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("env -- development runtime (__DEV__ true)", () => {
  beforeEach(() => setDev(true));

  test("accepts the real local-dev shape: a private-LAN http URL and the demo org", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://172.16.1.196:8443";
    process.env.EXPO_PUBLIC_ORG_ID = "demo";

    const env = loadEnv();

    expect(env.apiBaseUrl).toBe("http://172.16.1.196:8443");
    expect(env.orgId).toBe("demo");
  });

  test("still throws if the API base URL is entirely missing", () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    process.env.EXPO_PUBLIC_ORG_ID = "demo";

    expect(loadEnv).toThrow(/EXPO_PUBLIC_API_BASE_URL/);
  });

  test("still throws if the API base URL is blank", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "   ";
    process.env.EXPO_PUBLIC_ORG_ID = "demo";

    expect(loadEnv).toThrow(/EXPO_PUBLIC_API_BASE_URL/);
  });

  test("still throws if the org id is entirely missing", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://172.16.1.196:8443";
    delete process.env.EXPO_PUBLIC_ORG_ID;

    expect(loadEnv).toThrow(/EXPO_PUBLIC_ORG_ID/);
  });
});

describe("env -- production runtime (__DEV__ false)", () => {
  beforeEach(() => setDev(false));

  test("accepts a valid HTTPS API URL and a non-demo org, deriving a WSS WebSocket URL", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.luxorides.com";
    process.env.EXPO_PUBLIC_ORG_ID = "luxorides";

    const env = loadEnv();

    expect(env.apiBaseUrl).toBe("https://api.luxorides.com");
    expect(env.wsBaseUrl).toBe("wss://api.luxorides.com");
  });

  test("rejects a plain-HTTP API URL", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://api.luxorides.com";
    process.env.EXPO_PUBLIC_ORG_ID = "luxorides";

    expect(loadEnv).toThrow(/HTTPS/);
  });

  test("rejects a localhost API URL", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://localhost:8443";
    process.env.EXPO_PUBLIC_ORG_ID = "luxorides";

    expect(loadEnv).toThrow(/HTTPS/);
  });

  test("rejects an https URL that still points at a private-LAN address", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://192.168.1.50:8443";
    process.env.EXPO_PUBLIC_ORG_ID = "luxorides";

    expect(loadEnv).toThrow(/private-network/);
  });

  test("rejects the historical private-LAN dev URL specifically", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://172.16.1.196:8443";
    process.env.EXPO_PUBLIC_ORG_ID = "luxorides";

    expect(loadEnv).toThrow(/HTTPS/);
  });

  test('rejects the "demo" org even with an otherwise-valid production URL', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.luxorides.com";
    process.env.EXPO_PUBLIC_ORG_ID = "demo";

    expect(loadEnv).toThrow(/EXPO_PUBLIC_ORG_ID/);
  });

  test('rejects "demo" regardless of casing/whitespace', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.luxorides.com";
    process.env.EXPO_PUBLIC_ORG_ID = "  Demo  ";

    expect(loadEnv).toThrow(/EXPO_PUBLIC_ORG_ID/);
  });

  test("still throws if the API base URL is missing, before the production checks even run", () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    process.env.EXPO_PUBLIC_ORG_ID = "luxorides";

    expect(loadEnv).toThrow(/EXPO_PUBLIC_API_BASE_URL/);
  });
});
