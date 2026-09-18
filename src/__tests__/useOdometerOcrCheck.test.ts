import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useOdometerOcrCheck } from "../hooks/useOdometerOcrCheck";

const mockRecognizeOdometerDigits = jest.fn();

jest.mock("../util/odometerOcr", () => {
  const actual = jest.requireActual("../util/odometerOcr");
  return {
    ...actual,
    recognizeOdometerDigits: (...args: unknown[]) => mockRecognizeOdometerDigits(...args),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useOdometerOcrCheck", () => {
  test("does not run OCR until a photo exists", async () => {
    await renderHook(() => useOdometerOcrCheck(undefined, "12580"));

    expect(mockRecognizeOdometerDigits).not.toHaveBeenCalled();
  });

  test("runs OCR once a photo is captured and flags a real mismatch", async () => {
    mockRecognizeOdometerDigits.mockResolvedValue("12480");

    const { result } = await renderHook(({ uri, km }: { uri: string; km: string }) => useOdometerOcrCheck(uri, km), {
      initialProps: { uri: "file://odo.jpg", km: "12580" },
    });

    await waitFor(() => expect(result.current.checking).toBe(false));

    expect(mockRecognizeOdometerDigits).toHaveBeenCalledWith("file://odo.jpg");
    expect(result.current.recognizedDigits).toBe("12480");
    expect(result.current.mismatch).toBe(true);
  });

  test("does not re-run OCR just because the typed value changed -- only the mismatch flag updates", async () => {
    mockRecognizeOdometerDigits.mockResolvedValue("12580");

    const { result, rerender } = await renderHook(({ uri, km }: { uri: string; km: string }) => useOdometerOcrCheck(uri, km), {
      initialProps: { uri: "file://odo.jpg", km: "" },
    });

    await waitFor(() => expect(result.current.recognizedDigits).toBe("12580"));
    expect(result.current.mismatch).toBe(false);

    await act(async () => {
      rerender({ uri: "file://odo.jpg", km: "99999" });
    });

    expect(mockRecognizeOdometerDigits).toHaveBeenCalledTimes(1);
    expect(result.current.mismatch).toBe(true);
  });

  test("retaking the photo re-runs OCR", async () => {
    mockRecognizeOdometerDigits.mockResolvedValue("12580");

    const { result, rerender } = await renderHook(({ uri, km }: { uri: string; km: string }) => useOdometerOcrCheck(uri, km), {
      initialProps: { uri: "file://odo-1.jpg", km: "12580" },
    });

    await waitFor(() => expect(result.current.recognizedDigits).toBe("12580"));

    mockRecognizeOdometerDigits.mockResolvedValue("40200");
    await act(async () => {
      rerender({ uri: "file://odo-2.jpg", km: "12580" });
    });

    await waitFor(() => expect(result.current.recognizedDigits).toBe("40200"));
    expect(mockRecognizeOdometerDigits).toHaveBeenCalledTimes(2);
    expect(result.current.mismatch).toBe(true);
  });
});
