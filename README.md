# LuxoRides Chauffeur App

React Native driver app for LuxoRides, built with Expo (TypeScript) from the
[Figma design file](https://www.figma.com/design/chCkCwpDYO4NDcrs6li3sM).

Auth, driver profile/session, onboarding, and the entire duty lifecycle (accept/decline,
document upload/verification, pickup OTP, both arrival checkpoints, start/end with odometer
capture, cash/QR payment, return-to-garage, close) are wired to the **real Fleetovo backend**
-- see `src/services/index.ts`. The one remaining exception is support: FAQs are real static
app copy, but live chat has no backend yet and is an honest static hand-off rather than a
simulated conversation (see `LiveChatScreen`'s own comment).

See [`docs/FIGMA_FIDELITY.md`](./docs/FIGMA_FIDELITY.md) for the full list of Figma details
that could not be reproduced exactly, and why.

## Configuration

Copy `.env.example` to `.env` and fill in:

- `EXPO_PUBLIC_API_BASE_URL` -- the backend's **LAN IP** (not `localhost`; a physical device
  or emulator can't resolve your dev machine's localhost), e.g. `http://192.168.1.20:8443`.
- `EXPO_PUBLIC_ORG_ID` -- the org id your local backend seeds for driver login (`demo` if you
  ran the [backend's dev seeder](../fleetovo-core-service-main#run-locally)).

Production builds never read this file -- see `src/config/env.ts` and `eas.json`.

## Running the app

This is a **real native app**, not an Expo-Go-only prototype — it uses `expo-dev-client` and
native modules (image picker, fonts, gesture handler) that Expo Go does not support.

```bash
npm install

# Generates the native android/ (and, on macOS, ios/) projects.
# Not committed to git — regenerate any time with this command.
npx expo prebuild

# Run on a connected device/emulator (requires Android Studio/SDK, or Xcode on macOS):
npx expo run:android
npx expo run:ios
```

`npx expo start` alone will *not* work fully since the app uses native modules outside the
Expo Go sandbox — use `run:android` / `run:ios` (or a custom dev client build) instead.

## Building an installable binary

Via EAS (requires an Expo account, `eas login`, and `eas env:create` for the `production`
profile's environment variables -- see `eas.json` and `.env.example`):

```bash
npx eas build --platform android --profile development   # dev-client build, internal
npx eas build --platform android --profile preview        # internal test build
npx eas build --platform android --profile production     # store-ready, strips expo-dev-client
```

Or locally, once `expo prebuild` has generated `android/` and the Android SDK is installed:

```bash
cd android && ./gradlew assembleDebug
```

## Project structure

```
src/
  theme/        Design tokens transcribed from the Figma Colour Palette / Typography /
                 Components frames (colors, type scale, spacing, radius).
  components/    Shared UI kit (Button, TextField, OtpField, Dropdown, PhotoCapture,
                 SlideToConfirm, MapPreview, QrPaymentCard, …) — one implementation per
                 Figma component, reused across every screen that needs it.
  services/      `types.ts` defines the domain interfaces (AuthService, OnboardingService,
                 DutyService, SupportService); `real/` implements Auth/Driver/Onboarding/Duty
                 against the real Fleetovo backend, `mock/` still backs the FAQ/chat support
                 surface. `services/index.ts` is the single place that wires interface ->
                 implementation.
  store/         Zustand stores for session, onboarding progress, and active duty state.
  navigation/    Stack/tab/drawer navigators. `RootNavigator` gates which stack is mounted
                 off real app state (session / permissions / approval) — the standard
                 React Navigation auth-flow pattern — instead of manual cross-stack navigate().
  screens/       One folder per flow: auth, permissions, onboarding, home, duty, help.
assets/
  fonts/         Real Geist (OFL) font files.
  brand/         Logo marks + illustration/photo crops sourced from the Figma exports.
docs/
  figma-reference/   Every canonical screen exported from Figma as a 2x PNG, kept as a
                      permanent visual reference for the team.
  FIGMA_FIDELITY.md  Discrepancy report.
```

## Wiring up the remaining support/chat backend

Every screen depends only on the interfaces in `src/services/types.ts`, obtained through
`src/services/index.ts` -- the same pattern already used to swap Auth/Driver/Onboarding/Duty
from mock to real. Support/chat is the one piece still pending a real backend:

1. Write a class implementing `SupportService` against the real HTTP API.
2. Swap the instantiation in `src/services/index.ts`.
3. Nothing in `src/screens` or `src/components` needs to change.

The same applies to maps/ORS (replace `MapPreview` with a real map component) and payments
(replace `QrPaymentCard`'s placeholder with a real QR-code renderer fed by the payment API).
