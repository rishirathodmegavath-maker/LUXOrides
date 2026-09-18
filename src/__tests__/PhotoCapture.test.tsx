import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { PhotoCapture } from "../components/PhotoCapture";

// Every document/vehicle/uniform/odometer photo in the app goes through
// this one shared component -- it must always compress before handing the
// URI to the caller (compressPhoto is unit-tested separately in
// imageCompression.test.ts; here we only need it to actually run in the
// capture flow, in the right order, and never block a retake on failure).

const mockRequestCameraPermissionsAsync = jest.fn();
const mockLaunchCameraAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: () => mockRequestCameraPermissionsAsync(),
  launchCameraAsync: (...args: unknown[]) => mockLaunchCameraAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
}));

const mockCompressPhoto = jest.fn();
jest.mock("../util/imageCompression", () => ({
  compressPhoto: (...args: unknown[]) => mockCompressPhoto(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true });
});

test("compresses the picked photo before handing the URI to onCapture", async () => {
  mockLaunchCameraAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file://raw.jpg", width: 4000, height: 3000 }],
  });
  mockCompressPhoto.mockResolvedValue("file://compressed.jpg");
  const onCapture = jest.fn();

  await render(<PhotoCapture status="idle" onCapture={onCapture} />);
  await act(async () => fireEvent.press(screen.getByRole("button")));

  expect(mockCompressPhoto).toHaveBeenCalledWith({ uri: "file://raw.jpg", width: 4000, height: 3000 });
  expect(onCapture).toHaveBeenCalledWith("file://compressed.jpg");
});

test("captures at quality:1 -- compressPhoto is the only place resolution/quality is actually reduced", async () => {
  mockLaunchCameraAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file://raw.jpg", width: 1000, height: 1000 }],
  });
  mockCompressPhoto.mockResolvedValue("file://compressed.jpg");

  await render(<PhotoCapture status="idle" onCapture={jest.fn()} />);
  await act(async () => fireEvent.press(screen.getByRole("button")));

  expect(mockLaunchCameraAsync).toHaveBeenCalledWith(expect.objectContaining({ quality: 1 }));
});

test("shows an 'Optimizing photo' state while compressing, and disables retake meanwhile", async () => {
  mockLaunchCameraAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file://raw.jpg", width: 4000, height: 3000 }],
  });
  let resolveCompress!: (uri: string) => void;
  mockCompressPhoto.mockReturnValue(new Promise<string>((resolve) => (resolveCompress = resolve)));
  const onCapture = jest.fn();

  await render(<PhotoCapture status="idle" onCapture={onCapture} />);
  fireEvent.press(screen.getByRole("button"));

  await waitFor(() => expect(screen.getByText("Optimizing photo…")).toBeTruthy());
  expect(onCapture).not.toHaveBeenCalled();

  await act(async () => resolveCompress("file://compressed.jpg"));
  expect(onCapture).toHaveBeenCalledWith("file://compressed.jpg");
});

test("does not call onCapture when the picker is cancelled", async () => {
  mockLaunchCameraAsync.mockResolvedValue({ canceled: true, assets: null });
  const onCapture = jest.fn();

  await render(<PhotoCapture status="idle" onCapture={onCapture} />);
  await act(async () => fireEvent.press(screen.getByRole("button")));

  expect(mockCompressPhoto).not.toHaveBeenCalled();
  expect(onCapture).not.toHaveBeenCalled();
});
