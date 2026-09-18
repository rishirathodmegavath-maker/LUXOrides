import { isOdometerMismatch, recognizeOdometerDigits } from "../util/odometerOcr";

// On-device OCR is a fraud/typo nudge, never a submission gate -- locks in:
// the "longest digit run" extraction heuristic, leading-zero tolerance, and
// that any recognition failure (including the native module not being
// linked in the installed build) degrades to "no check", not a crash.

const mockRecognize = jest.fn();

jest.mock("@react-native-ml-kit/text-recognition", () => ({
  __esModule: true,
  default: { recognize: (...args: unknown[]) => mockRecognize(...args) },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("recognizeOdometerDigits", () => {
  test("returns the longest digit run in the recognized text", async () => {
    mockRecognize.mockResolvedValue({ text: "ODO\n12580\n2026", blocks: [] });

    const digits = await recognizeOdometerDigits("file://odometer.jpg");

    expect(digits).toBe("12580");
  });

  test("ignores runs shorter than 3 digits or longer than 7", async () => {
    mockRecognize.mockResolvedValue({ text: "12\n45890\n12345678", blocks: [] });

    const digits = await recognizeOdometerDigits("file://odometer.jpg");

    expect(digits).toBe("45890");
  });

  test("returns null when no plausible digit run is found", async () => {
    mockRecognize.mockResolvedValue({ text: "KM", blocks: [] });

    const digits = await recognizeOdometerDigits("file://odometer.jpg");

    expect(digits).toBeNull();
  });

  test("returns null rather than throwing when recognition fails (e.g. native module unavailable)", async () => {
    mockRecognize.mockRejectedValue(new Error("native module unavailable"));

    const digits = await recognizeOdometerDigits("file://odometer.jpg");

    expect(digits).toBeNull();
  });
});

describe("isOdometerMismatch", () => {
  test("flags a genuine mismatch", () => {
    expect(isOdometerMismatch("12580", "12480")).toBe(true);
  });

  test("does not flag an exact match", () => {
    expect(isOdometerMismatch("12580", "12580")).toBe(false);
  });

  test("tolerates a leading-zero difference", () => {
    expect(isOdometerMismatch("07530", "7530")).toBe(false);
  });

  test("does not flag anything before OCR has produced a result", () => {
    expect(isOdometerMismatch("12580", null)).toBe(false);
  });

  test("does not flag anything before the driver has typed a value", () => {
    expect(isOdometerMismatch("", "12580")).toBe(false);
  });
});
