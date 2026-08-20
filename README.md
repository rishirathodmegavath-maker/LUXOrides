# LuxoRides Chauffeur App (Phase 1)

Standalone React Native driver app for LuxoRides, built with Expo (TypeScript) from the
[Figma design file](https://www.figma.com/design/chCkCwpDYO4NDcrs6li3sM). **Phase 1**: no
backend, LuxoRides API, ORS, or payment gateway integration — everything runs against an
isolated mock service layer designed to be swapped for real APIs without touching any screen
or component code.

See [`docs/FIGMA_FIDELITY.md`](./docs/FIGMA_FIDELITY.md) for the full list of Figma details
that could not be reproduced exactly, and why.

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

# Or build installable binaries via EAS:
npx eas build --platform android --profile development
```

`npx expo start` alone will *not* work fully since the app uses native modules outside the
Expo Go sandbox — use `run:android` / `run:ios` (or a custom dev client build) instead.

### Verification run in this environment

This sandbox has no Android SDK/emulator or Xcode, so on-device visual QA could not be done
here. What *was* verified:

- `npx tsc --noEmit` — clean, zero errors.
- `npx eslint src App.tsx` — clean, zero errors/warnings.
- `npx expo export --platform android` — Metro bundles all 1584 modules with no errors.
- `npx expo prebuild --platform android` — generates a valid native Android project.

Run `npx expo run:android` (or `eas build`) on a machine with the Android SDK installed to do
the final on-device pass.

## Project structure

```
src/
  theme/        Design tokens transcribed from the Figma Colour Palette / Typography /
                 Components frames (colors, type scale, spacing, radius).
  components/    Shared UI kit (Button, TextField, OtpField, Dropdown, PhotoCapture,
                 SlideToConfirm, MapPreview, QrPaymentCard, …) — one implementation per
                 Figma component, reused across every screen that needs it.
  services/      Mock backend. `types.ts` defines the domain interfaces (AuthService,
                 OnboardingService, DutyService, PaymentService, SupportService); `mock/`
                 implements each against in-memory data with simulated network latency.
                 `services/index.ts` is the single place that wires interface -> implementation.
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

## Swapping in real backends later

Every screen depends only on the interfaces in `src/services/types.ts`, obtained through
`src/services/index.ts`. To wire up the real LuxoRides/Fleetovo backend in a later phase:

1. Write a new class implementing the relevant interface (e.g. `class ApiAuthService implements AuthService`) against the real HTTP API.
2. Swap the instantiation in `src/services/index.ts` (`export const authService: AuthService = new ApiAuthService(...)`).
3. Nothing in `src/screens` or `src/components` needs to change.

The same applies to maps/ORS (replace `MapPreview` with a real map component) and payments
(replace `QrPaymentCard`'s placeholder with a real QR-code renderer fed by the payment API).
