import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { FaqScreen } from "../screens/help/FaqScreen";

// Reliability hardening: getFaqs() failure produced an empty FAQ list
// indistinguishable from the API genuinely returning zero FAQs.

jest.mock("../services", () => ({
  supportService: {
    getFaqs: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { supportService } = require("../services");

const goBack = jest.fn();
const navigation = { goBack } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FaqScreen", () => {
  test("a genuinely empty FAQ list renders with no error banner", async () => {
    supportService.getFaqs.mockResolvedValue([]);

    await render(<FaqScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(supportService.getFaqs).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Couldn't load FAQs.")).toBeNull();
  });

  test("a load failure shows a distinct retryable error", async () => {
    supportService.getFaqs.mockRejectedValueOnce(new Error("Network request failed"));

    await render(<FaqScreen navigation={navigation} route={undefined as never} />);

    await waitFor(() => expect(screen.getByText("Couldn't load FAQs.")).toBeTruthy());

    supportService.getFaqs.mockResolvedValueOnce([{ id: "1", question: "How do I start a duty?", answer: "Go online." }]);
    await waitFor(() => fireEvent.press(screen.getByText("Retry")));

    await waitFor(() => expect(screen.getByText("How do I start a duty?")).toBeTruthy());
    expect(screen.queryByText("Couldn't load FAQs.")).toBeNull();
    expect(supportService.getFaqs).toHaveBeenCalledTimes(2);
  });
});
