import { compressPhoto } from "../util/imageCompression";

// The app's only image-optimization step (the backend persists whatever
// bytes it receives verbatim -- see FileService#saveFile on the core
// service). Locks in: resize triggers only when the source actually
// exceeds the cap, the longer side (not always width) is the one
// constrained, and a manipulation failure never blocks the caller.

const mockResize = jest.fn();
const mockRenderAsync = jest.fn();
const mockSaveAsync = jest.fn();

jest.mock("expo-image-manipulator", () => ({
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: (...args: unknown[]) => {
        mockResize(...args);
        return { renderAsync: mockRenderAsync };
      },
      renderAsync: mockRenderAsync,
    })),
  },
  SaveFormat: { JPEG: "jpeg" },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
  mockSaveAsync.mockResolvedValue({ uri: "file://compressed.jpg" });
});

test("resizes a landscape photo by width when it exceeds the cap", async () => {
  const uri = await compressPhoto({ uri: "file://original.jpg", width: 4000, height: 3000 });

  expect(mockResize).toHaveBeenCalledWith({ width: 1600 });
  expect(mockSaveAsync).toHaveBeenCalledWith({ format: "jpeg", compress: 0.75 });
  expect(uri).toBe("file://compressed.jpg");
});

test("resizes a portrait photo by height (the actual longer side), not width", async () => {
  await compressPhoto({ uri: "file://original.jpg", width: 3000, height: 4000 });

  expect(mockResize).toHaveBeenCalledWith({ height: 1600 });
});

test("does not resize a photo already within the cap, but still re-compresses it", async () => {
  await compressPhoto({ uri: "file://original.jpg", width: 800, height: 600 });

  expect(mockResize).not.toHaveBeenCalled();
  expect(mockSaveAsync).toHaveBeenCalledWith({ format: "jpeg", compress: 0.75 });
});

test("falls back to the original URI when manipulation fails, rather than blocking the caller", async () => {
  mockRenderAsync.mockRejectedValue(new Error("native module unavailable"));

  const uri = await compressPhoto({ uri: "file://original.jpg", width: 4000, height: 3000 });

  expect(uri).toBe("file://original.jpg");
});

test("skips resize (but still compresses) when the picker reports no dimensions", async () => {
  await compressPhoto({ uri: "file://original.jpg", width: 0, height: 0 });

  expect(mockResize).not.toHaveBeenCalled();
  expect(mockSaveAsync).toHaveBeenCalled();
});
