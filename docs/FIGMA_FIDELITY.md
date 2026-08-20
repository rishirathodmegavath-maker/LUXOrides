# Figma Fidelity Report

Source: `chCkCwpDYO4NDcrs6li3sM` ("Luxorides App Design"), page "Chauffeur's App Design",
pulled via the Figma REST API (not guessed from the share link). This document lists every
place the shipped app deliberately differs from the Figma file, and why.

## 1. Which frames were treated as canonical

The file contains **two generations** of the flow on the same canvas: an early, unlabeled
draft (~40 screens, roughly y≈4200 in the file) and a reorganized, sitemap-labeled master
flow (~86 frames, y≥15000, under explicit "Onboarding Screens / Home Page Screens / Duty
Process / Help Screens" section banners). The reorganized cluster was treated as canonical,
confirmed against the "Chauffeur's App Sitemap" frame (node `8:392`), which documents the
same end-to-end journey. **The older draft cluster was not reproduced** — it predates the
reorganization and duplicates the canonical screens.

Similarly, where a reference frame existed in two versions (Colour Palette `4:2` vs `21:54`,
Typography `8:84` vs `52:194`), the more complete/refined version was used and the earlier
draft ignored.

## 2. Two bottom-tab screens have no Figma frame at all

**Activity** and **Profile** are both real tabs in the bottom nav (`Activity Nav Bar` /
`Profile Nav Bar` component states exist), but neither has a corresponding full-screen frame
anywhere in the file — not in the draft cluster, not in the reorganized one. `ActivityScreen`
(duty earnings/history) and `ProfileScreen` (driver identity card + settings) are original
content built to match the extracted design tokens and component library, not reproduced
pixel-for-pixel from a Figma frame. Both are marked with an explicit code comment.

## 3. Figma "state variant" frames were consolidated into dynamic screens

Many Figma frames are the same screen shown at different states (idle/focused/error/success),
exported as separate static frames. Rather than one React Native route per state — which
would mean the app pushes a new screen every time a spinner starts — these were implemented
as **one screen with real dynamic state**, driven by the mock service layer's actual
uploading/verifying/verified/failed responses. This is disclosed here because it changes how
many *routes* exist vs. how many Figma *frames* existed, even though every visual state is
still reachable and was built:

| Screens consolidated | Frames |
|---|---|
| `OtpScreen` | OTP Screen 01–05 (`669:7090`…`669:7383`) |
| `MobileNumberScreen` | Mobile No. Screen 01/02 (`669:6922`, `669:7006`) |
| `HomeScreen` | Home Page Online + 3× Home Page Offline exports |
| `OnboardingHubScreen` | Welcome Screen `671:8670` (0/4) + `671:8739` (1/4) |
| `DocUploadScreen` (×2, licence/Aadhaar) | Upload / Upload 3 / Error / Success frames per document |
| `ProfilePhotoScreen` | Capture / Review / Verifying / Verified / Failed / Submitted |
| `VehicleInteriorScreen` | Interior Page / Photo Page / Error Page |
| `LiveChatScreen` | 3 exported chat states (empty/typing/conversation) |
| `GarageMapScreen` | Garage Map + Garage Map Duty Complete |
| `FaqScreen` | The 5 "Expandable Box" size variants (now a real accordion) |

## 4. Explicit scope exclusions (per the Phase 1 brief)

- **No live maps / ORS.** Duty Start Map, Pickup/Drop-off Map, Back to Garage, and Garage Map
  all showed a real Google Map in Figma. They render `MapPreview`, a static placeholder,
  instead — wiring a real map SDK requires API keys and routing data explicitly out of scope
  for Phase 1.
- **No real QR generation.** The Payment QR screen and side-drawer payment panel show a
  placeholder icon in the QR frame rather than a real scannable QR code (no QR-rendering
  library was added for a Phase 1 mock flow).
- **Permission primers are UI-only.** Location/Notifications/Phone Calls/Camera primer
  screens exist and match the Figma copy/layout, but "Allow" advances the flow without
  triggering a real OS permission dialog (except camera, which does invoke the real picker
  permission at the moment of actual photo capture) — there's no location/notification
  backend in Phase 1 to make a real grant meaningful yet.

## 5. Typography substitution

The type scale (Geist, weights and sizes) was transcribed exactly from the Figma Typography
frame and is bundled as the real open-source Geist font. However, the brand wordmark moments
(splash screen, side-drawer header — "LUXORIDES / *Chauffeur*") used a licensed Fontspring
demo font, **"The Seasons,"** which cannot be legally redistributed in this app. It is
substituted with **Playfair Display** (Google Fonts, OFL), chosen for the same serif-caps +
italic-script pairing. This is the one deliberate typographic fidelity gap.

## 6. Icons and artwork

- Icons use `@expo/vector-icons` (Feather set), matched by eye to the simple line-icon style
  seen in the exports — not literal exports of Figma's own icon vectors (`Icons` frame, node
  `12:14`), so some glyph silhouettes differ slightly from the original.
- The Aadhaar/Driving Licence "sample card" illustrations in the entry screens are replaced
  with a simple bordered icon placeholder rather than recreated pixel-for-pixel.
- The login hero photo, welcome-screen line art, and offline-state illustration are real crops
  of the Figma-exported PNGs (not re-vectorized), so they're pixel-accurate but raster, not
  scalable/recolorable like the original vector art.

## 7. Not implemented in Phase 1

- Session persistence across app restarts (currently in-memory only — every fresh launch
  starts at the splash screen).
- Real bill/GST calculation — the Payment & Billing figures match the sampled Figma screen's
  mock numbers, not a computed fare engine.
