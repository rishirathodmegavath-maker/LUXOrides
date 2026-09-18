import TextRecognition from "@react-native-ml-kit/text-recognition";

// On-device OCR (ML Kit, no network call) over the odometer photo, used only
// to flag a possible typo/fraud in the manually-typed reading -- never to
// auto-fill it. A worn/glare-hit/analog dial can genuinely misread, so this
// picks the longest run of 3-7 digits in the recognized text as its best
// guess at the odometer number, rather than trying to segment the actual
// digital-display region (no bounding-box/font-size heuristics here). Falls
// back to null on any failure (including the native module not being linked
// in the installed build), matching imageCompression's fallback-never-blocks
// convention.
export async function recognizeOdometerDigits(photoUri: string): Promise<string | null> {
  try {
    const result = await TextRecognition.recognize(photoUri);
    // Boundary-anchored so an 8+ digit run (e.g. a phone number in frame)
    // is excluded entirely rather than truncate-matched into a plausible-
    // looking 7-digit substring.
    const matches = result.text.match(/(?<!\d)\d{3,7}(?!\d)/g);
    if (!matches || matches.length === 0) {
      return null;
    }
    return matches.reduce((longest, candidate) => (candidate.length > longest.length ? candidate : longest));
  } catch {
    return null;
  }
}

// Odometer displays don't show leading zeros the way a driver might type
// them (or vice versa) -- "07530" typed vs "7530" read back should not be
// flagged as a mismatch.
function stripLeadingZeros(digits: string): string {
  const stripped = digits.replace(/^0+/, "");
  return stripped.length > 0 ? stripped : "0";
}

export function isOdometerMismatch(typedKm: string, recognizedDigits: string | null): boolean {
  if (!typedKm || !recognizedDigits) {
    return false;
  }
  return stripLeadingZeros(typedKm) !== stripLeadingZeros(recognizedDigits);
}
