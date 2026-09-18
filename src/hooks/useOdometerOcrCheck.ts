import { useEffect, useState } from "react";
import { isOdometerMismatch, recognizeOdometerDigits } from "../util/odometerOcr";

export interface OdometerOcrCheck {
  checking: boolean;
  mismatch: boolean;
  recognizedDigits: string | null;
}

interface Result {
  forUri: string;
  digits: string | null;
}

// Shared by DutyStartMapScreen and DropOffScreen -- both pair a typed
// odometer reading with a required photo of the same dial. Re-runs OCR only
// when the photo itself changes (the native recognize() call is the
// expensive part); the mismatch comparison is cheap and recomputed on every
// render so correcting the typed value re-checks it instantly. This is a
// nudge, not a submission gate -- see odometerOcr.ts for why.
//
// `checking` and `recognizedDigits` are both derived from comparing the
// latest resolved result's URI against the current photoUri, rather than
// tracked with their own setState calls -- that keeps the effect's only
// state update inside the async .then() callback (no synchronous setState
// in the effect body), and means a cleared photo or a still-in-flight retake
// both fall out of the comparison for free, with no separate reset needed.
export function useOdometerOcrCheck(photoUri: string | undefined, typedKm: string): OdometerOcrCheck {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!photoUri) {
      return;
    }

    let cancelled = false;

    recognizeOdometerDigits(photoUri).then((digits) => {
      if (!cancelled) {
        setResult({ forUri: photoUri, digits });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [photoUri]);

  const recognizedDigits = result && result.forUri === photoUri ? result.digits : null;
  const checking = !!photoUri && (!result || result.forUri !== photoUri);

  return {
    checking,
    mismatch: isOdometerMismatch(typedKm, recognizedDigits),
    recognizedDigits,
  };
}
