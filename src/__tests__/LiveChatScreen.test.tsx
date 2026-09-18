import React from "react";
import { Linking } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { LiveChatScreen } from "../screens/help/LiveChatScreen";
import { SUPPORT_PHONE_TEL, SUPPORT_SMS_URI } from "../constants/support";

// Driver App audit: this screen used to be a fully local, fake chat
// (MockSupportService) -- canned "we're looking into this" replies, a
// scripted "Support is typing…" indicator, presented as "Live Support" as
// if a real agent were on the other end. There's no real chat/ticket
// backend to replace it with, so it's now an honest hand-off to the app's
// one real support channel (same number HelpScreen/ErrorBoundary dial),
// offered as both a call and a text.

const goBack = jest.fn();
const navigation = { goBack } as unknown as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LiveChatScreen", () => {
  test("shows an honest 'not available yet' state -- no fake typing indicator or canned reply", async () => {
    await render(<LiveChatScreen navigation={navigation} route={undefined as never} />);

    expect(screen.getByText("In-app chat isn't available yet")).toBeTruthy();
    expect(screen.queryByText("Support is typing…")).toBeNull();
    expect(screen.queryByText(/looking into this/i)).toBeNull();
    // No message thread/composer -- there's nowhere real for a typed
    // message to go, so this screen never pretends otherwise.
    expect(screen.queryByPlaceholderText("Type a message…")).toBeNull();
  });

  test("Call Support opens the real, existing support dialer number", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);

    await render(<LiveChatScreen navigation={navigation} route={undefined as never} />);
    fireEvent.press(screen.getByText(/Call Support/));

    await waitFor(() => expect(openURL).toHaveBeenCalledWith(SUPPORT_PHONE_TEL));
  });

  test("Text Support opens the device SMS app addressed to the same real number", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);

    await render(<LiveChatScreen navigation={navigation} route={undefined as never} />);
    fireEvent.press(screen.getByText("Text Support"));

    await waitFor(() => expect(openURL).toHaveBeenCalledWith(SUPPORT_SMS_URI));
  });

  test("back navigation still works", async () => {
    await render(<LiveChatScreen navigation={navigation} route={undefined as never} />);

    fireEvent.press(screen.getByLabelText("Back"));

    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
