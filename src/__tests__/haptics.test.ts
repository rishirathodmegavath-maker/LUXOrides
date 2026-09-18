import * as Haptics from "expo-haptics";
import { successHaptic, warningHaptic } from "../util/haptics";

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: "success", Warning: "warning" },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("haptics", () => {
  test("successHaptic fires a Success notification haptic", () => {
    successHaptic();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith("success");
  });

  test("warningHaptic fires a Warning notification haptic", () => {
    warningHaptic();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith("warning");
  });

  test("a rejected haptic call never throws/surfaces -- best-effort only", async () => {
    (Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(new Error("unsupported"));

    expect(() => successHaptic()).not.toThrow();
  });
});
