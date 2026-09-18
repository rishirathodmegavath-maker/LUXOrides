import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// A modern phone camera capture is commonly 8-12MP+ (often several MB per
// JPEG); 1600px on the longer side keeps evidentiary detail fully legible
// (odometer digits, document text, damage close-ups) while cutting that
// down to a few hundred KB, which is what actually drives "quick sharing
// and less resource consumption" -- dimensions, not JPEG quality alone.
const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 0.75;

export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

// The app's one and only image-optimization step: the backend persists
// whatever bytes it receives verbatim (see FileService#saveFile on the
// core service -- deliberately not resized/recompressed server-side for
// any evidentiary photo category), so every duty-inspection, document, and
// odometer photo must already be a reasonable size by the time it leaves
// the device. Resizes only when the source actually exceeds the cap (a
// small gallery pick is left at its own dimensions) and always re-encodes
// as JPEG at a quality with no visible artifact at this resolution. Falls
// back to the original, uncompressed URI on any failure -- a duty or
// document submission must never be blocked by a compression hiccup.
export async function compressPhoto({ uri, width, height }: CapturedPhoto): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(uri);
    const longerSide = Math.max(width, height);

    if (longerSide > MAX_DIMENSION_PX && width > 0 && height > 0) {
      if (width >= height) {
        context.resize({ width: MAX_DIMENSION_PX });
      } else {
        context.resize({ height: MAX_DIMENSION_PX });
      }
    }

    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    return saved.uri;
  } catch {
    return uri;
  }
}
