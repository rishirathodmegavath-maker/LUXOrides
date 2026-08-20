import { TextStyle } from "react-native";

// Type scale transcribed from the Figma "Typography" frame (node 52:194, the
// refined scale — node 8:84 was an earlier font-exploration draft).
// Primary UI font: Geist (real OFL font files bundled in assets/fonts).
// Figma also used a licensed serif/script face ("The Seasons") for brand
// wordmark moments only; that font cannot be redistributed, so brand text
// substitutes Playfair Display (see App.tsx font loading + BrandWordmark).
export const fontFamily = {
  thin: "Geist-Thin",
  light: "Geist-Light",
  regular: "Geist-Regular",
  medium: "Geist-Medium",
  semiBold: "Geist-SemiBold",
  bold: "Geist-Bold",
  black: "Geist-Black",
  displaySerif: "PlayfairDisplay_600SemiBold",
  displaySerifItalic: "PlayfairDisplay_600SemiBold_Italic",
} as const;

type TypeToken = Pick<TextStyle, "fontFamily" | "fontSize" | "lineHeight" | "letterSpacing">;

export const type: Record<
  "display" | "h1" | "h2" | "h3" | "h4" | "body1" | "body2" | "body3" | "button" | "caption" | "label",
  TypeToken
> = {
  display: { fontFamily: fontFamily.bold, fontSize: 36, lineHeight: 44 },
  h1: { fontFamily: fontFamily.semiBold, fontSize: 30, lineHeight: 38 },
  h2: { fontFamily: fontFamily.semiBold, fontSize: 24, lineHeight: 30 },
  h3: { fontFamily: fontFamily.semiBold, fontSize: 20, lineHeight: 28 },
  h4: { fontFamily: fontFamily.semiBold, fontSize: 18, lineHeight: 26 },
  body1: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  body2: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  body3: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fontFamily.semiBold, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
};
